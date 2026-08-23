'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive,
  Building2,
  CalendarDays,
  Check,
  FileSignature,
  Grid2X2,
  HelpCircle,
  Landmark,
  Menu,
  PenLine,
  Settings,
  ShieldCheck,
  Truck,
  UserRoundPlus,
  WalletCards,
} from 'lucide-react';
import PageGuard from '../components/pageguard/page';
import { authClient } from '../lib/auth-client';

type PackageOption = {
  id: string;
  label: string;
  name: string;
  price: number;
  priceSuffix?: string;
  description: string;
  features: string[];
};

type BurialOption = {
  id: string;
  name: string;
  detail: string;
  price: number;
  icon: typeof Truck;
};

const packages: PackageOption[] = [
  {
    id: 'basic',
    label: 'ENTRY LEVEL',
    name: 'Basic Arrangement',
    price: 15000,
    description: 'A dignified essential service arrangement.',
    features: ['Standard Half-Glass Casket (Wood)', '3-Day Viewing Service'],
  },
  {
    id: 'heritage',
    label: 'MOST SELECTED',
    name: 'Heritage Classic (OG)',
    price: 35000,
    description: 'A considered memorial experience for families.',
    features: [
      'Metal Half-Glass Casket (Imported)',
      'Full Preservation Treatment',
      '5-Day Viewing (Air-conditioned)',
      'Standard Hearse',
    ],
  },
  {
    id: 'imperial',
    label: 'ELITE RESERVE',
    name: 'Imperial Grandeur',
    price: 80000,
    description: 'A fully tailored memorial service.',
    features: [
      'Sleeping Beauty Bronze / Solid Copper',
      'Unlimited Chapel Use',
      'Premium Glass-Top Karwahe',
    ],
  },
];

const burialOptions: BurialOption[] = [
  {
    id: 'modern',
    name: 'Modern Hearse',
    detail: 'Sleek temperature-controlled transport for modern dignity.',
    price: 0,
    icon: Truck,
  },
  {
    id: 'traditional',
    name: 'Traditional Karwahe',
    detail: 'Grand, ornate carriage with traditional processional decor.',
    price: 5000,
    icon: Landmark,
  },
];

const navItems = [
  { name: 'Dashboard', icon: Grid2X2, route: '/dashboard' },
  { name: 'Contracts', icon: FileSignature, route: '/contracts', active: true },
  { name: 'Intake', icon: UserRoundPlus, route: '/intake' },
  { name: 'Financials', icon: WalletCards, route: '/dashboard' },
  { name: 'Inventory', icon: Archive, route: '/dashboard' },
];

const money = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
});

type SignatureRecord = {
  packageId: string;
  implementId: string;
  signer: string;
  signedAt: string;
};

