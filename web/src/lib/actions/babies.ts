"use server";

import { auth } from "@clerk/nextjs/server";
import { db, babies, babyShares, users } from "@/lib/db";
import { eq, or, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getBabies() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  // Get babies owned by user
  const ownedBabies = await db.query.babies.findMany({
    where: eq(babies.ownerId, userId),
    orderBy: (babies, { desc }) => [desc(babies.createdAt)],
  });

  // Get babies shared with user
  const sharedBabyIds = await db.query.babyShares.findMany({
    where: eq(babyShares.userId, userId),
  });

  const sharedBabies = await Promise.all(
    sharedBabyIds.map(async (share) => {
      const baby = await db.query.babies.findFirst({
        where: eq(babies.id, share.babyId),
      });
      return baby ? { ...baby, isShared: true, role: share.role } : null;
    })
  );

  const validSharedBabies = sharedBabies.filter(
    (b): b is NonNullable<typeof b> => b !== null
  );
  
  return [
    ...ownedBabies.map((b) => ({ ...b, isShared: false, role: "owner" as const })),
    ...validSharedBabies,
  ];
}

export async function getBaby(babyId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const baby = await db.query.babies.findFirst({
    where: eq(babies.id, babyId),
  });

  if (!baby) return null;

  // Check if user has access
  if (baby.ownerId === userId) {
    return { ...baby, role: "owner" as const };
  }

  const share = await db.query.babyShares.findFirst({
    where: and(eq(babyShares.babyId, babyId), eq(babyShares.userId, userId)),
  });

  if (share) {
    return { ...baby, role: share.role };
  }

  return null;
}

export async function createBaby(data: { name: string; birthDate?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const [newBaby] = await db
    .insert(babies)
    .values({
      name: data.name,
      birthDate: data.birthDate || null,
      ownerId: userId,
    })
    .returning();

  revalidatePath("/");
  revalidatePath("/babies");

  return newBaby;
}

export async function updateBaby(
  babyId: string,
  data: { name?: string; birthDate?: string; photoUrl?: string }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const baby = await getBaby(babyId);
  if (!baby || baby.role !== "owner") {
    throw new Error("Not authorized to update this baby");
  }

  const [updatedBaby] = await db
    .update(babies)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(babies.id, babyId))
    .returning();

  revalidatePath("/");
  revalidatePath("/babies");

  return updatedBaby;
}

export async function deleteBaby(babyId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const baby = await getBaby(babyId);
  if (!baby || baby.role !== "owner") {
    throw new Error("Not authorized to delete this baby");
  }

  await db.delete(babies).where(eq(babies.id, babyId));

  revalidatePath("/");
  revalidatePath("/babies");
}

export async function shareBaby(babyId: string, email: string, role: "viewer" | "editor" = "editor") {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const baby = await getBaby(babyId);
  if (!baby || baby.role !== "owner") {
    throw new Error("Not authorized to share this baby");
  }

  // Find user by email
  const targetUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!targetUser) {
    throw new Error("User not found. They must sign up first.");
  }

  if (targetUser.id === userId) {
    throw new Error("You cannot share with yourself");
  }

  // Check if already shared
  const existingShare = await db.query.babyShares.findFirst({
    where: and(eq(babyShares.babyId, babyId), eq(babyShares.userId, targetUser.id)),
  });

  if (existingShare) {
    throw new Error("Already shared with this user");
  }

  await db.insert(babyShares).values({
    babyId,
    userId: targetUser.id,
    role,
  });

  revalidatePath("/babies");
}

export async function removeBabyShare(babyId: string, targetUserId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const baby = await getBaby(babyId);
  if (!baby || baby.role !== "owner") {
    throw new Error("Not authorized");
  }

  await db
    .delete(babyShares)
    .where(and(eq(babyShares.babyId, babyId), eq(babyShares.userId, targetUserId)));

  revalidatePath("/babies");
}

export async function getBabyShares(babyId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const baby = await getBaby(babyId);
  if (!baby) throw new Error("Baby not found");

  const shares = await db.query.babyShares.findMany({
    where: eq(babyShares.babyId, babyId),
    with: {
      user: true,
    },
  });

  return shares;
}

