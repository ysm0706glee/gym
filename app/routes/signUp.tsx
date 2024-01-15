import { useLoaderData } from "@remix-run/react";
import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";
import { TextInput, PasswordInput, Button } from "@mantine/core";

export function loader() {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };
  return { env };
}

export default function SignUp() {
  const { env } = useLoaderData<typeof loader>();
  const supabase = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
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
          emailRedirectTo: "http://localhost:3000/login",
        },
      });
      if (error) throw error;
      console.log(data);
      //
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
        <Button type="submit">Login</Button>
      </form>
      {isSingedUp && <p>Check your email for a verification link</p>}
    </div>
  );
}
