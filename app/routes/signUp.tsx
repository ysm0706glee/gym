import { Button, PasswordInput, TextInput } from "@mantine/core";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Database } from "~/types/supabase";

export function loader() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env"
    );
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  };
  return { env };
}

export default function SignUp() {
  const { env } = useLoaderData<typeof loader>();
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
    <div>
      <form onSubmit={signUp}>
        <TextInput
          withAsterisk
          label="Email"
          placeholder="your@email.com"
          name="email"
        />
        <PasswordInput label="password" name="password" />
        <Button type="submit">Sign Up</Button>
      </form>
      {isSingedUp && <p>Check your email for a verification link</p>}
    </div>
  );
}
