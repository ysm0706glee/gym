import { Button, PasswordInput, Text, TextInput } from "@mantine/core";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { createServerClient, parse, serialize } from "@supabase/ssr";
import { type LoaderFunctionArgs, redirect } from "@vercel/remix";
import { Database } from "~/types/supabase";

export async function loader({ request }: LoaderFunctionArgs) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env"
    );
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();
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
  const user = await supabase.auth.getUser();
  if (user.data.user) {
    return redirect("/");
  }
  return null;
}

export default function SignUp() {
  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();

  const isLocal = process.env.NODE_ENV === "development";

  const [isSingedUp, setIsSignedUp] = useState(false);

  const signUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = event.currentTarget.email.value;
    const password = event.currentTarget.password.value;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: isLocal
            ? "http://localhost:3000/login"
            : "https://gym-ysm0706glee.vercel.app/login",
        },
      });
      if (error) throw error;
      // TODO: handle data
      setIsSignedUp(true);
    } catch (error) {
      // TODO: handle error
      console.error(error);
    }
  };

  return (
    <div style={{ height: "100%", paddingTop: "1rem" }}>
      <form
        style={{
          marginBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
        onSubmit={signUp}
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
      </form>
      {isSingedUp && <Text>Check your email for a verification link</Text>}
    </div>
  );
}