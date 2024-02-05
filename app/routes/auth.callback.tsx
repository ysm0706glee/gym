import { createServerClient, parse, serialize } from "@supabase/ssr";
import { type LoaderFunctionArgs, redirect } from "@vercel/remix";

export async function loader({ request }: LoaderFunctionArgs) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env"
    );
  const isLocal = process.env.NODE_ENV === "development";
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const headers = new Headers();
  if (code) {
    const cookies = parse(request.headers.get("Cookie") ?? "");
    const supabase = createServerClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirect(
        isLocal
          ? "http://localhost:3000"
          : "https://gym-ysm0706glee.vercel.app",
        { headers }
      );
    }
  }
  return redirect(
    isLocal
      ? "http://localhost:3000/login"
      : "https://gym-ysm0706glee.vercel.app/login",
    { headers }
  );
}