export default function ContractsPage() {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState('heritage');
  const [selectedImplement, setSelectedImplement] = useState('modern');
  const [menuOpen, setMenuOpen] = useState(false);
  const [signature, setSignature] = useState<SignatureRecord | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const savedSignature = localStorage.getItem(
        'villa-elisa-contract-signature',
      );
      return savedSignature
        ? (JSON.parse(savedSignature) as SignatureRecord)
        : null;
    } catch {
      return null;
    }
  });
  const [signer, setSigner] = useState('Authorized staff member');
  const [status, setStatus] = useState('');
  const packageDetails =
    packages.find((item) => item.id === selectedPackage) ?? packages[1];
  const implementDetails =
    burialOptions.find((item) => item.id === selectedImplement) ??
    burialOptions[0];
  const total = packageDetails.price + implementDetails.price;
  const isSigned =
    signature?.packageId === selectedPackage &&
    signature.implementId === selectedImplement;

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      const user = data?.user;
      if (user?.name || user?.email)
        setSigner(user.name || user.email || 'Authorized staff member');
    });
  }, []);

  function saveSelection() {
    try {
      localStorage.setItem(
        'villa-elisa-contract-draft',
        JSON.stringify({ selectedPackage, selectedImplement }),
      );
      setStatus('Selection saved as a draft.');
    } catch {
      setStatus('Unable to save this selection in your browser.');
    }
  }

  function signAgreement() {
    const record: SignatureRecord = {
      packageId: selectedPackage,
      implementId: selectedImplement,
      signer,
      signedAt: new Date().toISOString(),
    };
    setSignature(record);
    try {
      localStorage.setItem(
        'villa-elisa-contract-signature',
        JSON.stringify(record),
      );
      setStatus(`Agreement signed digitally by ${record.signer}.`);
    } catch {
      setStatus(
        'Agreement signed for this session, but could not be persisted.',
      );
    }
  }

  function generateContract() {
    if (!isSigned) {
      setStatus('Sign the agreement before generating the final contract.');
      return;
    }
    const agreement = `VILLA ELISA MEMORIAL SERVICE AGREEMENT\n\nPackage: ${packageDetails.name}\nBurial implement: ${implementDetails.name}\nContract total: ${money.format(total)}\nRequired downpayment: ${money.format(total * 0.15)}\nExecution year: ${new Date().getFullYear()}\n\nDIGITAL SIGNATURE\nSigner: ${signature?.signer}\nSigned at: ${signature?.signedAt}`;
    const download = document.createElement('a');
    download.href = URL.createObjectURL(
      new Blob([agreement], { type: 'text/plain' }),
    );
    download.download = `villa-elisa-contract-${selectedPackage}.txt`;
    download.click();
    URL.revokeObjectURL(download.href);
    setStatus('Final contract generated and downloaded.');
  }

  return (
    <PageGuard>
      <div className="min-h-screen bg-[#f7f8fa] text-[#122039] lg:flex">
        <aside
          className={`${menuOpen ? 'block' : 'hidden'} fixed inset-y-0 left-0 z-30 w-64 border-r border-[#e0e3e8] bg-[#f1f2f4] lg:static lg:block lg:w-52 lg:shrink-0`}
        >
          <div className="flex items-center gap-3 border-b border-[#e0e3e8] px-6 py-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#122039] text-white">
              <Building2 size={17} />
            </span>
            <div>
              <p className="font-serif text-lg leading-none text-[#122039]">
                Villa Elisa
              </p>
              <p className="mt-1 text-[7px] tracking-[0.2em] text-gray-500">
                FUNERAL MANAGEMENT
              </p>
            </div>
          </div>
          <nav className="space-y-1 p-4">
            {navItems.map(({ name, icon: Icon, route, active }) => (
              <button
                key={name}
                onClick={() => router.push(route)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-[10px] uppercase tracking-wide ${active ? 'bg-white font-semibold text-[#122039] shadow-sm' : 'text-gray-500 hover:bg-white/70'}`}
              >
                <Icon size={14} />
                {name}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-5 left-4 right-4 space-y-1">
            <button className="flex w-full items-center gap-3 px-3 py-3 text-[10px] uppercase tracking-wide text-gray-500">
              <Settings size={14} />
              Settings
            </button>
            <button className="flex w-full items-center gap-3 px-3 py-3 text-[10px] uppercase tracking-wide text-gray-500">
              <HelpCircle size={14} />
              Support
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-[#e0e3e8] bg-white px-5 py-4 lg:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <span className="font-serif text-lg">Villa Elisa</span>
            <span className="w-5" />
          </header>
          <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div>
                <h1 className="font-serif text-3xl text-[#122039] sm:text-4xl">
                  Package Selection
                </h1>
                <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
                  Curating a dignified farewell for the departed. Select a
                  package and finalize the formal agreement.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Drafts</span>
                <button
                  onClick={saveSelection}
                  className="rounded-md bg-[#122039] px-5 py-3 text-xs font-semibold tracking-wide text-white shadow-sm hover:bg-[#1d3151]"
                >
                  Save Selection
                </button>
              </div>
            </div>
            {status && (
              <p
                role="status"
                className="mb-5 rounded-md border border-[#d9dde3] bg-white px-4 py-3 text-sm text-gray-600"
              >
                {status}
              </p>
            )}

            <section className="grid gap-4 xl:grid-cols-3">
              {packages.map((item) => {
                const selected = item.id === selectedPackage;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedPackage(item.id)}
                    className={`relative flex min-h-75 flex-col rounded-lg border bg-white p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${selected ? 'border-[#122039] shadow-md ring-2 ring-[#122039] ring-offset-2' : 'border-[#e1e4e9]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-3 py-1 text-[8px] font-bold tracking-[0.12em] ${selected ? 'bg-[#f9d78f] text-[#614a15]' : 'text-gray-400'}`}
                      >
                        {item.label}
                      </span>
                      {selected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#122039] text-white">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <h2 className="mt-7 font-serif text-xl text-[#172238]">
                      {item.name}
                    </h2>
                    <p className="mt-2 text-2xl font-serif text-[#122039]">
                      {money.format(item.price)}{' '}
                      {item.priceSuffix && (
                        <span className="text-xl">{item.priceSuffix}</span>
                      )}
                    </p>
                    <p className="sr-only">{item.description}</p>
                    <ul className="mt-6 space-y-3 text-xs text-gray-600">
                      {item.features.map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <span className="mt-0.5 text-[#dfa83d]">
                            <Check size={13} />
                          </span>
                          <span
                            className={
                              item.id === 'imperial' &&
                              feature === item.features[0]
                                ? 'font-semibold text-[#122039]'
                                : ''
                            }
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <span
                      className={`mt-auto block rounded-md border py-2.5 text-center text-[10px] font-bold uppercase tracking-widest ${selected ? 'border-[#122039] bg-[#122039] text-white' : 'border-[#aeb6c2] text-[#122039]'}`}
                    >
                      {selected
                        ? 'Selected'
                        : item.id === 'imperial'
                          ? 'Request Quote'
                          : `Select ${item.id}`}
                    </span>
                  </button>
                );
              })}
            </section>

            <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
              <div>
                <h2 className="mb-5 font-serif text-2xl text-[#122039]">
                  Burial Implements
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {burialOptions.map(
                    ({ id, name, detail, price, icon: Icon }) => {
                      const selected = id === selectedImplement;
                      return (
                        <button
                          key={id}
                          onClick={() => setSelectedImplement(id)}
                          className={`min-h-32 rounded-md border bg-white p-5 text-left ${selected ? 'border-[#122039] shadow-sm' : 'border-[#e1e4e9]'}`}
                        >
                          <Icon size={19} className="mb-5 text-[#122039]" />
                          <p className="font-serif text-lg">{name}</p>
                          <p className="mt-1 max-w-52 text-[10px] leading-4 text-gray-500">
                            {detail}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-[#122039]">
                            {price ? `+ ${money.format(price)}` : 'Included'}
                          </p>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
              <aside className="rounded-md border border-[#d9dde3] bg-white p-6 shadow-sm">
                <h2 className="font-serif text-xl">Investment Summary</h2>
                <div className="mt-6 space-y-4 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Selected Package ({packageDetails.name})</span>
                    <strong className="text-[#122039]">
                      {money.format(packageDetails.price)}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-4 text-gray-500">
                    <span>Additional Implements ({implementDetails.name})</span>
                    <strong className="text-[#122039]">
                      {money.format(implementDetails.price)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Contract Total</span>
                    <span>{money.format(total)}</span>
                  </div>
                </div>
                <div className="mt-5 rounded-md bg-[#eef0f2] p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wide">
                    Required downpayment (15%)
                  </p>
                  <p className="mt-1 font-serif text-xl">
                    {money.format(total * 0.15)}
                  </p>
                  <CalendarDays
                    size={17}
                    className="float-right -mt-5 text-gray-400"
                  />
                </div>
              </aside>
            </section>

            <section className="mt-12">
              <div className="mx-auto max-w-3xl bg-white px-8 py-12 shadow-md sm:px-16">
                <div className="text-center">
                  <p className="font-serif text-2xl italic">Villa Elisa</p>
                  <p className="mt-1 text-[8px] tracking-[0.35em] text-gray-400">
                    FUNERAL SERVICES & MEMORIAL CHAPELS
                  </p>
                  <h2 className="mt-12 font-serif text-lg font-bold tracking-widest">
                    MEMORIAL SERVICE AGREEMENT
                  </h2>
                </div>
                <p className="mt-10 text-[10px] leading-5 text-gray-500">
                  This Agreement is entered into on this ____ day of __________,{' '}
                  {new Date().getFullYear()}, between Villa Elisa Funeral
                  Services and the undersigned Representative.
                </p>
                <h3 className="mt-8 text-[10px] font-bold">
                  I. SCOPE OF SERVICES
                </h3>
                <p className="mt-3 text-[10px] leading-5 text-gray-500">
                  The Service Provider agrees to facilitate the “
                  {packageDetails.name}” memorial package including{' '}
                  {implementDetails.name.toLowerCase()}, preservation, and
                  logistical handling of the remains.
                </p>
                <h3 className="mt-7 text-[10px] font-bold">
                  II. FINANCIAL OBLIGATIONS
                </h3>
                <p className="mt-3 text-[10px] leading-5 text-gray-500">
                  The total contract value is set at {money.format(total)}. A
                  non-refundable downpayment of 15% (
                  {money.format(total * 0.15)}) is required upon execution of
                  this document.
                </p>
                <div className="mt-16 grid gap-8 sm:grid-cols-2">
                  <div className="border-t border-gray-300 pt-2 text-[9px] text-gray-400">
                    {isSigned
                      ? `Digitally signed by ${signature?.signer} on ${new Date(signature.signedAt).toLocaleString('en-PH')}`
                      : 'Authorized Admin Signature'}
                  </div>
                  <button
                    onClick={signAgreement}
                    className={`flex items-center justify-center gap-2 border border-dashed py-3 text-[9px] font-bold tracking-wide ${isSigned ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50'}`}
                  >
                    <PenLine size={13} />
                    {isSigned ? 'SIGNED DIGITALLY' : 'SIGN DIGITALLY'}
                  </button>
                </div>
              </div>
              <div className="mt-8 text-center">
                <button
                  onClick={generateContract}
                  className="inline-flex items-center gap-3 rounded-md bg-[#122039] px-10 py-4 text-xs font-bold tracking-[0.15em] text-white shadow-lg hover:bg-[#1d3151]"
                >
                  <ShieldCheck size={16} />
                  GENERATE FINAL CONTRACT
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </PageGuard>
  );
}
