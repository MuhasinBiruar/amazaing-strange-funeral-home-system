// Pure, in-memory generation of the demo data. No database access here: every
// row gets a *local* id (its index in its table) and foreign keys hold local
// ids. `write.ts` swaps them for real ids when inserting.
//
// The rules mirror the server so the data looks like it was entered through
// the app and nothing gets rewritten afterwards:
//   - payments / receipts: src/controllers/financial/direct.ts (createPayment)
//   - service status:      src/lib/service-status.ts (UPDATE_SERVICE_STATUSES_SQL)
//   - formalin ledger:     src/controllers/formalinusage.ts, src/routes/formalindeliveries.ts
//   - audit log messages:  the `res.locals.auditAction` templates in routes/controllers

import {
  BARANGAYS,
  BURIAL_SITES,
  CAUSES_BY_TYPE,
  CITIES,
  EXPENSES,
  FEMALE_FIRST_NAMES,
  LAST_NAMES,
  LGUS,
  LIFEPLAN_COMPANIES,
  LOCATIONS_OF_DEATH,
  MALE_FIRST_NAMES,
  PACKAGES,
  PHYSICAL_DESCRIPTIONS,
  RELATIONSHIPS,
  STAFF,
  TYPE_OF_DEATH_WEIGHTS,
  YOUNGER_FIRST_NAMES,
  type StaffKey,
} from './data';
import {
  Random,
  addDays,
  diffDays,
  manilaDay,
  manilaTime,
  weekday,
} from './random';

export const TABLES = [
  'lifeplancompany',
  'lgu',
  'casketinventory',
  'package',
  'representative',
  'deceasedrecord',
  'contract',
  'lifeplan',
  'lgucase',
  'document',
  'burialrecord',
  'transaction',
  'officialreceipt',
  'formalininventory',
  'formalindelivery',
  'formalinusage',
  'casketdelivery',
  'inventoryaudit',
  'expense',
  'auditlog',
] as const;

export type Table = (typeof TABLES)[number];
export type Row = { id: number } & Record<string, unknown>;
export type Tables = Record<Table, Row[]>;

/** Marker the writer replaces with the time of the write. */
export const NOW_MARKER = '__NOW__';

export interface SimulationInput {
  seed: number;
  from: string;
  to: string;
  /** Latest moment anything may be dated (epoch ms). */
  cap: number;
  staff: Record<StaffKey, { id: string; name: string }>;
  /** Latest existing formalin ledger row (or null when the table is empty). */
  formalin: { stock: number; threshold: number } | null;
}

export interface SimulationResult {
  tables: Tables;
  /** Local ids of the case rows, for the summary. */
  stats: Record<string, number>;
}

type PlanType = 'Direct' | 'Life' | 'LGU';
type Method = 'Cash' | 'Bank Transfer' | 'GCash' | 'Check' | 'Credit Card';
type Category = 'Down Payment' | 'Installment' | 'Full Payment' | 'Refund';

