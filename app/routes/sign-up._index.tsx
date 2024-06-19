import { Button, Loader, PasswordInput, TextInput } from "@mantine/core";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import {
  type LoaderFunctionArgs,
  redirect,
  ActionFunctionArgs,
  json,
} from "@vercel/remix";
import { links } from "~/lib/links";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (user.data.user) {
    return redirect(links.home);
  }
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabaseClient, headers } = createSupabaseServerClient(request);
  const formData = await request.formData();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const url = new URL(request.url);
  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: url.origin,
    },
  });
  if (error) {
    return json({ success: false }, { headers });
  }
  return json({ success: true }, { headers });
}

export default function SignUp() {
  const navigation = useNavigation();

  const actionResponse = useActionData<typeof action>();

  const isLoaderSubmission = navigation.state === "loading";
  const isLoaderSubmissionRedirect = navigation.state === "loading";
  const isLoading = isLoaderSubmission || isLoaderSubmissionRedirect;

  return (
    <div style={{ paddingTop: "1rem" }}>
      {isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "1rem",
          }}
        >
          <Loader color="gray" />
        </div>
      ) : (
        <>
          {!actionResponse?.success ? (
            <Form
              method="post"
              style={{
                marginBottom: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <TextInput
                withAsterisk
                label="Email"
                placeholder="your@email.com"
                name="email"
              />
              <PasswordInput label="password" name="password" />
              <Button type="submit" variant="white" color="gray">
                Sign Up
              </Button>
            </Form>
          ) : (
            <h3>Please check your email.</h3>
          )}
        </>
      )}
    </div>
  );
}
