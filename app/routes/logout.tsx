import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function action({ request }: ActionFunctionArgs) {
  const { supabaseClient, headers } = createSupabaseServerClient(request);
  await supabaseClient.auth.signOut();
  return redirect("/login", { headers });
}
