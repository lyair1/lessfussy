"use server";

import { auth } from "@clerk/nextjs/server";
import { db, feedings, sleepLogs, diapers, pottyLogs, pumpings, medicines, temperatures, activities, growthLogs, solids } from "@/lib/db";
import { getBaby } from "./babies";
import { revalidatePath } from "next/cache";
import { eq, desc, and, gte, lte, isNull } from "drizzle-orm";
import type {
  NewFeeding,
  NewSleepLog,
  NewDiaper,
  NewPumping,
} from "@/lib/db/schema";

// Helper to check baby access
async function checkBabyAccess(babyId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const baby = await getBaby(babyId);
  if (!baby) throw new Error("Baby not found or access denied");
  if (baby.role === "viewer") throw new Error("View-only access");

  return baby;
}

// ============ FEEDING ============

export async function createFeeding(data: Omit<NewFeeding, "id" | "createdAt" | "updatedAt">) {
  await checkBabyAccess(data.babyId);

  const [result] = await db.insert(feedings).values(data).returning();
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function getLastFeeding(babyId: string) {
  await checkBabyAccess(babyId);

  return await db.query.feedings.findFirst({
    where: eq(feedings.babyId, babyId),
    orderBy: [desc(feedings.startTime)],
  });
}

export async function getActiveNursing(babyId: string) {
  await checkBabyAccess(babyId);

  return await db.query.feedings.findFirst({
    where: and(
      eq(feedings.babyId, babyId),
      eq(feedings.type, "nursing"),
      isNull(feedings.endTime)
    ),
    orderBy: [desc(feedings.startTime)],
  });
}

export async function startOrUpdateActiveNursing(data: {
  babyId: string;
  startTime: Date;
  leftDuration: number; // seconds on left at this moment
  rightDuration: number; // seconds on right at this moment
  pausedDuration: number; // seconds paused at this moment
  currentStatus: "left" | "right" | "paused";
  notes?: string;
}) {
  await checkBabyAccess(data.babyId);

  const now = new Date();

  // Determine side based on which breasts have been used
  let side: "left" | "right" | "both" = "both";
  if (data.leftDuration > 0 && data.rightDuration === 0) side = "left";
  else if (data.rightDuration > 0 && data.leftDuration === 0) side = "right";

  // Check if there's already an active nursing session
  const existing = await db.query.feedings.findFirst({
    where: and(
      eq(feedings.babyId, data.babyId),
      eq(feedings.type, "nursing"),
      isNull(feedings.endTime)
    ),
  });

  if (existing) {
    // Update existing session
    const [result] = await db
      .update(feedings)
      .set({
        startTime: data.startTime,
        side,
        leftDuration: data.leftDuration,
        rightDuration: data.rightDuration,
        pausedDuration: data.pausedDuration,
        lastPersistedAt: now,
        currentStatus: data.currentStatus,
        notes: data.notes,
        updatedAt: now,
      })
      .where(eq(feedings.id, existing.id))
      .returning();
    return result;
  } else {
    // Create new active session
    const [result] = await db
      .insert(feedings)
      .values({
        babyId: data.babyId,
        type: "nursing",
        startTime: data.startTime,
        endTime: null,
        side,
        leftDuration: data.leftDuration,
        rightDuration: data.rightDuration,
        pausedDuration: data.pausedDuration,
        lastPersistedAt: now,
        currentStatus: data.currentStatus,
        notes: data.notes,
      })
      .returning();
    return result;
  }
}

export async function cancelActiveNursing(babyId: string) {
  await checkBabyAccess(babyId);

  // Find and delete the active nursing session
  const existing = await db.query.feedings.findFirst({
    where: and(
      eq(feedings.babyId, babyId),
      eq(feedings.type, "nursing"),
      isNull(feedings.endTime)
    ),
  });

  if (existing) {
    await db.delete(feedings).where(eq(feedings.id, existing.id));
  }

  revalidatePath("/");
}

export async function completeActiveNursing(babyId: string, data: {
  startTime: Date;
  endTime: Date;
  leftDuration: number; // final seconds on left
  rightDuration: number; // final seconds on right
  pausedDuration: number; // final seconds paused
  notes?: string;
}) {
  await checkBabyAccess(babyId);

  // Determine side based on which breasts were used
  let side: "left" | "right" | "both" = "both";
  if (data.leftDuration > 0 && data.rightDuration === 0) side = "left";
  else if (data.rightDuration > 0 && data.leftDuration === 0) side = "right";

  // Find the active nursing session
  const existing = await db.query.feedings.findFirst({
    where: and(
      eq(feedings.babyId, babyId),
      eq(feedings.type, "nursing"),
      isNull(feedings.endTime)
    ),
  });

  if (existing) {
    // Complete the existing session - clear lastPersistedAt and currentStatus
    const [result] = await db
      .update(feedings)
      .set({
        startTime: data.startTime,
        endTime: data.endTime,
        side,
        leftDuration: data.leftDuration,
        rightDuration: data.rightDuration,
        pausedDuration: data.pausedDuration,
        lastPersistedAt: null,
        currentStatus: null,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(feedings.id, existing.id))
      .returning();
    
    revalidatePath("/");
    revalidatePath("/history");
    return result;
  } else {
    // No active session, create a completed one
    const [result] = await db
      .insert(feedings)
      .values({
        babyId,
        type: "nursing",
        startTime: data.startTime,
        endTime: data.endTime,
        side,
        leftDuration: data.leftDuration,
        rightDuration: data.rightDuration,
        pausedDuration: data.pausedDuration,
        lastPersistedAt: null,
        currentStatus: null,
        notes: data.notes,
      })
      .returning();
    
    revalidatePath("/");
    revalidatePath("/history");
    return result;
  }
}

export async function updateFeeding(
  id: string,
  babyId: string,
  data: Partial<NewFeeding>
) {
  await checkBabyAccess(babyId);

  const [result] = await db
    .update(feedings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(feedings.id, id))
    .returning();

  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function deleteFeeding(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(feedings).where(eq(feedings.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ SLEEP ============

export async function createSleepLog(data: Omit<NewSleepLog, "id" | "createdAt" | "updatedAt">) {
  await checkBabyAccess(data.babyId);

  const [result] = await db.insert(sleepLogs).values(data).returning();
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function updateSleepLog(
  id: string,
  babyId: string,
  data: Partial<NewSleepLog>
) {
  await checkBabyAccess(babyId);

  const [result] = await db
    .update(sleepLogs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sleepLogs.id, id))
    .returning();

  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function getActiveSleep(babyId: string) {
  await checkBabyAccess(babyId);

  return await db.query.sleepLogs.findFirst({
    where: and(eq(sleepLogs.babyId, babyId), isNull(sleepLogs.endTime)),
    orderBy: [desc(sleepLogs.startTime)],
  });
}

export async function deleteSleepLog(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(sleepLogs).where(eq(sleepLogs.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ DIAPER ============

export async function createDiaper(data: Omit<NewDiaper, "id" | "createdAt">) {
  await checkBabyAccess(data.babyId);

  const [result] = await db.insert(diapers).values(data).returning();
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function deleteDiaper(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(diapers).where(eq(diapers.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ POTTY ============

export async function createPottyLog(data: { babyId: string; time: Date; type: "sat_but_dry" | "success" | "accident"; notes?: string }) {
  await checkBabyAccess(data.babyId);

  const [result] = await db.insert(pottyLogs).values(data).returning();
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function deletePottyLog(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(pottyLogs).where(eq(pottyLogs.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ PUMPING ============

export async function createPumping(data: Omit<NewPumping, "id" | "createdAt">) {
  await checkBabyAccess(data.babyId);

  const [result] = await db.insert(pumpings).values(data).returning();
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function deletePumping(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(pumpings).where(eq(pumpings.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ MEDICINE ============

export async function createMedicine(data: {
  babyId: string;
  time: Date;
  name?: string;
  amount?: number;
  unit?: "oz" | "ml" | "drops" | "tsp";
  notes?: string;
}) {
  await checkBabyAccess(data.babyId);

  const [result] = await db.insert(medicines).values(data).returning();
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function deleteMedicine(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(medicines).where(eq(medicines.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ TEMPERATURE ============

export async function createTemperature(data: {
  babyId: string;
  time: Date;
  value: number;
  unit: string;
  notes?: string;
}) {
  await checkBabyAccess(data.babyId);

  const [result] = await db.insert(temperatures).values(data).returning();
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function deleteTemperature(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(temperatures).where(eq(temperatures.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ ACTIVITY ============

export async function createActivity(data: {
  babyId: string;
  startTime: Date;
  endTime?: Date;
  type: "bath" | "tummy_time" | "story_time" | "screen_time" | "skin_to_skin" | "play" | "outdoor" | "other";
  notes?: string;
}) {
  await checkBabyAccess(data.babyId);

  const [result] = await db.insert(activities).values(data).returning();
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function deleteActivity(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(activities).where(eq(activities.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ GROWTH ============

export async function createGrowthLog(data: {
  babyId: string;
  date: string;
  time?: Date;
  weight?: number;
  weightUnit?: string;
  height?: number;
  heightUnit?: string;
  headCircumference?: number;
  headUnit?: string;
  notes?: string;
}) {
  await checkBabyAccess(data.babyId);

  const [result] = await db.insert(growthLogs).values(data).returning();
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function deleteGrowthLog(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(growthLogs).where(eq(growthLogs.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ SOLIDS ============

export async function createSolid(data: {
  babyId: string;
  time: Date;
  foods?: string[];
  reaction?: "loved_it" | "meh" | "hated_it" | "allergy_or_sensitivity";
  photoUrl?: string;
  notes?: string;
}) {
  await checkBabyAccess(data.babyId);

  const [result] = await db.insert(solids).values(data).returning();
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function deleteSolid(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(solids).where(eq(solids.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ HISTORY ============

export async function getTimelineEntries(babyId: string, date: Date) {
  await checkBabyAccess(babyId);

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    feedingsData,
    sleepData,
    diapersData,
    pottyData,
    pumpingsData,
    medicinesData,
    temperaturesData,
    activitiesData,
    growthData,
    solidsData,
  ] = await Promise.all([
    db.query.feedings.findMany({
      where: and(
        eq(feedings.babyId, babyId),
        gte(feedings.startTime, startOfDay),
        lte(feedings.startTime, endOfDay)
      ),
      orderBy: [desc(feedings.startTime)],
    }),
    db.query.sleepLogs.findMany({
      where: and(
        eq(sleepLogs.babyId, babyId),
        gte(sleepLogs.startTime, startOfDay),
        lte(sleepLogs.startTime, endOfDay)
      ),
      orderBy: [desc(sleepLogs.startTime)],
    }),
    db.query.diapers.findMany({
      where: and(
        eq(diapers.babyId, babyId),
        gte(diapers.time, startOfDay),
        lte(diapers.time, endOfDay)
      ),
      orderBy: [desc(diapers.time)],
    }),
    db.query.pottyLogs.findMany({
      where: and(
        eq(pottyLogs.babyId, babyId),
        gte(pottyLogs.time, startOfDay),
        lte(pottyLogs.time, endOfDay)
      ),
      orderBy: [desc(pottyLogs.time)],
    }),
    db.query.pumpings.findMany({
      where: and(
        eq(pumpings.babyId, babyId),
        gte(pumpings.startTime, startOfDay),
        lte(pumpings.startTime, endOfDay)
      ),
      orderBy: [desc(pumpings.startTime)],
    }),
    db.query.medicines.findMany({
      where: and(
        eq(medicines.babyId, babyId),
        gte(medicines.time, startOfDay),
        lte(medicines.time, endOfDay)
      ),
      orderBy: [desc(medicines.time)],
    }),
    db.query.temperatures.findMany({
      where: and(
        eq(temperatures.babyId, babyId),
        gte(temperatures.time, startOfDay),
        lte(temperatures.time, endOfDay)
      ),
      orderBy: [desc(temperatures.time)],
    }),
    db.query.activities.findMany({
      where: and(
        eq(activities.babyId, babyId),
        gte(activities.startTime, startOfDay),
        lte(activities.startTime, endOfDay)
      ),
      orderBy: [desc(activities.startTime)],
    }),
    db.query.growthLogs.findMany({
      where: and(
        eq(growthLogs.babyId, babyId),
        gte(growthLogs.date, startOfDay.toISOString().split("T")[0]),
        lte(growthLogs.date, endOfDay.toISOString().split("T")[0])
      ),
      orderBy: [desc(growthLogs.date)],
    }),
    db.query.solids.findMany({
      where: and(
        eq(solids.babyId, babyId),
        gte(solids.time, startOfDay),
        lte(solids.time, endOfDay)
      ),
      orderBy: [desc(solids.time)],
    }),
  ]);

  // Combine and sort all entries
  const allEntries = [
    ...feedingsData.map((f) => ({ ...f, entryType: "feeding" as const, time: f.startTime })),
    ...sleepData.map((s) => ({ ...s, entryType: "sleep" as const, time: s.startTime })),
    ...diapersData.map((d) => ({ ...d, entryType: "diaper" as const })),
    ...pottyData.map((p) => ({ ...p, entryType: "potty" as const })),
    ...pumpingsData.map((p) => ({ ...p, entryType: "pumping" as const, time: p.startTime })),
    ...medicinesData.map((m) => ({ ...m, entryType: "medicine" as const })),
    ...temperaturesData.map((t) => ({ ...t, entryType: "temperature" as const })),
    ...activitiesData.map((a) => ({ ...a, entryType: "activity" as const, time: a.startTime })),
    ...growthData.map((g) => ({ ...g, entryType: "growth" as const, time: new Date(g.date) })),
    ...solidsData.map((s) => ({ ...s, entryType: "solids" as const })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return allEntries;
}

