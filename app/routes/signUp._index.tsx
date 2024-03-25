import { Button, PasswordInput, TextInput } from "@mantine/core";
import { Form, useActionData } from "@remix-run/react";
import {
  type LoaderFunctionArgs,
  redirect,
  ActionFunctionArgs,
  json,
} from "@vercel/remix";
import { createSupabaseServerClient } from "~/lib/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabaseClient } = createSupabaseServerClient(request);
  const user = await supabaseClient.auth.getUser();
  if (user.data.user) {
    return redirect("/");
  }
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const { supabaseClient, headers } = createSupabaseServerClient(request);
  const formData = await request.formData();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const isLocal = process.env.NODE_ENV === "development";
  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: isLocal
        ? "http://localhost:3000"
        : "https://gym-ysm0706glee.vercel.app",
    },
  });
  if (error) {
    return json({ success: false }, { headers });
  }
  return json({ success: true }, { headers });
}

export default function SignUp() {
  const actionResponse = useActionData<typeof action>();

  return (
    <div style={{ paddingTop: "1rem" }}>
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
    </div>
  );
}
