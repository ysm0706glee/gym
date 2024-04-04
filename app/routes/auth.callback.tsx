import { type LoaderFunctionArgs, redirect } from "@vercel/remix";
import { links } from "~/lib/links";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const isProduction = process.env.VERCEL_ENV === "production";
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const { supabaseClient, headers } = createSupabaseServerClient(request);
  if (code) {
    const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirect(isProduction ? links.url.production : links.url.local, {
        headers,
      });
    }
  }
  return redirect(
    isProduction
      ? `${links.url.production}${links.login}`
      : `${links.url.local}${links.login}`,
    { headers }
  );
}
