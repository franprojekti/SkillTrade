"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsername, usernameToEmail, validateUsername, validatePassword } from "@/lib/auth";

interface RegisterResult {
  error?: string;
}

export async function registerAction(
  prevState: RegisterResult | null,
  formData: FormData
): Promise<RegisterResult> {
  const rawUsername = (formData.get("username") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const confirmPassword = (formData.get("confirm_password") as string) ?? "";

  // Validate username
  const usernameError = validateUsername(rawUsername);
  if (usernameError) return { error: usernameError };

  // Validate password
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const username = normalizeUsername(rawUsername);
  const email = usernameToEmail(username);

  const supabase = await createClient();

  // Check if username already exists
  const { data: available, error: availableError } = await supabase.rpc("is_username_available", { p_username: username });
  if (availableError) {
    return { error: "Something went wrong. Please try again." };
  }
  if (available === false) {
    return { error: "That username is already taken. Please choose another." };
  }

  // Create user in Supabase Auth
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (signUpError) {
    if (signUpError.message.includes("already registered")) {
      return { error: "That username is already taken. Please choose another." };
    }
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/app/onboarding");
}
