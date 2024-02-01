import { Button, PasswordInput, TextInput } from "@mantine/core";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import { createBrowserClient } from "@supabase/ssr";

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

export default function Login() {
  const { env } = useLoaderData<typeof loader>();
  const supabase = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const navigate = useNavigate();

  const loginWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "/auth/callback",
        },
      });
    } catch (error) {
      // TODO: handle error
      console.error(error);
    }
  };

  const loginWithPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = event.currentTarget.email.value;
    const password = event.currentTarget.password.value;
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return navigate("/calendar");
    } catch (error) {
      // TODO: handle error
      console.error(error);
    }
  };

  return (
    <div>
      <Button onClick={loginWithGoogle}>Login with Google</Button>
      <form onSubmit={loginWithPassword}>
        <TextInput
          withAsterisk
          label="Email"
          placeholder="your@email.com"
          name="email"
        />
        <PasswordInput label="password" name="password" />
        <Button type="submit">Login</Button>
      </form>
      <Link to="/signup">Sign Up</Link>
    </div>
  );
}
