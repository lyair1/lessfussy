"use server";

import { auth } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user;
}

export async function ensureUserExists() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!existingUser) {
    // Create user with default settings if not exists
    // This handles cases where webhook might not have fired yet
    const { sessionClaims } = await auth();
    await db.insert(users).values({
      id: userId,
      email: (sessionClaims?.email as string) ?? "",
      firstName: (sessionClaims?.first_name as string) ?? null,
      lastName: (sessionClaims?.last_name as string) ?? null,
      imageUrl: (sessionClaims?.image_url as string) ?? null,
    });
  }

  return await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
}

export async function updateUserSettings(settings: {
  unitSystem?: "imperial" | "metric";
  tempUnit?: "fahrenheit" | "celsius";
  timeFormat?: "12h" | "24h";
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  await db
    .update(users)
    .set({
      ...settings,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath("/settings");
  revalidatePath("/");
}

