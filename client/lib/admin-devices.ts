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

type AdminDevicesResponse = {
  devices: AdminDevice[];
  total: number;
};

type DeviceRequest = {
  action: "list" | "create" | "update" | "delete";
  id?: string;
  device?: AdminDeviceInput;
};

async function invokeDevices<T>(body: DeviceRequest): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Your secure session has expired. Please sign in again.");

  const { data, error } = await supabase.functions.invoke<T>("admin-devices", {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw error;
  if (!data) throw new Error("Unable to complete the request.");
  return data;
}

export async function listAdminDevices(): Promise<AdminDevice[]> {
  const response = await invokeDevices<AdminDevicesResponse>({ action: "list" });
  return response.devices;
}

export function createAdminDevice(device: AdminDeviceInput) {
  return invokeDevices<AdminDevice>({ action: "create", device });
}

export function updateAdminDevice(id: string, device: AdminDeviceInput) {
  return invokeDevices<AdminDevice>({ action: "update", id, device });
}

export function deleteAdminDevice(id: string) {
  return invokeDevices<{ id: string }>({ action: "delete", id });
}
