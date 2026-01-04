import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/sign-in`, { status: 303 });
}
