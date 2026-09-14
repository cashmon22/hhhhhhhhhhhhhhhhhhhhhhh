import { supabase } from "./supabase";

export type AdminDevice = {
  id: string;
  name: string;
  model: string;
  specifications: string;
  amount: number | null;
  status: string;
  imageUrl: string | null;
};

export type AdminDeviceInput = Omit<AdminDevice, "id" | "imageUrl">;

export const DEVICE_IMAGE_BUCKET = "device-images";
const deviceFields = "id, name, model, specifications, amount, status";

type DeviceRecord = Omit<AdminDevice, "imageUrl">;

async function requireAdminSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Your secure session has expired. Please sign in again.");
  if (session.user.app_metadata?.role !== "admin") throw new Error("Administrator access required.");
}

async function getDeviceImageUrl(id: string) {
  const { data: files, error } = await supabase.storage.from(DEVICE_IMAGE_BUCKET).list(id, {
    limit: 1,
    sortBy: { column: "updated_at", order: "desc" },
  });
  if (error || !files?.[0]) return null;
  const { data, error: signedUrlError } = await supabase.storage
    .from(DEVICE_IMAGE_BUCKET)
    .createSignedUrl(`${id}/${files[0].name}`, 3600);
  return signedUrlError ? null : data.signedUrl;
}

async function withImageUrl(device: DeviceRecord): Promise<AdminDevice> {
  return { ...device, imageUrl: await getDeviceImageUrl(device.id) };
}

async function listDeviceImagePaths(id: string) {
  const { data, error } = await supabase.storage.from(DEVICE_IMAGE_BUCKET).list(id);
  return error ? [] : (data ?? []).filter((file) => file.name).map((file) => `${id}/${file.name}`);
}

export async function listAdminDevices(): Promise<AdminDevice[]> {
  await requireAdminSession();
  const { data, error } = await supabase
    .from("devices")
    .select(deviceFields)
    .order("name", { ascending: true });
  if (error) throw error;
  return Promise.all((data ?? []).map((device) => withImageUrl(device as DeviceRecord)));
}

export async function createAdminDevice(device: AdminDeviceInput): Promise<AdminDevice> {
  await requireAdminSession();
  const { data, error } = await supabase
    .from("devices")
    .insert(device)
    .select(deviceFields)
    .single();
  if (error) throw error;
  return withImageUrl(data as DeviceRecord);
}

export async function updateAdminDevice(id: string, device: AdminDeviceInput): Promise<AdminDevice> {
  await requireAdminSession();
  const { data, error } = await supabase
    .from("devices")
    .update(device)
    .eq("id", id)
    .select(deviceFields)
    .single();
  if (error) throw error;
  return withImageUrl(data as DeviceRecord);
}

export async function uploadAdminDeviceImage(id: string, file: File) {
  await requireAdminSession();
  const oldPaths = await listDeviceImagePaths(id);
  if (oldPaths.length > 0) {
    const { error: removeError } = await supabase.storage.from(DEVICE_IMAGE_BUCKET).remove(oldPaths);
    if (removeError) throw removeError;
  }
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${id}/image-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(DEVICE_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
}

export async function deleteAdminDevice(id: string) {
  await requireAdminSession();
  const oldPaths = await listDeviceImagePaths(id);
  if (oldPaths.length > 0) {
    const { error: removeError } = await supabase.storage.from(DEVICE_IMAGE_BUCKET).remove(oldPaths);
    if (removeError) throw removeError;
  }
  const { error } = await supabase.from("devices").delete().eq("id", id);
  if (error) throw error;
}
