"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

const babySelect =
  "id,name,birthDate:birth_date,photoUrl:photo_url,ownerId:owner_id,createdAt:created_at,updatedAt:updated_at";

const shareSelect =
  "id,babyId:baby_id,userId:user_id,role,createdAt:created_at";

export async function getBabies() {
  const userId = await requireUserId();
  const supabase = await createClient();

  // Get babies owned by user
  const { data: ownedBabies, error: ownedError } = await supabase
    .from("babies")
    .select(babySelect)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (ownedError) throw new Error(ownedError.message);

  // Get babies shared with user
  const { data: shares, error: sharesError } = await supabase
    .from("baby_shares")
    .select(`${shareSelect},baby:babies(${babySelect})`)
    .eq("user_id", userId);

  if (sharesError) throw new Error(sharesError.message);

  const sharedBabies = (shares ?? [])
    .map((share) => {
      const baby = (share as any).baby as any | null;
      if (!baby) return null;
      return { ...baby, isShared: true as const, role: (share as any).role };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  return [
    ...(ownedBabies ?? []).map((b) => ({
      ...b,
      isShared: false as const,
      role: "owner" as const,
    })),
    ...sharedBabies,
  ];
}

export async function getBaby(babyId: string) {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: baby, error: babyError } = await supabase
    .from("babies")
    .select(babySelect)
    .eq("id", babyId)
    .maybeSingle();

  if (babyError) throw new Error(babyError.message);

  if (!baby) return null;

  // Check if user has access
  if ((baby as any).ownerId === userId) {
    return { ...baby, role: "owner" as const };
  }

  const { data: share, error: shareError } = await supabase
    .from("baby_shares")
    .select("role")
    .eq("baby_id", babyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (shareError) throw new Error(shareError.message);

  if (share) {
    return { ...baby, role: (share as any).role };
  }

  return null;
}

export async function createBaby(data: { name: string; birthDate?: string }) {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: newBaby, error } = await supabase
    .from("babies")
    .insert({
      name: data.name,
      birth_date: data.birthDate || null,
      owner_id: userId,
    })
    .select(babySelect)
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/babies");
  revalidatePath(`/baby/${newBaby.id}`);

  return newBaby;
}

export async function updateBaby(
  babyId: string,
  data: { name?: string; birthDate?: string; photoUrl?: string }
) {
  await requireUserId();
  const supabase = await createClient();

  const baby = await getBaby(babyId);
  if (!baby || baby.role !== "owner") {
    throw new Error("Not authorized to update this baby");
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.birthDate !== undefined) updateData.birth_date = data.birthDate;
  if (data.photoUrl !== undefined) updateData.photo_url = data.photoUrl;

  const { data: updatedBaby, error } = await supabase
    .from("babies")
    .update(updateData)
    .eq("id", babyId)
    .select(babySelect)
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/babies");
  revalidatePath(`/baby/${babyId}`);

  return updatedBaby;
}

export async function deleteBaby(babyId: string) {
  await requireUserId();
  const supabase = await createClient();

  const baby = await getBaby(babyId);
  if (!baby || baby.role !== "owner") {
    throw new Error("Not authorized to delete this baby");
  }

  const { error } = await supabase.from("babies").delete().eq("id", babyId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/babies");
  revalidatePath(`/baby/${babyId}`);
}

export async function shareBaby(
  babyId: string,
  email: string,
  role: "viewer" | "editor" = "editor"
) {
  const userId = await requireUserId();
  const supabase = await createClient();

  const baby = await getBaby(babyId);
  if (!baby || baby.role !== "owner") {
    throw new Error("Not authorized to share this baby");
  }

  // Find user by email
  const { data: targetUser, error: targetError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (targetError) throw new Error(targetError.message);

  if (!targetUser) {
    throw new Error("User not found. They must sign up first.");
  }

  if (targetUser.id === userId) {
    throw new Error("You cannot share with yourself");
  }

  // Check if already shared
  const { data: existingShare, error: existingError } = await supabase
    .from("baby_shares")
    .select("id")
    .eq("baby_id", babyId)
    .eq("user_id", (targetUser as any).id)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existingShare) {
    throw new Error("Already shared with this user");
  }

  const { error: insertError } = await supabase.from("baby_shares").insert({
    baby_id: babyId,
    user_id: (targetUser as any).id,
    role,
  });

  if (insertError) throw new Error(insertError.message);

  revalidatePath("/babies");
}

export async function removeBabyShare(babyId: string, targetUserId: string) {
  await requireUserId();
  const supabase = await createClient();

  const baby = await getBaby(babyId);
  if (!baby || baby.role !== "owner") {
    throw new Error("Not authorized");
  }

  const { error } = await supabase
    .from("baby_shares")
    .delete()
    .eq("baby_id", babyId)
    .eq("user_id", targetUserId);

  if (error) throw new Error(error.message);

  revalidatePath("/babies");
}

export async function getBabyShares(babyId: string) {
  await requireUserId();
  const supabase = await createClient();

  const baby = await getBaby(babyId);
  if (!baby) throw new Error("Baby not found");

  const { data: shares, error } = await supabase
    .from("baby_shares")
    .select(
      `${shareSelect},user:users(id,email,first_name:firstName,last_name:lastName,image_url:imageUrl)`
    )
    .eq("baby_id", babyId);

  if (error) throw new Error(error.message);
  return shares;
}