const METHODS: [Method, number][] = [
  ['Cash', 50],
  ['GCash', 25],
  ['Bank Transfer', 15],
  ['Check', 7],
  ['Credit Card', 3],
];

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function simulate(input: SimulationInput): SimulationResult {
  const rng = new Random(input.seed);
  const { from, to, cap, staff } = input;

  const tables = Object.fromEntries(TABLES.map((t) => [t, []])) as unknown as Tables;
  const add = (table: Table, row: Record<string, unknown>) => {
    const id = tables[table].length;
    tables[table].push({ id, ...row });
    return id;
  };
  const iso = (ms: number) => new Date(ms).toISOString();
  const happened = (ms: number) => ms <= cap;
  const audit = (who: StaffKey, ms: number, action: string) => {
    if (!happened(ms)) return;
    add('auditlog', { staffid: staff[who].id, actiondate: iso(ms), action });
  };
  const name = (who: StaffKey) => staff[who].name;
  /** A business-hours moment on `day` (Manila). */
  const at = (day: string, fromHour = 8, toHour = 17) =>
    manilaTime(day, rng.int(fromHour, toHour), rng.int(0, 59), rng.int(0, 59));

  const stats: Record<string, number> = {};
  const bump = (key: string, by = 1) => (stats[key] = (stats[key] ?? 0) + by);

  // ---------------------------------------------------------------------------
  // Reference data, set up a few days before the window starts.
  // ---------------------------------------------------------------------------
  const setupDay = addDays(from, -4);

  const companyIds = LIFEPLAN_COMPANIES.map((c, i) => {
    audit('admin', manilaTime(setupDay, 9, 5 + i), `${name('admin')} created a life plan company.`);
    return add('lifeplancompany', {
      companyname: c.companyname,
      contactinfo: c.contactinfo,
      minimumthreshold: c.minimumthreshold,
    });
  });
  const companyAgent: (StaffKey | undefined)[] = LIFEPLAN_COMPANIES.map(
    (_, i) => STAFF.find((s) => s.company === i)?.key,
  );

  const lguIds = LGUS.map((l, i) => {
    audit('admin', manilaTime(setupDay, 9, 20 + i), `${name('admin')} added the LGU ${l.lguname}.`);
    return add('lgu', { lguname: l.lguname, contactinfo: l.contactinfo });
  });

  const casketIds: number[] = [];
  const packageIds = PACKAGES.map((p, i) => {
    const casketId = add('casketinventory', {
      caskettype: p.casket.caskettype,
      caskettier: p.packagetype,
      currentstock: 0, // set after the inventory pass
      minimumthreshold: p.casket.minimumthreshold,
    });
    casketIds.push(casketId);
    audit(
      'admin',
      manilaTime(setupDay, 10, i * 3),
      `${name('admin')} added ${p.casket.caskettype} (${p.packagetype}) to casket inventory`,
    );
    audit(
      'admin',
      manilaTime(setupDay, 10, i * 3 + 1),
      `${name('admin')} created a new package: ${p.packagename} (${p.packagetype})`,
    );
    return add('package', {
      packagename: p.packagename,
      packagetype: p.packagetype,
      price: p.price,
      embalmingperiod: p.embalmingperiod,
      inclusions: p.inclusions,
      casketid: casketId,
    });
  });

  // ---------------------------------------------------------------------------
  // Cases.
  // ---------------------------------------------------------------------------
  interface Consumption {
    ms: number;
    pkg: number;
    caseId: number;
    plantype: PlanType;
    liters: number;
  }
  const consumptions: Consumption[] = [];
  const receiptIds: number[] = [];
  const planNumbers = new Set<string>();

  const totalDays = diffDays(to, from) + 1;
  for (let i = 0; i < totalDays; i++) {
    const day = addDays(from, i);
    // A mild upward trend; slightly fewer intakes on Sundays.
    const lambda = (0.62 + 0.36 * (i / totalDays)) * (weekday(day) === 0 ? 0.8 : 1);
    const count = poisson(rng, lambda);
    for (let n = 0; n < count; n++) createCase(day);
  }

  function personName(male: boolean, younger: boolean) {
    const first = younger
      ? rng.pick(YOUNGER_FIRST_NAMES)
      : rng.pick(male ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES);
    return first;
  }

  function createCase(day: string) {
    const plantype = rng.weighted<PlanType>([
      ['Direct', 55],
      ['Life', 30],
      ['LGU', 15],
    ]);
    bump(`cases.${plantype}`);

    // --- Deceased & representative -----------------------------------------
    const typeofdeath = rng.weighted(TYPE_OF_DEATH_WEIGHTS);
    const male = rng.chance(0.53);
    const young = typeofdeath !== 'Natural' && rng.chance(0.5);
    const firstname = personName(male, young);
    const middlename = rng.chance(0.9) ? rng.pick(LAST_NAMES) : null;
    const lastname = rng.pick(LAST_NAMES);
    const deceasedName = [firstname, middlename, lastname].filter(Boolean).join(' ');

    const relationship = rng.weighted(RELATIONSHIPS);
    const sharesSurname = ['Son', 'Daughter', 'Sibling', 'Grandchild'].includes(relationship) ||
      (relationship === 'Spouse' && male);
    const repFirst = rng.pick([...YOUNGER_FIRST_NAMES, ...FEMALE_FIRST_NAMES, ...MALE_FIRST_NAMES]);
    const repMiddle = rng.pick(LAST_NAMES);
    const repLast = sharesSurname ? lastname : rng.pick(LAST_NAMES);
    const repName = `${repFirst} ${repMiddle} ${repLast}`;
    const city = rng.weighted(CITIES);
    const address = city === 'Davao City'
      ? `Purok ${rng.int(1, 12)}, Brgy. ${rng.pick(BARANGAYS)}, Davao City`
      : `${rng.int(1, 250)} ${rng.pick(['Rizal St.', 'Mabini St.', 'Bonifacio St.', 'Luna St.', 'Quezon Ave.', 'National Highway'])}, ${city}`;

    const intakeMs = at(day, 7, 18);
    if (!happened(intakeMs)) return; // later "today" than the run
    const clerk: StaffKey = rng.chance(0.7) ? 'frontdesk' : 'director';
    const managedby: StaffKey = rng.chance(0.6) ? 'director' : 'frontdesk';

    const repId = add('representative', {
      firstname: repFirst,
      middlename: repMiddle,
      lastname: repLast,
      relationship,
      contactnumber: `+639${rng.digits(9)}`,
      address,
      datecreated: day,
    });
    audit(clerk, intakeMs, `${name(clerk)} added a new representative: ${repName}`);

    const location = rng.weighted(LOCATIONS_OF_DEATH);
    const advanced = rng.chance(typeofdeath === 'Natural' ? 0.015 : 0.12);
    const caseId = add('deceasedrecord', {
      firstname,
      middlename,
      lastname,
      causeofdeath: rng.pick(CAUSES_BY_TYPE[typeofdeath]),
      typeofdeath,
      physicaldescription: rng.pick(PHYSICAL_DESCRIPTIONS),
      servicestatus: 'intake', // final value set below
      hasmaturedlifeplan: plantype === 'Life',
      plantype,
      datecreated: day,
      managedby: staff[managedby].id,
      representedby: repId,
      dateofdeath: addDays(day, -rng.weighted([[0, 50], [1, 35], [2, 15]] as const)),
      locationofdeath: location,
      hasadvanceddecomposition: advanced,
      completedat: null,
    });
    const caseRow = tables.deceasedrecord[caseId];
    audit(
      clerk,
      intakeMs + MINUTE,
      `${name(clerk)} created a new record in deceased record for ${deceasedName} & ${repName}`,
    );

    // --- Package choice --------------------------------------------------------
    let pkg: number;
    let planAmount = 0;
    let useBenefits = true;
    if (plantype === 'Direct') {
      pkg = rng.weighted(PACKAGES.map((_, i) => [i, [22, 20, 18, 14, 10, 7, 5, 4][i]] as const));
    } else if (plantype === 'LGU') {
      pkg = rng.weighted([[0, 60], [1, 40]] as const); // the two Basic packages
    } else {
      useBenefits = rng.chance(0.7);
      if (useBenefits) {
        pkg = rng.weighted([[1, 15], [2, 25], [3, 25], [4, 20], [5, 10], [6, 5]] as const);
        planAmount = PACKAGES[pkg].price;
      } else {
        const planPkg = rng.int(1, 5);
        pkg = Math.min(planPkg + rng.int(1, 2), PACKAGES.length - 1);
        planAmount = PACKAGES[planPkg].price;
      }
    }
    const pack = PACKAGES[pkg];

    // --- Plan-specific record ----------------------------------------------------
    let lguCaseId: number | null = null;
    if (plantype === 'Life') {
      const company = rng.weighted([[0, 45], [1, 35], [2, 20]] as const);
      const def = LIFEPLAN_COMPANIES[company];
      let plannumber: string;
      do plannumber = `${def.prefix}-${rng.int(2009, 2022)}-${rng.digits(6)}`;
      while (planNumbers.has(plannumber));
      planNumbers.add(plannumber);
      add('lifeplan', {
        plannumber,
        planholdername: rng.chance(0.8) ? deceasedName : repName,
        totalamount: planAmount,
        caseid: caseId,
        companyid: companyIds[company],
        use_benefits: useBenefits,
      });
      const actor = companyAgent[company] ?? clerk;
      audit(actor, intakeMs + 2 * MINUTE, `${name(actor)} created a life plan for ${deceasedName}`);
      bump(useBenefits ? 'life.benefits' : 'life.topup');
    } else if (plantype === 'LGU') {
      lguCaseId = add('lgucase', {
        reimbursementstatus: 'pending', // final value set below
        reimbursementamount: pack.price,
        caseid: caseId,
        lguid: lguIds[rng.weighted([[0, 70], [1, 15], [2, 15]] as const)],
      });
      audit(clerk, intakeMs + 2 * MINUTE, `${name(clerk)} created an LGU case for ${deceasedName}`);
    }

    // --- Documents -----------------------------------------------------------
    const docTypes = [
      'Death Certificate',
      'Representative Valid ID',
      plantype === 'Direct'
        ? 'Hospital Release Form'
        : plantype === 'Life'
          ? 'Life Plan Certificate'
          : 'LGU Guarantee Letter',
    ];
    if (plantype === 'LGU') docTypes.push('Certificate of Indigency');

    const daysAgo = diffDays(to, day);
    const recent = daysAgo <= 10;
    const laggingDoc = recent && rng.chance(0.35) ? rng.int(1, docTypes.length - 1) : -1;
    let docsComplete = true;
    let lastDocMs = intakeMs;

    docTypes.forEach((documenttype, d) => {
      audit(
        clerk,
        intakeMs + (3 + d) * MINUTE,
        `${name(clerk)} added a ${documenttype} document requirement for ${deceasedName}`,
      );
      const uploadMs = d < 2 ? intakeMs + (8 + d) * MINUTE : at(addDays(day, rng.int(0, 2)));
      const lagging = d === laggingDoc;
      const uploaded = happened(uploadMs) && !(lagging && rng.chance(0.5));
      const verifyMs = Math.max(
        at(addDays(manilaDay(uploadMs), rng.weighted([[0, 50], [1, 40], [2, 10]] as const)), 9, 17),
        uploadMs + rng.int(20, 120) * MINUTE,
      );
      const verified = uploaded && !lagging && happened(verifyMs) && verifyMs > uploadMs;
      if (!verified) docsComplete = false;
      else lastDocMs = Math.max(lastDocMs, verifyMs);

      add('document', {
        documenttype,
        verificationstatus: verified ? 'verified' : 'pending',
        uploaddate: uploaded ? manilaDay(uploadMs) : day,
        verifiedby: verified ? staff.director.id : null,
        caseid: caseId,
        filename: null, // the writer builds documents/<caseid>/<uuid>.pdf
        _upload: uploaded,
        _uuid: rng.uuid(),
        _deceased: deceasedName,
      });
      if (uploaded)
        audit(clerk, uploadMs, `${name(clerk)} uploaded a ${documenttype} document for ${deceasedName}`);
      if (verified)
        audit('director', verifyMs, `${name('director')} approved the ${documenttype} document for ${deceasedName}`);
    });

    // --- Contract --------------------------------------------------------------
    const intakeOnly = daysAgo <= 4 && rng.chance(0.6);
    if (intakeOnly) {
      bump('cases.intake');
      return;
    }
    let signedDay = addDays(day, rng.weighted([[0, 60], [1, 35], [2, 5]] as const));
    if (diffDays(to, signedDay) < 0) signedDay = day;
    let signedMs = Math.max(at(signedDay, 9, 18), intakeMs + 20 * MINUTE);
    if (!happened(signedMs)) {
      signedMs = intakeMs + 20 * MINUTE;
      if (!happened(signedMs)) {
        bump('cases.intake');
        return;
      }
      signedDay = manilaDay(signedMs);
    }
    const deadline = addDays(signedDay, pack.embalmingperiod);
    const due = diffDays(to, deadline) >= 0; // deadline <= today
    const deadlineMs = manilaTime(deadline, 0, 2);

    let contractTotal = plantype === 'Life' ? Math.max(0, pack.price - planAmount) : pack.price;
    const contractId = add('contract', {
      signeddate: signedDay,
      burialdatedeadline: deadline,
      totalamount: contractTotal, // updated after receipts with deductions
      embalmingperiod: pack.embalmingperiod,
      inclusions: pack.inclusions,
      caseid: caseId,
      packageid: packageIds[pkg],
    });
    audit('director', signedMs, `${name('director')} created a new contract for ${deceasedName}`);
    bump(`packages.${pack.packagetype}`);

    const liters =
      { Basic: 2, OG: 2.5, 'Metal Casket': 3, 'High End': 3.5 }[pack.packagetype] +
      rng.pick([0, 0.5]) +
      (advanced ? 1 : 0);
    consumptions.push({
      ms: Math.min(signedMs + rng.int(30, 180) * MINUTE, cap),
      pkg,
      caseId,
      plantype,
      liters,
    });

    // Burial record (keeps burialdate = contract deadline, as the app does).
    add('burialrecord', { burialdate: deadline, burialsite: rng.pick(BURIAL_SITES), caseid: caseId });
    audit('director', signedMs + rng.int(1, 5) * HOUR, `${name('director')} added a burial record for ${deceasedName}`);

    // --- Payments --------------------------------------------------------------
    let paid = 0;
    let lastPayMs = 0;
    const pay = (
      ms: number,
      category: Category,
      amount: number,
      method: Method,
      receipt: null | {
        pwd_discount?: number;
        withholding_tax?: number;
        tin?: string;
        discount_id?: string;
        payer_name: string;
      },
    ) => {
      if (!happened(ms) || amount <= 0) return false;
      const payable = contractTotal;
      const discount = receipt?.pwd_discount ?? 0;
      const deductions = discount + (receipt?.withholding_tax ?? 0);
      const newPaid = paid + (category === 'Refund' ? -amount : amount);
      const remaining = payable - deductions - newPaid;
      if (remaining < -0.001 || newPaid < 0)
        throw new Error(`Simulation bug: invalid payment for case ${caseId}`);

      const transactionId = add('transaction', {
        amount,
        paymentdatetime: iso(ms),
        paymentmethod: method,
        paymentcategory: category,
        remainingbalance: round2(remaining),
        transactionstatus: 'completed',
        caseid: caseId,
      });
      let orToken = '';
      if (receipt) {
        const orId = add('officialreceipt', {
          ornumber: null, // assigned in issue order at the end
          amount,
          issuedate: iso(ms),
          reissuancecount: 0,
          transactionid: transactionId,
          total_due: round2(payable - discount),
          withholding_tax: receipt.withholding_tax ?? null,
          tin: receipt.tin ?? null,
          discount_id: receipt.discount_id ?? null,
          pwd_discount: receipt.pwd_discount ?? null,
          payer_name: receipt.payer_name,
        });
        receiptIds.push(orId);
        orToken = ` (OR {{or:${orId}}})`;
        contractTotal = round2(contractTotal - deductions);
      }
      paid = round2(newPaid);
      lastPayMs = Math.max(lastPayMs, ms);
      audit(
        'frontdesk',
        ms + 30_000,
        `${name('frontdesk')} recorded a ${category} of ${amount} for ${deceasedName}${orToken}`,
      );
      bump('payments');
      return true;
    };

    const payer = { payer_name: repName };
    const settleDay = (minDay: string) => {
      const d = addDays(deadline, rng.weighted([[-2, 20], [0, 30], [3, 25], [7, 15], [14, 10]] as const));
      return diffDays(d, minDay) < 1 ? addDays(minDay, 1) : d;
    };

    if (plantype === 'Direct') {
      // Deductions are applied on the first receipt, as at the counter.
      const profile = rng.weighted([['none', 88], ['pwd', 8], ['corporate', 4]] as const);
      const first = { ...payer } as Parameters<typeof pay>[4] & object;
      let deductions = 0;
      if (profile === 'pwd') {
        first.pwd_discount = Math.round(pack.price * 0.2);
        first.discount_id = `${rng.pick(['SC', 'PWD'])}-${rng.int(10, 99)}-${rng.digits(6)}`;
        deductions = first.pwd_discount;
        bump('receipts.pwd');
      } else if (profile === 'corporate') {
        first.withholding_tax = Math.round(pack.price * 0.02);
        first.tin = `${rng.digits(3)}-${rng.digits(3)}-${rng.digits(3)}-00000`;
        first.payer_name = rng.pick([
          'Mindanao Agri-Ventures Corp.',
          'Davao Gulf Shipping Lines Inc.',
          'Southern Harvest Cooperative',
          'Talomo Builders and Supply',
        ]);
        deductions = first.withholding_tax;
        bump('receipts.withholding');
      }
      const effective = pack.price - deductions;
      const startMs = signedMs + rng.int(10, 90) * MINUTE;

      if (rng.chance(0.15)) {
        pay(startMs, 'Full Payment', effective, rng.weighted(METHODS), first);
      } else {
        const down = Math.min(round500(effective * (0.3 + rng.next() * 0.2)), effective);
        if (pay(startMs, 'Down Payment', down, rng.weighted(METHODS), first)) {
          let rest = effective - down;
          const k = rng.weighted([[1, 40], [2, 40], [3, 20]] as const);
          const defaulter = rng.chance(0.12);
          const lastIndex = defaulter ? rng.int(0, k - 1) - 1 : k - 1; // -1: nothing else paid
          const endDay = settleDay(signedDay);
          const span = Math.max(diffDays(endDay, signedDay), k);
          let bounced = false;
          let earliest = addDays(signedDay, 1); // keeps payments in time order
          for (let j = 0; j <= lastIndex && rest > 0; j++) {
            let payDay = addDays(signedDay, Math.max(1, Math.round((span * (j + 1)) / k) - rng.int(0, 1)));
            if (diffDays(payDay, earliest) < 0) payDay = earliest;
            earliest = addDays(payDay, 1);
            const amount = j === k - 1 ? rest : Math.min(rest, round500(rest / (k - j) * (0.8 + rng.next() * 0.4)));
            const method = rng.weighted(METHODS);
            const ms = at(payDay);
            if (!pay(ms, 'Installment', amount, method, payer)) break;
            rest -= amount;
            // Occasionally a check bounces: refund it, then settle in cash.
            if (method === 'Check' && !bounced && rng.chance(0.5)) {
              bounced = true;
              const refundMs = at(addDays(payDay, 3));
              if (pay(refundMs, 'Refund', amount, 'Check', null)) {
                bump('refunds');
                const replacementDay = addDays(payDay, rng.int(4, 6));
                if (!pay(at(replacementDay), 'Installment', amount, 'Cash', payer)) rest += amount;
                earliest = addDays(replacementDay, 1);
              } else break;
            }
          }
        }
      }
    } else if (plantype === 'Life' && !useBenefits) {
      const extra = contractTotal;
      const startMs = signedMs + rng.int(10, 90) * MINUTE;
      if (rng.chance(0.55)) {
        pay(startMs, 'Full Payment', extra, rng.weighted(METHODS), payer);
      } else {
        const down = round500(extra * 0.5);
        if (pay(startMs, 'Down Payment', down, rng.weighted(METHODS), payer) && !rng.chance(0.12))
          pay(at(settleDay(signedDay)), 'Installment', extra - down, rng.weighted(METHODS), payer);
      }
    }

    // --- LGU reimbursement -------------------------------------------------------
    let releaseMs = 0;
    // Assigned inside `update` below, so widen it to stop TS narrowing it.
    let lguStatus = 'pending' as 'pending' | 'approved' | 'released' | 'rejected';
    if (plantype === 'LGU' && lguCaseId !== null) {
      const approveMs = at(addDays(signedDay, rng.int(2, 6)));
      const outcome = due
        ? rng.weighted([['released', 78], ['approved', 14], ['rejected', 8]] as const)
        : rng.weighted([['pending', 85], ['approved', 15]] as const);
      const update = (ms: number, status: typeof lguStatus) => {
        if (!happened(ms)) return false;
        lguStatus = status;
        audit(
          'frontdesk',
          ms,
          `${name('frontdesk')} updated the LGU case for ${deceasedName} (status: ${status}, amount: ${pack.price})`,
        );
        return true;
      };
      if (outcome === 'rejected') update(approveMs, 'rejected');
      else if (outcome !== 'pending' && update(approveMs, 'approved') && outcome === 'released') {
        const ms = at(addDays(deadline, rng.int(3, 25)));
        if (update(Math.max(ms, approveMs + DAY), 'released')) releaseMs = Math.max(ms, approveMs + DAY);
      }
      tables.lgucase[lguCaseId].reimbursementstatus = lguStatus;
      bump(`lgu.${lguStatus}`);
    }

    tables.contract[contractId].totalamount = contractTotal;

    // --- Final service status (same rules as the server's sweep) ---------------
    let status: 'active' | 'pending' | 'completed';
    if (!docsComplete) status = 'pending';
    else if (plantype === 'Direct') {
      const fullyPaid = paid >= contractTotal;
      status = fullyPaid && due ? 'completed' : fullyPaid || due ? 'pending' : 'active';
    } else if (plantype === 'LGU') {
      if (lguStatus === 'released') status = due ? 'completed' : 'pending';
      else if (due) status = 'pending';
      else status = lguStatus === 'pending' ? 'active' : 'pending';
    } else if (!useBenefits && contractTotal - paid > 0) {
      status = due ? 'pending' : 'active';
    } else {
      status = due ? 'completed' : 'pending';
    }
    caseRow.servicestatus = status;
    if (status === 'completed') {
      const completedMs = Math.max(deadlineMs, lastPayMs + 30_000, lastDocMs + 30_000, releaseMs + 30_000);
      caseRow.completedat = iso(Math.min(completedMs, cap));
    }
    bump(`status.${status}`);
  }

  // ---------------------------------------------------------------------------
  // Inventory: caskets and the formalin ledger, processed in time order.
  // ---------------------------------------------------------------------------
  consumptions.sort((a, b) => a.ms - b.ms);

  // Caskets.
  const stock = PACKAGES.map(() => 0);
  const pendingCasket = new Map<number, number>(); // pkg -> delivery ms
  const deliverCasket = (pkg: number, ms: number, qty: number) => {
    const p = PACKAGES[pkg];
    const who: StaffKey = rng.chance(0.5) ? 'admin' : 'embalmer';
    add('casketdelivery', {
      quantityreceived: qty,
      deliverydate: manilaDay(ms),
      casketid: casketIds[pkg],
      totalamountpaid: qty * p.casket.unitcost,
      recordedby: staff[who].id,
    });
    audit(who, ms, `${name(who)} recorded a casket delivery: ${qty}x ${p.casket.caskettype}`);
    stock[pkg] += qty;
    bump('casketDeliveries');
  };
  const restockQty = (pkg: number) =>
    ({ Basic: rng.int(5, 8), OG: rng.int(4, 6), 'Metal Casket': rng.int(2, 4), 'High End': rng.int(1, 3) })[
      PACKAGES[pkg].packagetype
    ];
  const flushCasketDeliveries = (untilMs: number) => {
    for (const [pkg, ms] of [...pendingCasket]) {
      if (ms <= untilMs) {
        pendingCasket.delete(pkg);
        deliverCasket(pkg, ms, restockQty(pkg));
      }
    }
  };
  PACKAGES.forEach((_, pkg) =>
    deliverCasket(pkg, manilaTime(addDays(setupDay, 1), 10, pkg * 7), restockQty(pkg) + 1),
  );

  // Formalin ledger.
  const threshold = input.formalin?.threshold || 60;
  const openingStock = threshold + 90;
  let liters = openingStock;
  let ledgerRow = add('formalininventory', {
    currentstock: liters,
    minimumthreshold: threshold,
    date: iso(manilaTime(addDays(setupDay, 1), 8)),
  });
  let pendingFormalin: number | null = null;
  const deliverFormalin = (ms: number, qty: number) => {
    const who: StaffKey = rng.chance(0.5) ? 'admin' : 'embalmer';
    liters = round2(liters + qty);
    ledgerRow = add('formalininventory', { currentstock: liters, minimumthreshold: threshold, date: iso(ms) });
    add('formalindelivery', {
      quantityreceived: qty,
      deliverydate: manilaDay(ms),
      formalinid: ledgerRow,
      totalamountpaid: Math.round(qty * rng.int(420, 480)),
      recordedby: staff[who].id,
    });
    audit(who, ms, `${name(who)} recorded a formalin delivery of ${qty} liters`);
    bump('formalinDeliveries');
  };
  const flushFormalin = (untilMs: number) => {
    if (pendingFormalin !== null && pendingFormalin <= untilMs) {
      const ms = pendingFormalin;
      pendingFormalin = null;
      deliverFormalin(ms, rng.int(6, 12) * 10);
    }
  };

  for (const c of consumptions) {
    flushCasketDeliveries(c.ms);
    if (stock[c.pkg] === 0) {
      pendingCasket.delete(c.pkg);
      deliverCasket(c.pkg, c.ms - 2 * HOUR, restockQty(c.pkg));
    }
    stock[c.pkg] -= 1;
    if (stock[c.pkg] <= PACKAGES[c.pkg].casket.minimumthreshold && !pendingCasket.has(c.pkg))
      pendingCasket.set(c.pkg, at(addDays(manilaDay(c.ms), rng.int(1, 3)), 9, 15));

    flushFormalin(c.ms);
    if (liters < c.liters) {
      pendingFormalin = null;
      const lastLedgerMs = Date.parse(tables.formalininventory[ledgerRow].date as string);
      deliverFormalin(Math.max(c.ms - HOUR, lastLedgerMs + MINUTE), rng.int(6, 12) * 10);
    }
    add('formalinusage', {
      quantityused: c.liters,
      usagedate: iso(c.ms),
      casetype: c.plantype,
      caseid: c.caseId,
      formalinid: ledgerRow,
    });
    liters = round2(liters - c.liters);
    ledgerRow = add('formalininventory', { currentstock: liters, minimumthreshold: threshold, date: iso(c.ms) });
    audit('embalmer', c.ms + 30_000, `${name('embalmer')} recorded ${c.liters} liters of formalin usage for case {{case:${c.caseId}}}`);
    if (liters < threshold + 25 && pendingFormalin === null)
      pendingFormalin = at(addDays(manilaDay(c.ms), rng.int(1, 3)), 9, 15);
  }
  flushCasketDeliveries(cap);
  flushFormalin(cap);
  stock.forEach((s, pkg) => (tables.casketinventory[casketIds[pkg]].currentstock = s));

  // Closing ledger row, dated at write time so it is the row the app reads.
  // It carries the seeded net change on top of whatever stock already existed.
  const closing = round2((input.formalin?.stock ?? 0) + (liters - openingStock) + (input.formalin ? 0 : openingStock));
  add('formalininventory', { currentstock: closing, minimumthreshold: threshold, date: NOW_MARKER });
  stats.formalinClosingStock = closing;

  // Monthly inventory audits (no discrepancies).
  for (let month = monthStart(from); diffDays(to, month) >= 0; month = nextMonth(month)) {
    const day = diffDays(month, from) < 0 ? from : month;
    const ms = manilaTime(day, 16, 30);
    if (!happened(ms)) continue;
    const ledgerAt = [...tables.formalininventory]
      .filter((r) => r.date !== NOW_MARKER && Date.parse(r.date as string) <= ms)
      .pop();
    if (ledgerAt) add('inventoryaudit', { auditdate: day, hasdiscrepancy: false, formalinid: ledgerAt.id, casketid: null });
    casketIds.forEach((casketid) =>
      add('inventoryaudit', { auditdate: day, hasdiscrepancy: false, formalinid: null, casketid }),
    );
  }

  // ---------------------------------------------------------------------------
  // Operating expenses.
  // ---------------------------------------------------------------------------
  for (let month = monthStart(from); diffDays(to, month) >= 0; month = nextMonth(month)) {
    const monthEnd = addDays(nextMonth(month), -1);
    for (const [description, min, max, perMonth] of EXPENSES) {
      const times = perMonth < 1 ? (rng.chance(perMonth) ? 1 : 0) : perMonth;
      for (let t = 0; t < times; t++) {
        const day = addDays(month, rng.int(0, diffDays(monthEnd, month)));
        if (diffDays(day, from) < 0 || diffDays(to, day) < 0) continue;
        const ms = at(day, 9, 16);
        if (!happened(ms)) continue;
        const amount = min === max ? min : round2(min + rng.next() * (max - min));
        add('expense', { description, amount, expensedate: day, recordedby: staff.admin.id });
        audit('admin', ms, `${name('admin')} created an expense record ${description} with amount ${amount}.`);
        bump('expenses');
      }
    }
  }

  stats.receipts = receiptIds.length;
  return { tables, stats };
}

// ---------------------------------------------------------------------------

function poisson(rng: Random, lambda: number) {
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng.next();
  } while (p > limit);
  return k - 1;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function round500(n: number) {
  return Math.max(500, Math.round(n / 500) * 500);
}

function monthStart(day: string) {
  return `${day.slice(0, 7)}-01`;
}

function nextMonth(month: string) {
  const [y, m] = month.split('-').map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
}
