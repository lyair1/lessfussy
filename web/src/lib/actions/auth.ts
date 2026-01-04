"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/dashboard");
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL ?? ""
      }/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/dashboard");
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL ?? ""
      }/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/sign-in?magic=sent");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
