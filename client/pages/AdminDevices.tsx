import { Clock3, Monitor, ShieldCheck, Sparkles } from "lucide-react";

export default function AdminDevices() {
  return (
    <section aria-labelledby="devices-heading">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Inventory</p>
          <h2 id="devices-heading" className="mt-2 text-[32px] font-extrabold tracking-[-0.04em] text-navy sm:text-[40px]">Devices</h2>
          <p className="mt-3 max-w-[580px] text-sm leading-6 text-slate-500">Device inventory management is being prepared for the administrator workspace.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><ShieldCheck size={16} className="text-orange" /> Protected administrator data</div>
      </div>

      <div className="relative mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white px-6 py-12 shadow-[0_3px_16px_rgba(20,36,52,0.04)] sm:px-12 sm:py-16">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-sky-100/70 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange/10 text-orange ring-8 ring-orange/[0.035]">
            <Monitor size={29} strokeWidth={1.8} />
          </div>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-orange/20 bg-orange/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-navy">
            <Sparkles size={13} className="text-orange" /> Coming soon
          </div>
          <h3 className="mt-4 text-2xl font-extrabold tracking-[-0.03em] text-navy sm:text-[28px]">Inventory management is on its way</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">We’re preparing a dedicated workspace for managing device records, availability, and inventory details with confidence.</p>

          <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-[#fbfcfd] p-4">
              <Clock3 size={18} className="text-orange" />
              <p className="mt-3 text-sm font-bold text-navy">In preparation</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">This area is being carefully readied for administrators.</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-[#fbfcfd] p-4">
              <ShieldCheck size={18} className="text-orange" />
              <p className="mt-3 text-sm font-bold text-navy">Current workflows stay intact</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">No existing inventory or payment-request experience has changed.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
