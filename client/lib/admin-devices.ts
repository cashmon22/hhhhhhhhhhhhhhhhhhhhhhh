import { supabase } from "./supabase";

export type AdminDevice = {
  id: string;
  name: string;
  model: string;
  specifications: string;
  amount: number | null;
  status: string;
};

export type AdminDeviceInput = Omit<AdminDevice, "id">;

const deviceFields = "id, name, model, specifications, amount, status";

export async function listAdminDevices(): Promise<AdminDevice[]> {
  const { data, error } = await supabase
    .from("devices")
    .select(deviceFields)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminDevice[];
}

export async function createAdminDevice(device: AdminDeviceInput) {
  const { error } = await supabase.from("devices").insert(device);
  if (error) throw error;
}

export async function updateAdminDevice(id: string, device: AdminDeviceInput) {
  const { error } = await supabase.from("devices").update(device).eq("id", id);
  if (error) throw error;
}

export async function deleteAdminDevice(id: string) {
  const { error } = await supabase.from("devices").delete().eq("id", id);
  if (error) throw error;
}
