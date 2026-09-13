import { FormEvent, useEffect, useMemo, useState } from "react";
import { Monitor, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AdminDevice, AdminDeviceInput } from "@/lib/admin-devices";
import { createAdminDevice, deleteAdminDevice, listAdminDevices, updateAdminDevice } from "@/lib/admin-devices";

const statuses = ["Available", "Unavailable", "Reserved"];

type DeviceForm = {
  name: string;
  model: string;
  specifications: string;
  amount: string;
  status: string;
};

const emptyForm: DeviceForm = {
  name: "",
  model: "",
  specifications: "",
  amount: "",
  status: "Available",
};

function formFromDevice(device: AdminDevice): DeviceForm {
  return {
    name: device.name,
    model: device.model,
    specifications: device.specifications,
    amount: device.amount === null ? "" : String(device.amount),
    status: device.status,
  };
}

function formatAmount(amount: number | null) {
  if (amount === null) return "Price on request";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);
}

function toInput(form: DeviceForm): AdminDeviceInput {
  const amount = form.amount.trim() === "" ? null : Number(form.amount);
  return {
    name: form.name.trim(),
    model: form.model.trim(),
    specifications: form.specifications.trim(),
    amount: Number.isNaN(amount) ? null : amount,
    status: form.status,
  };
}

