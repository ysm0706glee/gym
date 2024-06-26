import { Button, Loader, PasswordInput, Text, TextInput } from "@mantine/core";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import {
  type LoaderFunctionArgs,
  redirect,
  ActionFunctionArgs,
  json,
} from "@vercel/remix";
import { z } from "zod";
import { links } from "~/lib/links";
import { createSupabaseServerClient } from "~/lib/supabase.server";

const loginWithPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

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
  const body = await request.formData();
  const { _action, ...value } = Object.fromEntries(body);
  if (_action === "login-with-google") {
    const url = new URL(request.url);
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${url.origin}${links.authCallback}` },
    });
    if (error) {
      return json({ error }, { headers });
    }
    return redirect(data.url, { headers });
  }
  if (_action === "login-with-password") {
    const parsed = loginWithPasswordSchema.safeParse(value);
    if (!parsed.success) {
      return json({ error: parsed.error.format() });
    }
    const email = parsed.data.email;
    const password = parsed.data.password;
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return json({ error }, { headers });
    }
    return redirect(links.home, { headers });
  }
}

export default function Login() {
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
          <Form method="post">
            <Button
              style={{ width: "100%" }}
              type="submit"
              name="_action"
              value="login-with-google"
              variant="white"
              color="gray"
            >
              Login with Google
            </Button>
          </Form>
          <Text style={{ margin: "1rem 0" }}>or</Text>
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
            <Button
              type="submit"
              name="_action"
              value="login-with-password"
              variant="white"
              color="gray"
            >
              Login
            </Button>
          </Form>
          <Link style={{ color: "#fff" }} to={links.signUp}>
            Sign Up
          </Link>
          {actionResponse?.error && <Text>Login failed</Text>}
        </>
      )}
    </div>
  );
}
