"use client";

import { useState } from "react";
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
} from "lucide-react";
import PageGuard from "../components/pageguard/page";

const packages = [
  {
    id: "basic",
    label: "ENTRY LEVEL",
    name: "Basic Arrangement",
    price: 15000,
    description: "A dignified essential service arrangement.",
    features: ["Standard Half-Glass Casket (Wood)", "3-Day Viewing Service"],
  },
  {
    id: "heritage",
    label: "MOST SELECTED",
    name: "Heritage Classic (OG)",
    price: 35000,
    description: "A considered memorial experience for families.",
    features: ["Metal Half-Glass Casket (Imported)", "Full Preservation Treatment", "5-Day Viewing (Air-conditioned)", "Standard Hearse"],
  },
  {
    id: "imperial",
    label: "ELITE RESERVE",
    name: "Imperial Grandeur",
    price: 80000,
    priceSuffix: "- 600,000",
    description: "A fully tailored memorial service.",
    features: ["Sleeping Beauty Bronze / Solid Copper", "Unlimited Chapel Use", "Premium Glass-Top Karwahe"],
  },
];

const burialOptions = [
  { id: "modern", name: "Modern Hearse", detail: "Sleek temperature-controlled transport for modern dignity.", icon: Truck },
  { id: "traditional", name: "Traditional Karwahe", detail: "Grand, ornate carriage with traditional processional decor.", icon: Landmark },
];

const navItems = [
  { name: "Dashboard", icon: Grid2X2 },
  { name: "Contracts", icon: FileSignature, active: true },
  { name: "Intake", icon: UserRoundPlus },
  { name: "Financials", icon: WalletCards },
  { name: "Inventory", icon: Archive },
];

const money = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });

