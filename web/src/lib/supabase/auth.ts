import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return user;
}

export async function requireUserId() {
  const user = await getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user.id;
}
