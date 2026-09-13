import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AdminDevice = {
  id: string;
  name: string;
  model: string;
  specifications: string;
  amount: number | null;
  status: string;
};

type AdminDeviceInput = Omit<AdminDevice, "id">;

type RequestBody = {
  action?: "list" | "create" | "update" | "delete";
  id?: unknown;
  device?: unknown;
};

const deviceFields = "id, name, model, specifications, amount, status";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getDeviceInput(value: unknown): AdminDeviceInput | null {
  if (!value || typeof value !== "object") return null;
  const device = value as Partial<AdminDeviceInput>;
  if (typeof device.name !== "string" || !device.name.trim()
    || typeof device.model !== "string" || !device.model.trim()
    || typeof device.specifications !== "string" || !device.specifications.trim()
    || typeof device.status !== "string" || !device.status.trim()
    || (device.amount !== null && (typeof device.amount !== "number" || !Number.isFinite(device.amount) || device.amount < 0))) {
    return null;
  }
  return {
    name: device.name.trim(),
    model: device.model.trim(),
    specifications: device.specifications.trim(),
    amount: device.amount,
    status: device.status.trim(),
  };
}

function isDeviceId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "Authentication required" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return json({ error: "Admin device data is not configured." }, 503);
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Authentication required" }, 401);
  if (userData.user.app_metadata?.role !== "admin") {
    return json({ error: "Administrator access required" }, 403);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (body.action === "list") {
    const { data, error } = await serviceClient
      .from("devices")
      .select(deviceFields)
      .order("name", { ascending: true });
    if (error) return json({ error: "Unable to load devices." }, 500);
    const devices = (data ?? []) as AdminDevice[];
    return json({ devices, total: devices.length });
  }

  if (body.action === "create") {
    const device = getDeviceInput(body.device);
    if (!device) return json({ error: "Invalid device data." }, 400);
    const { data, error } = await serviceClient
      .from("devices")
      .insert(device)
      .select(deviceFields)
      .single();
    if (error || !data) return json({ error: "Unable to create device." }, 500);
    return json(data, 201);
  }

  if (body.action === "update") {
    const device = getDeviceInput(body.device);
    if (!isDeviceId(body.id) || !device) return json({ error: "Invalid device data." }, 400);
    const { data, error } = await serviceClient
      .from("devices")
      .update(device)
      .eq("id", body.id)
      .select(deviceFields)
      .maybeSingle();
    if (error) return json({ error: "Unable to update device." }, 500);
    if (!data) return json({ error: "Device not found." }, 404);
    return json(data);
  }

  if (body.action === "delete") {
    if (!isDeviceId(body.id)) return json({ error: "A device id is required." }, 400);
    const { error } = await serviceClient.from("devices").delete().eq("id", body.id);
    if (error) return json({ error: "Unable to delete device." }, 500);
    return json({ id: body.id });
  }

  return json({ error: "Invalid action." }, 400);
});
