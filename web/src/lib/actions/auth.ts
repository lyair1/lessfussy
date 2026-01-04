"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return null;
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/sign-in?error=${encodeURIComponent(error.message)}${
        redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ""
      }`
    );
  }

  redirect(redirectTo || "/dashboard");
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();

  const siteUrl = getSiteUrl();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      ...(siteUrl
        ? {
            emailRedirectTo: `${siteUrl}/auth/callback${
              redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""
            }`,
          }
        : {}),
    },
  });

  if (error) {
    redirect(
      `/sign-up?error=${encodeURIComponent(error.message)}${
        redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ""
      }`
    );
  }

  // If email confirmation is required, Supabase will not return a session.
  if (!data.session) {
    redirect(
      `/sign-in?signup=check-email&email=${encodeURIComponent(email)}${
        redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ""
      }`
    );
  }

  redirect(redirectTo || "/dashboard");
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();

  const siteUrl = getSiteUrl();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      ...(siteUrl
        ? {
            emailRedirectTo: `${siteUrl}/auth/callback${
              redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""
            }`,
          }
        : {}),
    },
  });

  if (error) {
    redirect(
      `/sign-in?error=${encodeURIComponent(error.message)}${
        redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ""
      }`
    );
  }

  redirect(
    `/sign-in?magic=sent${
      redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ""
    }`
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