export default function ContractsPage() {
  const [selectedPackage, setSelectedPackage] = useState("heritage");
  const [selectedImplement, setSelectedImplement] = useState("modern");
  const [menuOpen, setMenuOpen] = useState(false);
  const packageDetails = packages.find((item) => item.id === selectedPackage) ?? packages[1];
  const total = packageDetails.price;

  return (
    <PageGuard>
      <div className="min-h-screen bg-[#f7f8fa] text-[#122039] lg:flex">
        <aside className={`${menuOpen ? "block" : "hidden"} fixed inset-y-0 left-0 z-30 w-64 border-r border-[#e0e3e8] bg-[#f1f2f4] lg:static lg:block lg:w-52 lg:shrink-0`}>
          <div className="flex items-center gap-3 border-b border-[#e0e3e8] px-6 py-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#122039] text-white"><Building2 size={17} /></span>
            <div><p className="font-serif text-lg leading-none text-[#122039]">Villa Elisa</p><p className="mt-1 text-[7px] tracking-[0.2em] text-gray-500">FUNERAL MANAGEMENT</p></div>
          </div>
          <nav className="space-y-1 p-4">
            {navItems.map(({ name, icon: Icon, active }) => <button key={name} className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-[10px] uppercase tracking-wide ${active ? "bg-white font-semibold text-[#122039] shadow-sm" : "text-gray-500 hover:bg-white/70"}`}><Icon size={14} />{name}</button>)}
          </nav>
          <div className="absolute bottom-5 left-4 right-4 space-y-1"><button className="flex w-full items-center gap-3 px-3 py-3 text-[10px] uppercase tracking-wide text-gray-500"><Settings size={14} />Settings</button><button className="flex w-full items-center gap-3 px-3 py-3 text-[10px] uppercase tracking-wide text-gray-500"><HelpCircle size={14} />Support</button></div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-[#e0e3e8] bg-white px-5 py-4 lg:hidden"><button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={20} /></button><span className="font-serif text-lg">Villa Elisa</span><span className="w-5" /></header>
          <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div><h1 className="font-serif text-3xl text-[#122039] sm:text-4xl">Package Selection</h1><p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">Curating a dignified farewell for the departed. Select a package and finalize the formal agreement.</p></div>
              <div className="flex items-center gap-4"><span className="text-sm text-gray-500">Drafts</span><button className="rounded-md bg-[#122039] px-5 py-3 text-xs font-semibold tracking-wide text-white shadow-sm hover:bg-[#1d3151]">Save Selection</button></div>
            </div>

            <section className="grid gap-4 xl:grid-cols-3">
              {packages.map((item) => { const selected = item.id === selectedPackage; return <button key={item.id} onClick={() => setSelectedPackage(item.id)} className={`relative flex min-h-[300px] flex-col rounded-lg border bg-white p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${selected ? "border-[#122039] shadow-md ring-2 ring-[#122039] ring-offset-2" : "border-[#e1e4e9]"}`}>
                <div className="flex items-center justify-between"><span className={`rounded-full px-3 py-1 text-[8px] font-bold tracking-[0.12em] ${selected ? "bg-[#f9d78f] text-[#614a15]" : "text-gray-400"}`}>{item.label}</span>{selected && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#122039] text-white"><Check size={12} /></span>}</div>
                <h2 className="mt-7 font-serif text-xl text-[#172238]">{item.name}</h2><p className="mt-2 text-2xl font-serif text-[#122039]">{money.format(item.price)} {item.priceSuffix && <span className="text-xl">{item.priceSuffix}</span>}</p><p className="sr-only">{item.description}</p>
                <ul className="mt-6 space-y-3 text-xs text-gray-600">{item.features.map((feature) => <li key={feature} className="flex gap-2"><span className="mt-0.5 text-[#dfa83d]"><Check size={13} /></span><span className={item.id === "imperial" && feature === item.features[0] ? "font-semibold text-[#122039]" : ""}>{feature}</span></li>)}</ul>
                <span className={`mt-auto block rounded-md border py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.1em] ${selected ? "border-[#122039] bg-[#122039] text-white" : "border-[#aeb6c2] text-[#122039]"}`}>{selected ? "Selected" : item.id === "imperial" ? "Request Quote" : `Select ${item.id}`}</span>
              </button>; })}
            </section>

            <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
              <div><h2 className="mb-5 font-serif text-2xl text-[#122039]">Burial Implements</h2><div className="grid gap-4 sm:grid-cols-2">{burialOptions.map(({ id, name, detail, icon: Icon }) => { const selected = id === selectedImplement; return <button key={id} onClick={() => setSelectedImplement(id)} className={`min-h-32 rounded-md border bg-white p-5 text-left ${selected ? "border-[#122039] shadow-sm" : "border-[#e1e4e9]"}`}><Icon size={19} className="mb-5 text-[#122039]" /><p className="font-serif text-lg">{name}</p><p className="mt-1 max-w-52 text-[10px] leading-4 text-gray-500">{detail}</p></button>; })}</div></div>
              <aside className="rounded-md border border-[#d9dde3] bg-white p-6 shadow-sm"><h2 className="font-serif text-xl">Investment Summary</h2><div className="mt-6 space-y-4 text-xs"><div className="flex justify-between text-gray-500"><span>Selected Package ({packageDetails.name})</span><strong className="text-[#122039]">{money.format(total)}</strong></div><div className="flex justify-between border-b border-gray-200 pb-4 text-gray-500"><span>Additional Implements</span><strong className="text-[#122039]">{money.format(0)}</strong></div><div className="flex justify-between text-sm font-bold"><span>Contract Total</span><span>{money.format(total)}</span></div></div><div className="mt-5 rounded-md bg-[#eef0f2] p-4"><p className="text-[9px] font-bold uppercase tracking-wide">Required downpayment (15%)</p><p className="mt-1 font-serif text-xl">{money.format(total * 0.15)}</p><CalendarDays size={17} className="float-right -mt-5 text-gray-400" /></div></aside>
            </section>

            <section className="mt-12"><div className="mx-auto max-w-3xl bg-white px-8 py-12 shadow-md sm:px-16"><div className="text-center"><p className="font-serif text-2xl italic">Villa Elisa</p><p className="mt-1 text-[8px] tracking-[0.35em] text-gray-400">FUNERAL SERVICES & MEMORIAL CHAPELS</p><h2 className="mt-12 font-serif text-lg font-bold tracking-widest">MEMORIAL SERVICE AGREEMENT</h2></div><p className="mt-10 text-[10px] leading-5 text-gray-500">This Agreement is entered into on this ____ day of __________, 2023, between Villa Elisa Funeral Services and the undersigned Representative.</p><h3 className="mt-8 text-[10px] font-bold">I. SCOPE OF SERVICES</h3><p className="mt-3 text-[10px] leading-5 text-gray-500">The Service Provider agrees to facilitate the “{packageDetails.name}” memorial package including but not limited to casket provision, preservation, and logistical handling of the remains.</p><h3 className="mt-7 text-[10px] font-bold">II. FINANCIAL OBLIGATIONS</h3><p className="mt-3 text-[10px] leading-5 text-gray-500">The total contract value is set at {money.format(total)}. A non-refundable downpayment of 15% ({money.format(total * 0.15)}) is required upon execution of this document.</p><div className="mt-16 grid gap-8 sm:grid-cols-2"><div className="border-t border-gray-300 pt-2 text-[9px] text-gray-400">Authorized Admin Signature</div><button className="flex items-center justify-center gap-2 border border-dashed border-gray-300 bg-gray-50 py-3 text-[9px] font-bold tracking-wide"><PenLine size={13} /> SIGN DIGITALLY</button></div></div><div className="mt-8 text-center"><button className="inline-flex items-center gap-3 rounded-md bg-[#122039] px-10 py-4 text-xs font-bold tracking-[0.15em] text-white shadow-lg hover:bg-[#1d3151]"><ShieldCheck size={16} />GENERATE FINAL CONTRACT</button></div></section>
          </main>
        </div>
      </div>
    </PageGuard>
  );
}