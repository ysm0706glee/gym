import { type LoaderFunctionArgs, redirect } from "@vercel/remix";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const isLocal = process.env.NODE_ENV === "development";
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const { supabaseClient, headers } = createSupabaseServerClient(request);
  if (code) {
    const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
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
