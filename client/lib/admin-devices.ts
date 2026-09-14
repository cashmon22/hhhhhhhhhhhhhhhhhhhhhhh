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

async function requireAdminSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Your secure session has expired. Please sign in again.");
  if (session.user.app_metadata?.role !== "admin") throw new Error("Administrator access required.");
}

export async function listAdminDevices(): Promise<AdminDevice[]> {
  await requireAdminSession();
  const { data, error } = await supabase
    .from("devices")
    .select(deviceFields)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminDevice[];
}

export async function createAdminDevice(device: AdminDeviceInput) {
  await requireAdminSession();
  const { error } = await supabase.from("devices").insert(device);
  if (error) throw error;
}

export async function updateAdminDevice(id: string, device: AdminDeviceInput) {
  await requireAdminSession();
  const { error } = await supabase.from("devices").update(device).eq("id", id);
  if (error) throw error;
}

export async function deleteAdminDevice(id: string) {
  await requireAdminSession();
  const { error } = await supabase.from("devices").delete().eq("id", id);
  if (error) throw error;
}
