-- Mirrors `pg_dump --schema-only --no-owner --no-privileges --schema=public`
-- of the production database.

CREATE TYPE public.package_type_enum AS ENUM ('Basic', 'OG', 'Metal Casket', 'High End');
CREATE TYPE public.payment_category_enum AS ENUM ('Down Payment', 'Installment', 'Full Payment', 'Refund');
CREATE TYPE public.payment_method_enum AS ENUM ('Cash', 'Bank Transfer', 'GCash', 'Check', 'Credit Card');
CREATE TYPE public.plan_type_enum AS ENUM ('Direct', 'Life', 'LGU');
CREATE TYPE public.reimbursement_status_enum AS ENUM ('pending', 'approved', 'released', 'rejected');
CREATE TYPE public.service_status_enum AS ENUM ('intake', 'active', 'pending', 'completed');
COMMENT ON TYPE public.service_status_enum IS 'Ignore `intake`.';
CREATE TYPE public.transaction_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE public.verification_status_enum AS ENUM ('pending', 'verified', 'rejected');

CREATE TABLE public.lifeplancompany (
    companyid serial PRIMARY KEY,
    companyname character varying(255) NOT NULL,
    contactinfo character varying(255),
    minimumthreshold real NOT NULL
);
COMMENT ON COLUMN public.lifeplancompany.minimumthreshold IS 'Threshold for all deceased with Plan';

CREATE TABLE public.casketinventory (
    casketid serial PRIMARY KEY,
    caskettype character varying(255) NOT NULL,
    caskettier character varying(255),
    currentstock integer DEFAULT 0 NOT NULL,
    minimumthreshold integer NOT NULL
);

