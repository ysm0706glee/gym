import { Button, PasswordInput, Text, TextInput } from "@mantine/core";
import {
  Link,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from "@remix-run/react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "~/types/supabase";

export default function Login() {
  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();

  const navigate = useNavigate();

  const isLocal = process.env.NODE_ENV === "development";

  const loginWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: isLocal
            ? "http://localhost:3000/auth/callback"
            : "https://gym-ysm0706glee.vercel.app/auth/callback",
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
      return navigate("/home");
    } catch (error) {
      // TODO: handle error
      console.error(error);
    }
  };

  return (
    <div style={{ height: "100%", padding: "1rem" }}>
      <Button
        style={{ width: "100%" }}
        variant="white"
        color="gray"
        onClick={loginWithGoogle}
      >
        Login with Google
      </Button>
      <Text style={{ margin: "1rem 0" }}>or</Text>
      <form
        style={{
          marginBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
        onSubmit={loginWithPassword}
      >
        <TextInput
          withAsterisk
          label="Email"
          placeholder="your@email.com"
          name="email"
        />
        <PasswordInput label="password" name="password" />
        <Button type="submit" variant="white" color="gray">
          Login
        </Button>
      </form>
      <Link to="/signup">Sign Up</Link>
    </div>
  );
}
