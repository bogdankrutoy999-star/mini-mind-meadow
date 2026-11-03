import { createClient } from "@supabase/supabase-js";

export async function authenticateChat(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice(7);
  if (token.split(".").length !== 3) return false;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return false;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  } } });
  const { data, error } = await client.auth.getUser(token);
  return !error && Boolean(data.user);
}