import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { links } from "~/lib/links";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function action({ request }: ActionFunctionArgs) {
  const { supabaseClient, headers } = createSupabaseServerClient(request);
  await supabaseClient.auth.signOut();
  return redirect(links.login, { headers });
}
