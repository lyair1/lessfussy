"use server";

import { revalidatePath } from "next/cache";
import { getUser, requireUserId } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types/db";

const DEFAULT_FAVORITE_ACTIVITIES = ["feeding", "sleep"];

const userSelect =
  "id,email,firstName:first_name,lastName:last_name,imageUrl:image_url,unitSystem:unit_system,tempUnit:temp_unit,timeFormat:time_format,favoriteActivities:favorite_activities,createdAt:created_at,updatedAt:updated_at";

function normalizeUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName ?? row.first_name ?? null,
    lastName: row.lastName ?? row.last_name ?? null,
    imageUrl: row.imageUrl ?? row.image_url ?? null,
    unitSystem: (row.unitSystem ??
      row.unit_system ??
      "imperial") as User["unitSystem"],
    tempUnit: (row.tempUnit ??
      row.temp_unit ??
      "fahrenheit") as User["tempUnit"],
    timeFormat: (row.timeFormat ??
      row.time_format ??
      "12h") as User["timeFormat"],
    favoriteActivities: (row.favoriteActivities ??
      row.favorite_activities ??
      null) as User["favoriteActivities"],
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

export async function getCurrentUser() {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select(userSelect)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return normalizeUser(data);
}

export async function ensureUserExists() {
  const userId = await requireUserId();

  const supabase = await createClient();

  const { data: existingUser, error: existingError } = await supabase
    .from("users")
    .select(userSelect)
    .eq("id", userId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (!existingUser) {
    const authUser = await getUser();

    const email = authUser?.email ?? "";
    const metadata = (authUser?.user_metadata ?? {}) as Record<string, unknown>;
    const firstName = (metadata.first_name as string | undefined) ?? null;
    const lastName = (metadata.last_name as string | undefined) ?? null;
    const imageUrl = (metadata.avatar_url as string | undefined) ?? null;

    const { error: insertError } = await supabase.from("users").insert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      image_url: imageUrl,
      favorite_activities: DEFAULT_FAVORITE_ACTIVITIES,
    });

    if (insertError) throw new Error(insertError.message);
  }

  const { data: user, error } = await supabase
    .from("users")
    .select(userSelect)
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);
  return normalizeUser(user);
}

export async function updateUserSettings(settings: {
  unitSystem?: "imperial" | "metric";
  tempUnit?: "fahrenheit" | "celsius";
  timeFormat?: "12h" | "24h";
}) {
  const userId = await requireUserId();

  const supabase = await createClient();
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (settings.unitSystem) updateData.unit_system = settings.unitSystem;
  if (settings.tempUnit) updateData.temp_unit = settings.tempUnit;
  if (settings.timeFormat) updateData.time_format = settings.timeFormat;

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function getFavoriteActivities(): Promise<string[]> {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return DEFAULT_FAVORITE_ACTIVITIES;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("favorite_activities")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (
    (data?.favorite_activities as string[] | null) ??
    DEFAULT_FAVORITE_ACTIVITIES
  );
}

export async function toggleFavoriteActivity(activityId: string) {
  const userId = await requireUserId();

  const supabase = await createClient();
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("favorite_activities")
    .eq("id", userId)
    .maybeSingle();

  if (userError) throw new Error(userError.message);

  const currentFavorites =
    (user?.favorite_activities as string[] | null) ??
    DEFAULT_FAVORITE_ACTIVITIES;

  let newFavorites: string[];
  if (currentFavorites.includes(activityId)) {
    // Remove from favorites
    newFavorites = currentFavorites.filter((id) => id !== activityId);
  } else {
    // Add to favorites
    newFavorites = [...currentFavorites, activityId];
  }

  const { error } = await supabase
    .from("users")
    .update({
      favorite_activities: newFavorites,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/baby");

  return newFavorites;
}
