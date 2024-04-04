import { type LoaderFunctionArgs, redirect } from "@vercel/remix";
import { links } from "~/lib/links";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const isLocal = process.env.NODE_ENV === "development";
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const { supabaseClient, headers } = createSupabaseServerClient(request);
  if (code) {
    const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirect(isLocal ? links.url.local : links.url.production, {
        headers,
      });
    }
  }
  return redirect(
    isLocal
      ? `${links.url.local}${links.login}`
      : `${links.url.production}${links.login}`,
    { headers }
  );
}