export default function AdminDevices() {
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<DeviceForm>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<AdminDevice | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<AdminDevice | null>(null);

  const loadDevices = async () => {
    setIsLoading(true);
    setError("");
    try {
      setDevices(await listAdminDevices());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load devices.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDevices();
  }, []);

  const filteredDevices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return devices;
    return devices.filter((device) => [device.name, device.model, device.specifications, device.status].some((value) => value.toLowerCase().includes(normalizedQuery)));
  }, [devices, query]);

  const openCreateForm = () => {
    setEditingDevice(null);
    setForm(emptyForm);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (device: AdminDevice) => {
    setEditingDevice(device);
    setForm(formFromDevice(device));
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) return;
    setEditingDevice(null);
    setForm(emptyForm);
    setFormError("");
    setIsFormOpen(false);
  };

  const updateForm = (field: keyof DeviceForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = toInput(form);
    if (!input.name || !input.model || !input.specifications || !input.status) {
      setFormError("Complete all device fields before saving.");
      return;
    }
    if (input.amount !== null && (Number.isNaN(input.amount) || input.amount < 0)) {
      setFormError("Enter a valid non-negative amount.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      if (editingDevice) {
        await updateAdminDevice(editingDevice.id, input);
      } else {
        await createAdminDevice(input);
      }
      await loadDevices();
      setIsFormOpen(false);
      setEditingDevice(null);
      setForm(emptyForm);
      setFormError("");
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Unable to save device.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deviceToDelete) return;
    setError("");
    try {
      await deleteAdminDevice(deviceToDelete.id);
      await loadDevices();
      setDeviceToDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete device.");
    }
  };

  return (
    <>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Inventory</p>
          <h2 className="mt-2 text-[32px] font-extrabold tracking-[-0.04em] text-navy sm:text-[40px]">Devices</h2>
          <p className="mt-3 max-w-[580px] text-sm leading-6 text-slate-500">Manage the devices available for contributor payment requests and keep inventory details current.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><ShieldCheck size={16} className="text-orange" /> Protected administrator data</div>
      </div>

      {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</div>}

      <div className="mt-8 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_3px_16px_rgba(20,36,52,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <label className="relative min-w-0 flex-1 sm:max-w-[520px]"><span className="sr-only">Search devices</span><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by device name, model, or status" className="h-11 w-full rounded-lg border border-slate-200 bg-[#fbfcfd] pl-10 pr-3 text-sm text-navy outline-none transition placeholder:text-slate-400 focus:border-orange focus:ring-2 focus:ring-orange/10" /></label>
        <button type="button" onClick={openCreateForm} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orange px-5 text-xs font-extrabold text-navy shadow-[0_6px_18px_rgba(255,153,0,0.16)] transition hover:bg-orange-light"><Plus size={16} /> Add device</button>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_3px_16px_rgba(20,36,52,0.04)]">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6"><div><h3 className="text-sm font-extrabold text-navy">Device inventory</h3><p className="mt-1 text-xs text-slate-500">{isLoading ? "Loading devices..." : `${filteredDevices.length} device${filteredDevices.length === 1 ? "" : "s"}${query.trim() ? ` matching “${query.trim()}”` : ""}`}</p></div><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Supabase inventory</span></div>
        {isLoading ? <div className="px-5 py-14 text-center text-sm text-slate-500">Loading device inventory...</div> : filteredDevices.length === 0 ? <div className="px-5 py-14 text-center"><Monitor size={24} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-bold text-navy">No devices found</p><p className="mt-1 text-xs text-slate-500">Add a device or try a different search.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-[#fbfcfd] text-[10px] font-bold uppercase tracking-wide text-slate-400"><tr><th className="px-6 py-3">Device</th><th className="px-6 py-3">Model</th><th className="px-6 py-3">Specifications</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Status</th><th className="px-6 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-slate-100">{filteredDevices.map((device) => <tr key={device.id} className="transition hover:bg-[#fbfcfd]"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange/10 text-orange"><Monitor size={17} /></span><span className="text-sm font-bold text-navy">{device.name}</span></div></td><td className="px-6 py-4 text-sm text-slate-600">{device.model}</td><td className="max-w-[260px] px-6 py-4 text-sm text-slate-500"><span className="line-clamp-2">{device.specifications}</span></td><td className="px-6 py-4 text-sm font-bold text-navy">{formatAmount(device.amount)}</td><td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${device.status === "Available" ? "bg-emerald-50 text-emerald-700" : device.status === "Reserved" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{device.status}</span></td><td className="px-6 py-4"><div className="flex items-center justify-end gap-2"><button type="button" onClick={() => openEditForm(device)} className="rounded-md p-2 text-slate-400 transition hover:bg-orange/10 hover:text-orange" aria-label={`Edit ${device.name}`}><Pencil size={16} /></button><button type="button" onClick={() => setDeviceToDelete(device)} className="rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${device.name}`}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>}
      </div>

      {isFormOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={editingDevice ? "Edit device" : "Add device"} onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
        <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-xl bg-white p-6 shadow-2xl sm:rounded-xl sm:p-7"><div className="flex items-start justify-between gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Inventory record</p><h3 className="mt-2 text-xl font-extrabold text-navy">{editingDevice ? "Edit device" : "Add device"}</h3><p className="mt-2 text-sm leading-6 text-slate-500">Keep device information accurate for administrators and payment request processing.</p></div><button type="button" onClick={closeForm} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy" aria-label="Close device form">×</button></div><form className="mt-6 space-y-4" onSubmit={handleSubmit}><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span className="text-xs font-bold text-navy">Device Name</span><input required value={form.name} onChange={(event) => updateForm("name", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-[#fbfcfd] px-3 text-sm text-navy outline-none focus:border-orange focus:ring-2 focus:ring-orange/10" /></label><label className="space-y-2"><span className="text-xs font-bold text-navy">Model</span><input required value={form.model} onChange={(event) => updateForm("model", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-[#fbfcfd] px-3 text-sm text-navy outline-none focus:border-orange focus:ring-2 focus:ring-orange/10" /></label></div><label className="block space-y-2"><span className="text-xs font-bold text-navy">Specifications</span><textarea required value={form.specifications} onChange={(event) => updateForm("specifications", event.target.value)} rows={4} className="w-full resize-y rounded-lg border border-slate-200 bg-[#fbfcfd] px-3 py-3 text-sm leading-5 text-navy outline-none focus:border-orange focus:ring-2 focus:ring-orange/10" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span className="text-xs font-bold text-navy">Amount</span><input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => updateForm("amount", event.target.value)} placeholder="Optional" className="h-11 w-full rounded-lg border border-slate-200 bg-[#fbfcfd] px-3 text-sm text-navy outline-none focus:border-orange focus:ring-2 focus:ring-orange/10" /></label><label className="space-y-2"><span className="text-xs font-bold text-navy">Availability / Status</span><select value={form.status} onChange={(event) => updateForm("status", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-[#fbfcfd] px-3 text-sm font-semibold text-navy outline-none focus:border-orange focus:ring-2 focus:ring-orange/10">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label></div>{formError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{formError}</p>}<div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={closeForm} disabled={isSaving} className="rounded-lg border border-slate-200 px-4 py-3 text-xs font-extrabold text-slate-600 transition hover:border-slate-300 hover:text-navy disabled:opacity-50">Cancel</button><button type="submit" disabled={isSaving} className="rounded-lg bg-navy px-5 py-3 text-xs font-extrabold text-white transition hover:bg-navy/90 disabled:opacity-50">{isSaving ? "Saving..." : editingDevice ? "Save changes" : "Add device"}</button></div></form></section>
      </div>}

      <AlertDialog open={Boolean(deviceToDelete)} onOpenChange={(open) => { if (!open) setDeviceToDelete(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this device?</AlertDialogTitle><AlertDialogDescription>This will permanently remove {deviceToDelete?.name} from the device inventory. Existing payment requests will keep their saved device details.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void handleDelete(); }} disabled={isLoading} className="bg-red-600 text-white hover:bg-red-700">Delete device</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  );
}
