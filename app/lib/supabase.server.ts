import { createServerClient, parse, serialize } from "@supabase/ssr";
import type { Database } from "~/types/supabase";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export function createSupabaseServerClient(request: Request) {
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();
  const supabaseClient = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return cookies[key];
        },
        set(key, value, options) {
          headers.append("Set-Cookie", serialize(key, value, options));
        },
        remove(key, options) {
          headers.append("Set-Cookie", serialize(key, "", options));
        },
      },
    }
  );
  return { SUPABASE_URL, SUPABASE_ANON_KEY, headers, supabaseClient };
}
