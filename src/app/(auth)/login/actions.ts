"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsername, usernameToEmail } from "@/lib/auth";

interface LoginResult {
  error?: string;
}

export async function loginAction(
  prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const rawUsername = (formData.get("username") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";

  if (!rawUsername || !password) {
    return { error: "Please enter your username and password." };
  }

  const username = normalizeUsername(rawUsername);
  const email = usernameToEmail(username);

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid username or password." };
  }

  redirect("/app/dashboard");
}