CREATE TABLE public.formalininventory (
    formalinid serial PRIMARY KEY,
    currentstock double precision DEFAULT 0 NOT NULL,
    minimumthreshold double precision NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.representative (
    representativeid serial PRIMARY KEY,
    firstname character varying(255) NOT NULL,
    middlename character varying(255) NOT NULL,
    lastname character varying(255) NOT NULL,
    relationship character varying(100),
    contactnumber character varying(50) NOT NULL,
    address character varying(255) NOT NULL,
    datecreated date DEFAULT CURRENT_DATE NOT NULL
);

-- `staff` is Better Auth's user model (see server/src/lib/auth.ts).
CREATE TABLE public.staff (
    id text PRIMARY KEY,
    "firstName" character varying(255) NOT NULL,
    "middleName" character varying(255),
    "lastName" character varying(255) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "jobRole" character varying(100),
    email character varying(255) NOT NULL UNIQUE,
    "contactNumber" character varying(50),
    name text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    username text UNIQUE,
    "displayUsername" text,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone,
    "dateCreated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
-- At most one superadmin may exist.
CREATE UNIQUE INDEX staff_single_superadmin ON public.staff USING btree (role) WHERE (role = 'superadmin');

CREATE TABLE public.account (
    id text PRIMARY KEY,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);
CREATE INDEX "account_userId_idx" ON public.account USING btree ("userId");

CREATE TABLE public.session (
    id text PRIMARY KEY,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL UNIQUE,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    "impersonatedBy" text
);
CREATE INDEX "session_userId_idx" ON public.session USING btree ("userId");

CREATE TABLE public.verification (
    id text PRIMARY KEY,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX verification_identifier_idx ON public.verification USING btree (identifier);

CREATE TABLE public.access (
    accessid serial PRIMARY KEY,
    staffid text NOT NULL UNIQUE REFERENCES public.staff(id),
    intake_page boolean DEFAULT false NOT NULL,
    case_page boolean DEFAULT false NOT NULL,
    special_case_page boolean DEFAULT false NOT NULL,
    inventory_page boolean DEFAULT false NOT NULL,
    financial_page boolean DEFAULT false NOT NULL
);
CREATE INDEX idx_access_staffid ON public.access USING btree (staffid);

CREATE TABLE public.auditlog (
    auditlogid serial PRIMARY KEY,
    staffid text NOT NULL REFERENCES public.staff(id),
    actiondate timestamp with time zone DEFAULT now() NOT NULL,
    action text NOT NULL
);
CREATE INDEX idx_auditlog_staffid ON public.auditlog USING btree (staffid);

CREATE TABLE public.lifeplan_agent (
    agentid serial,
    staffid text NOT NULL,
    companyid integer NOT NULL,
    CONSTRAINT lifeplanagent_pkey PRIMARY KEY (agentid),
    CONSTRAINT lifeplanagent_staffid_key UNIQUE (staffid),
    CONSTRAINT lifeplanagent_companyid_fkey FOREIGN KEY (companyid) REFERENCES public.lifeplancompany(companyid),
    CONSTRAINT lifeplanagent_staffid_fkey FOREIGN KEY (staffid) REFERENCES public.staff(id) ON DELETE CASCADE
);

-- Only accounts with the `lifeplan_agent` role may be linked to a company.
CREATE FUNCTION public.lifeplanagent_require_role() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if not exists (
    select 1 from public.staff
    where id = new.staffid and role = 'lifeplan_agent'
  ) then
    raise exception 'staff % does not have the lifeplan_agent role', new.staffid;
  end if;
  return new;
end $$;

CREATE TRIGGER lifeplanagent_require_role_trg
    BEFORE INSERT OR UPDATE OF staffid ON public.lifeplan_agent
    FOR EACH ROW EXECUTE FUNCTION public.lifeplanagent_require_role();

CREATE TABLE public.deceasedrecord (
    caseid serial PRIMARY KEY,
    firstname character varying(255) NOT NULL,
    middlename character varying(255),
    lastname character varying(255) NOT NULL,
    causeofdeath character varying(255),
    typeofdeath character varying(255),
    physicaldescription text,
    servicestatus public.service_status_enum NOT NULL,
    hasmaturedlifeplan boolean DEFAULT false NOT NULL,
    plantype public.plan_type_enum NOT NULL,
    datecreated date DEFAULT CURRENT_DATE NOT NULL,
    managedby text NOT NULL REFERENCES public.staff(id),
    representedby integer REFERENCES public.representative(representativeid),
    dateofdeath date,
    hasadvanceddecomposition boolean DEFAULT false NOT NULL
);
CREATE INDEX idx_deceasedrecord_managedby ON public.deceasedrecord USING btree (managedby);
CREATE INDEX idx_deceasedrecord_representedby ON public.deceasedrecord USING btree (representedby);

CREATE TABLE public.burialrecord (
    burialid serial PRIMARY KEY,
    burialdate date,
    burialsite character varying(255),
    caseid integer NOT NULL UNIQUE REFERENCES public.deceasedrecord(caseid)
);

CREATE TABLE public.package (
    packageid serial PRIMARY KEY,
    packagename character varying(255) NOT NULL,
    packagetype public.package_type_enum NOT NULL,
    price double precision NOT NULL,
    embalmingperiod integer NOT NULL,
    inclusions text,
    casketid integer REFERENCES public.casketinventory(casketid)
);
CREATE INDEX idx_package_casketid ON public.package USING btree (casketid);

CREATE TABLE public.contract (
    contractid serial PRIMARY KEY,
    signeddate date NOT NULL,
    burialdatedeadline date NOT NULL,
    totalamount double precision NOT NULL,
    embalmingperiod integer NOT NULL,
    inclusions text,
    caseid integer NOT NULL UNIQUE REFERENCES public.deceasedrecord(caseid),
    packageid integer NOT NULL REFERENCES public.package(packageid)
);
CREATE INDEX idx_contract_caseid ON public.contract USING btree (caseid);
CREATE INDEX idx_contract_packageid ON public.contract USING btree (packageid);

CREATE TABLE public.document (
    documentid serial PRIMARY KEY,
    documenttype character varying(255) NOT NULL,
    verificationstatus public.verification_status_enum DEFAULT 'pending' NOT NULL,
    uploaddate date DEFAULT CURRENT_DATE NOT NULL,
    verifiedby text REFERENCES public.staff(id),
    caseid integer NOT NULL REFERENCES public.deceasedrecord(caseid),
    filename text
);
CREATE INDEX idx_document_caseid ON public.document USING btree (caseid);
CREATE INDEX idx_document_verifiedby ON public.document USING btree (verifiedby);

CREATE TABLE public.lgucase (
    lgucaseid serial PRIMARY KEY,
    reimbursementstatus public.reimbursement_status_enum NOT NULL,
    reimbursementamount double precision NOT NULL,
    caseid integer NOT NULL UNIQUE REFERENCES public.deceasedrecord(caseid)
);
CREATE INDEX idx_lgucase_caseid ON public.lgucase USING btree (caseid);

CREATE TABLE public.lifeplan (
    planid serial PRIMARY KEY,
    plannumber character varying(255),
    planholdername character varying(255),
    totalamount double precision,
    caseid integer NOT NULL UNIQUE REFERENCES public.deceasedrecord(caseid),
    companyid integer NOT NULL REFERENCES public.lifeplancompany(companyid),
    use_benefits boolean DEFAULT true,
    CONSTRAINT lifeplan_company_plannumber_key UNIQUE (companyid, plannumber)
);
CREATE INDEX idx_lifeplan_caseid ON public.lifeplan USING btree (caseid);
CREATE INDEX idx_lifeplan_companyid ON public.lifeplan USING btree (companyid);

CREATE TABLE public.transaction (
    transactionid serial PRIMARY KEY,
    amount numeric(12,2) NOT NULL,
    paymentdatetime timestamp with time zone NOT NULL,
    paymentmethod public.payment_method_enum NOT NULL,
    paymentcategory public.payment_category_enum NOT NULL,
    remainingbalance numeric(12,2) NOT NULL,
    transactionstatus public.transaction_status_enum NOT NULL,
    caseid integer NOT NULL REFERENCES public.deceasedrecord(caseid)
);
CREATE INDEX idx_transaction_caseid ON public.transaction USING btree (caseid);

CREATE TABLE public.officialreceipt (
    orid serial PRIMARY KEY,
    ornumber character varying(255) NOT NULL UNIQUE,
    amount numeric(12,2) NOT NULL,
    issuedate timestamp with time zone DEFAULT now() NOT NULL,
    reissuancecount integer DEFAULT 0 NOT NULL,
    transactionid integer NOT NULL UNIQUE
        REFERENCES public.transaction(transactionid) ON UPDATE CASCADE ON DELETE CASCADE,
    total_due numeric(12,2),
    withholding_tax numeric(12,2),
    tin text,
    discount_id text,
    pwd_discount numeric(12,2)
);
COMMENT ON COLUMN public.officialreceipt.pwd_discount IS 'Amount';

CREATE TABLE public.expense (
    expenseid serial PRIMARY KEY,
    description character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    expensedate date DEFAULT CURRENT_DATE NOT NULL,
    recordedby character varying(100) NOT NULL
        REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE public.casketdelivery (
    deliveryid serial PRIMARY KEY,
    quantityreceived integer NOT NULL,
    deliverydate date NOT NULL,
    casketid integer REFERENCES public.casketinventory(casketid),
    totalamountpaid double precision NOT NULL,
    -- Who recorded the delivery; null for deliveries recorded before this
    -- was tracked.
    recordedby character varying(100)
        REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX idx_casketdelivery_casketid ON public.casketdelivery USING btree (casketid);

CREATE TABLE public.formalindelivery (
    deliveryid serial PRIMARY KEY,
    quantityreceived double precision NOT NULL,
    deliverydate date NOT NULL,
    formalinid integer REFERENCES public.formalininventory(formalinid),
    totalamountpaid double precision NOT NULL,
    -- Who recorded the delivery; null for deliveries recorded before this
    -- was tracked.
    recordedby character varying(100)
        REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX idx_formalindelivery_formalinid ON public.formalindelivery USING btree (formalinid);

CREATE TABLE public.formalinusage (
    usageid serial PRIMARY KEY,
    quantityused double precision NOT NULL,
    usagedate timestamp with time zone DEFAULT now() NOT NULL,
    casetype character varying(255) NOT NULL,
    caseid integer NOT NULL REFERENCES public.deceasedrecord(caseid),
    formalinid integer NOT NULL REFERENCES public.formalininventory(formalinid)
);
CREATE INDEX idx_formalinusage_caseid ON public.formalinusage USING btree (caseid);
CREATE INDEX idx_formalinusage_formalinid ON public.formalinusage USING btree (formalinid);

CREATE TABLE public.inventoryaudit (
    auditid serial PRIMARY KEY,
    auditdate date NOT NULL,
    hasdiscrepancy boolean DEFAULT false NOT NULL,
    formalinid integer REFERENCES public.formalininventory(formalinid),
    casketid integer REFERENCES public.casketinventory(casketid),
    CONSTRAINT chk_audit_target CHECK (
        ((formalinid IS NOT NULL) AND (casketid IS NULL))
        OR ((formalinid IS NULL) AND (casketid IS NOT NULL))
    )
);
CREATE INDEX idx_inventoryaudit_casketid ON public.inventoryaudit USING btree (casketid);
CREATE INDEX idx_inventoryaudit_formalinid ON public.inventoryaudit USING btree (formalinid);

CREATE TABLE public.notification (
    notificationid serial PRIMARY KEY,
    type text NOT NULL,
    audience text[] NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    caseid integer REFERENCES public.deceasedrecord(caseid) ON DELETE CASCADE,
    link text,
    dedupekey text NOT NULL,
    createdat timestamp with time zone DEFAULT now() NOT NULL,
    resolvedat timestamp with time zone
);
CREATE INDEX notification_audience_gin_idx ON public.notification USING gin (audience);
CREATE INDEX notification_createdat_idx ON public.notification USING btree (createdat DESC);
CREATE INDEX notification_createdat_notificationid_idx ON public.notification USING btree (createdat DESC, notificationid DESC);
-- Lets the sweep in src/lib/notifications.ts insert idempotently
-- (`ON CONFLICT (dedupekey) WHERE resolvedat IS NULL DO NOTHING`).
CREATE UNIQUE INDEX notification_dedupekey_active_key ON public.notification USING btree (dedupekey) WHERE (resolvedat IS NULL);

CREATE TABLE public.notificationread (
    notificationid integer NOT NULL REFERENCES public.notification(notificationid) ON DELETE CASCADE,
    staffid text NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    readat timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (notificationid, staffid)
);
CREATE INDEX notificationread_staffid_notificationid_idx ON public.notificationread USING btree (staffid, notificationid);

CREATE TABLE public.staffnotificationcursor (
    staffid text NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    audience text NOT NULL,
    notificationid integer NOT NULL,
    updatedat timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (staffid, audience)
);