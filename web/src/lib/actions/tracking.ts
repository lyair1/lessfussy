"use server";

import { auth } from "@clerk/nextjs/server";
import {
  db,
  feedings,
  sleepLogs,
  diapers,
  pottyLogs,
  pumpings,
  medicines,
  temperatures,
  activities,
  growthLogs,
  solids,
} from "@/lib/db";
import { getBaby } from "./babies";
import { revalidatePath } from "next/cache";
import { eq, desc, and, gte, lte, isNull } from "drizzle-orm";
import { checkActivityConflicts } from "@/lib/conflicts";
import { type ActivityType } from "@/lib/utils";
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

// Helper to check for activity conflicts
async function checkAndThrowConflicts(
  babyId: string,
  activityType: ActivityType,
  startTime?: Date,
  endTime?: Date,
  options: { allowOverride?: boolean; babyName?: string; excludeEntryId?: string } = {}
) {
  const { allowOverride = false, babyName, excludeEntryId } = options;
  const conflictResult = await checkActivityConflicts(
    babyId,
    activityType,
    startTime,
    endTime,
    babyName,
    excludeEntryId
  );

  if (conflictResult.hasConflicts) {
    // If overrides are not allowed, throw for all conflicts
    if (!allowOverride) {
      throw new Error("Activity conflicts detected");
    }

    // If overrides are allowed, only throw for active conflicts
    const hasActiveConflicts = conflictResult.conflicts.some(
      (c) => c.type === "active_conflict"
    );
    if (hasActiveConflicts) {
      throw new Error("Active activity conflicts detected");
    }
  }
}

// ============ FEEDING ============

export async function createFeeding(
  data: Omit<NewFeeding, "id" | "createdAt" | "updatedAt">,
  options: { allowOverride?: boolean } = {}
) {
  const baby = await checkBabyAccess(data.babyId);

  // Check for conflicts - bottle feedings are completed immediately, nursing can be ongoing
  if (data.type === "bottle" || data.endTime) {
    // Completed feeding - check conflicts for the time period
    await checkAndThrowConflicts(
      data.babyId,
      "feeding",
      data.startTime,
      data.endTime || undefined,
      { ...options, babyName: baby.name }
    );
  } else if (data.type === "nursing") {
    // Starting a nursing session - check for active conflicts only
    await checkAndThrowConflicts(
      data.babyId,
      "feeding",
      data.startTime,
      data.endTime || undefined,
      { ...options, babyName: baby.name }
    );
  }

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

export async function getLastTrackingForAllTypes(babyId: string) {
  await checkBabyAccess(babyId);

  const [
    lastFeeding,
    lastSleep,
    lastDiaper,
    lastPumping,
    lastMedicine,
    lastTemperature,
    lastActivity,
    lastGrowth,
    lastPotty,
    lastSolids,
  ] = await Promise.all([
    db.query.feedings.findFirst({
      where: eq(feedings.babyId, babyId),
      orderBy: [desc(feedings.startTime)],
    }),
    db.query.sleepLogs.findFirst({
      where: eq(sleepLogs.babyId, babyId),
      orderBy: [desc(sleepLogs.startTime)],
    }),
    db.query.diapers.findFirst({
      where: eq(diapers.babyId, babyId),
      orderBy: [desc(diapers.time)],
    }),
    db.query.pumpings.findFirst({
      where: eq(pumpings.babyId, babyId),
      orderBy: [desc(pumpings.startTime)],
    }),
    db.query.medicines.findFirst({
      where: eq(medicines.babyId, babyId),
      orderBy: [desc(medicines.time)],
    }),
    db.query.temperatures.findFirst({
      where: eq(temperatures.babyId, babyId),
      orderBy: [desc(temperatures.time)],
    }),
    db.query.activities.findFirst({
      where: eq(activities.babyId, babyId),
      orderBy: [desc(activities.startTime)],
    }),
    db.query.growthLogs.findFirst({
      where: eq(growthLogs.babyId, babyId),
      orderBy: [desc(growthLogs.createdAt)],
    }),
    db.query.pottyLogs.findFirst({
      where: eq(pottyLogs.babyId, babyId),
      orderBy: [desc(pottyLogs.time)],
    }),
    db.query.solids.findFirst({
      where: eq(solids.babyId, babyId),
      orderBy: [desc(solids.time)],
    }),
  ]);

  return {
    feeding: lastFeeding,
    sleep: lastSleep,
    diaper: lastDiaper,
    pumping: lastPumping,
    medicine: lastMedicine,
    temperature: lastTemperature,
    activity: lastActivity,
    growth: lastGrowth,
    potty: lastPotty,
    solids: lastSolids,
  };
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

export async function startOrUpdateActiveNursing(
  data: {
    babyId: string;
    startTime: Date;
    leftDuration: number; // seconds on left at this moment
    rightDuration: number; // seconds on right at this moment
    pausedDuration: number; // seconds paused at this moment
    currentStatus: "left" | "right" | "paused";
    notes?: string;
  },
  options: { allowOverride?: boolean } = {}
) {
  const baby = await checkBabyAccess(data.babyId);

  const now = new Date();

  // Check if there's already an active nursing session
  const existing = await db.query.feedings.findFirst({
    where: and(
      eq(feedings.babyId, data.babyId),
      eq(feedings.type, "nursing"),
      isNull(feedings.endTime)
    ),
  });

  // Only check for conflicts when starting a new session (not updating existing)
  if (!existing) {
    await checkAndThrowConflicts(
      data.babyId,
      "feeding",
      data.startTime,
      undefined,
      { ...options, babyName: baby.name }
    );
  }

  // Determine side based on which breasts have been used
  let side: "left" | "right" | "both" = "both";
  if (data.leftDuration > 0 && data.rightDuration === 0) side = "left";
  else if (data.rightDuration > 0 && data.leftDuration === 0) side = "right";

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

export async function completeActiveNursing(
  babyId: string,
  data: {
    startTime: Date;
    endTime: Date;
    leftDuration: number; // final seconds on left
    rightDuration: number; // final seconds on right
    pausedDuration: number; // final seconds paused
    notes?: string;
  }
) {
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

export async function createSleepLog(
  data: Omit<NewSleepLog, "id" | "createdAt" | "updatedAt">,
  options: { allowOverride?: boolean } = {}
) {
  const baby = await checkBabyAccess(data.babyId);

  // Check for conflicts - if endTime is provided, it's a completed sleep session
  await checkAndThrowConflicts(
    data.babyId,
    "sleep",
    data.startTime,
    data.endTime || undefined,
    { ...options, babyName: baby.name }
  );

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

export async function updateDiaper(
  id: string,
  babyId: string,
  data: {
    time?: Date;
    type?: "pee" | "poo" | "mixed" | "dry";
    notes?: string;
  }
) {
  await checkBabyAccess(babyId);
  await db.update(diapers).set(data).where(eq(diapers.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteDiaper(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(diapers).where(eq(diapers.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ POTTY ============

export async function createPottyLog(data: {
  babyId: string;
  time: Date;
  type: "sat_but_dry" | "success" | "accident";
  notes?: string;
}) {
  await checkBabyAccess(data.babyId);

  const [result] = await db.insert(pottyLogs).values(data).returning();
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function updatePottyLog(
  id: string,
  babyId: string,
  data: {
    time?: Date;
    type?: "sat_but_dry" | "success" | "accident";
    notes?: string;
  }
) {
  await checkBabyAccess(babyId);
  await db.update(pottyLogs).set(data).where(eq(pottyLogs.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

export async function deletePottyLog(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(pottyLogs).where(eq(pottyLogs.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ PUMPING ============

export async function createPumping(
  data: Omit<NewPumping, "id" | "createdAt">,
  options: { allowOverride?: boolean } = {}
) {
  const baby = await checkBabyAccess(data.babyId);

  // Check for conflicts - if endTime is provided, it's a completed pumping session
  await checkAndThrowConflicts(
    data.babyId,
    "pumping",
    data.startTime,
    data.endTime || undefined,
    { ...options, babyName: baby.name }
  );

  const [result] = await db.insert(pumpings).values(data).returning();
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function getActivePumping(babyId: string) {
  await checkBabyAccess(babyId);

  return await db.query.pumpings.findFirst({
    where: and(eq(pumpings.babyId, babyId), isNull(pumpings.endTime)),
    orderBy: [desc(pumpings.startTime)],
  });
}

export async function startOrUpdateActivePumping(
  data: {
    babyId: string;
    startTime: Date;
    duration: number; // seconds accumulated at this moment
    currentStatus: "running" | "paused";
    leftAmount?: number;
    rightAmount?: number;
    totalAmount?: number;
    amountUnit?: "oz" | "ml";
    amountMode?: "total" | "left_right";
    notes?: string;
  },
  options: { allowOverride?: boolean } = {}
) {
  const baby = await checkBabyAccess(data.babyId);

  const now = new Date();

  // Check if there's already an active pumping session
  const existing = await db.query.pumpings.findFirst({
    where: and(eq(pumpings.babyId, data.babyId), isNull(pumpings.endTime)),
  });

  // Only check for conflicts when starting a new session (not updating existing)
  if (!existing) {
    await checkAndThrowConflicts(
      data.babyId,
      "pumping",
      data.startTime,
      undefined,
      { ...options, babyName: baby.name }
    );
  }

  if (existing) {
    // Update existing session
    const [result] = await db
      .update(pumpings)
      .set({
        startTime: data.startTime,
        duration: data.duration,
        lastPersistedAt: now,
        currentStatus: data.currentStatus,
        leftAmount: data.leftAmount,
        rightAmount: data.rightAmount,
        totalAmount: data.totalAmount,
        amountUnit: data.amountUnit,
        notes: data.notes,
      })
      .where(eq(pumpings.id, existing.id))
      .returning();
    return result;
  } else {
    // Create new active session
    const [result] = await db
      .insert(pumpings)
      .values({
        babyId: data.babyId,
        startTime: data.startTime,
        endTime: null,
        duration: data.duration,
        lastPersistedAt: now,
        currentStatus: data.currentStatus,
        leftAmount: data.leftAmount,
        rightAmount: data.rightAmount,
        totalAmount: data.totalAmount,
        amountUnit: data.amountUnit,
        notes: data.notes,
      })
      .returning();
    return result;
  }
}

export async function cancelActivePumping(babyId: string) {
  await checkBabyAccess(babyId);

  // Find and delete the active pumping session
  const existing = await db.query.pumpings.findFirst({
    where: and(eq(pumpings.babyId, babyId), isNull(pumpings.endTime)),
  });

  if (existing) {
    await db.delete(pumpings).where(eq(pumpings.id, existing.id));
  }

  revalidatePath("/");
}

export async function completeActivePumping(
  babyId: string,
  data: {
    startTime: Date;
    endTime: Date;
    duration: number; // final duration in seconds
    leftAmount?: number;
    rightAmount?: number;
    totalAmount?: number;
    amountUnit?: "oz" | "ml";
    notes?: string;
  }
) {
  await checkBabyAccess(babyId);

  // Find the active pumping session
  const existing = await db.query.pumpings.findFirst({
    where: and(eq(pumpings.babyId, babyId), isNull(pumpings.endTime)),
  });

  if (existing) {
    // Complete the existing session - clear lastPersistedAt and currentStatus
    const [result] = await db
      .update(pumpings)
      .set({
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        lastPersistedAt: null,
        currentStatus: null,
        leftAmount: data.leftAmount,
        rightAmount: data.rightAmount,
        totalAmount: data.totalAmount,
        amountUnit: data.amountUnit,
        notes: data.notes,
      })
      .where(eq(pumpings.id, existing.id))
      .returning();

    revalidatePath("/");
    revalidatePath("/history");
    return result;
  } else {
    // No active session, create a completed one
    const [result] = await db
      .insert(pumpings)
      .values({
        babyId,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        lastPersistedAt: null,
        currentStatus: null,
        leftAmount: data.leftAmount,
        rightAmount: data.rightAmount,
        totalAmount: data.totalAmount,
        amountUnit: data.amountUnit,
        notes: data.notes,
      })
      .returning();

    revalidatePath("/");
    revalidatePath("/history");
    return result;
  }
}

export async function updatePumping(
  id: string,
  babyId: string,
  data: {
    startTime?: Date;
    endTime?: Date;
    leftAmount?: number;
    rightAmount?: number;
    totalAmount?: number;
    amountUnit?: string;
    notes?: string;
  }
) {
  await checkBabyAccess(babyId);
  await db.update(pumpings).set(data).where(eq(pumpings.id, id));
  revalidatePath("/");
  revalidatePath("/history");
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

export async function updateMedicine(
  id: string,
  babyId: string,
  data: {
    time?: Date;
    name?: string;
    amount?: number;
    unit?: "oz" | "ml" | "drops" | "tsp";
    notes?: string;
  }
) {
  await checkBabyAccess(babyId);
  await db.update(medicines).set(data).where(eq(medicines.id, id));
  revalidatePath("/");
  revalidatePath("/history");
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

export async function updateTemperature(
  id: string,
  babyId: string,
  data: {
    time?: Date;
    value?: number;
    unit?: string;
    notes?: string;
  }
) {
  await checkBabyAccess(babyId);
  await db.update(temperatures).set(data).where(eq(temperatures.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteTemperature(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(temperatures).where(eq(temperatures.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ ACTIVITY ============

export async function createActivity(
  data: {
    babyId: string;
    startTime: Date;
    endTime?: Date;
    type:
      | "bath"
      | "tummy_time"
      | "story_time"
      | "screen_time"
      | "skin_to_skin"
      | "play"
      | "outdoor"
      | "other";
    notes?: string;
  },
  options: { allowOverride?: boolean } = {}
) {
  const baby = await checkBabyAccess(data.babyId);

  // Check for conflicts
  await checkAndThrowConflicts(
    data.babyId,
    "activity",
    data.startTime,
    data.endTime,
    { ...options, babyName: baby.name }
  );

  const [result] = await db.insert(activities).values(data).returning();
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function updateActivity(
  id: string,
  babyId: string,
  data: {
    startTime?: Date;
    endTime?: Date;
    type?: "bath" | "tummy_time" | "story_time" | "screen_time" | "skin_to_skin" | "play" | "outdoor" | "other";
    notes?: string;
  }
) {
  await checkBabyAccess(babyId);
  await db.update(activities).set(data).where(eq(activities.id, id));
  revalidatePath("/");
  revalidatePath("/history");
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

export async function updateGrowthLog(
  id: string,
  babyId: string,
  data: {
    date?: string;
    time?: Date;
    weight?: number;
    weightUnit?: string;
    height?: number;
    heightUnit?: string;
    headCircumference?: number;
    headUnit?: string;
    notes?: string;
  }
) {
  await checkBabyAccess(babyId);
  await db.update(growthLogs).set(data).where(eq(growthLogs.id, id));
  revalidatePath("/");
  revalidatePath("/history");
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

export async function updateSolid(
  id: string,
  babyId: string,
  data: {
    time?: Date;
    foods?: string[];
    reaction?: "loved_it" | "meh" | "hated_it" | "allergy_or_sensitivity";
    notes?: string;
  }
) {
  await checkBabyAccess(babyId);
  await db.update(solids).set(data).where(eq(solids.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteSolid(id: string, babyId: string) {
  await checkBabyAccess(babyId);
  await db.delete(solids).where(eq(solids.id, id));
  revalidatePath("/");
  revalidatePath("/history");
}

// ============ HISTORY ============

// Get conflicts for a proposed activity
export async function getActivityConflicts(
  babyId: string,
  activityType: ActivityType,
  startTime?: Date,
  endTime?: Date,
  excludeEntryId?: string
) {
  const baby = await checkBabyAccess(babyId);
  return await checkActivityConflicts(
    babyId,
    activityType,
    startTime,
    endTime,
    baby.name,
    excludeEntryId
  );
}

export type TimeframeOption = '24h' | '1d' | '7d' | '30d' | { start: Date; end: Date };

export async function getTimelineEntries(babyId: string, timeframe: TimeframeOption = '7d') {
  await checkBabyAccess(babyId);

  let startDate: Date;
  let endDate: Date;

  if (typeof timeframe === 'object' && 'start' in timeframe) {
    // Custom date range
    startDate = new Date(timeframe.start);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(timeframe.end);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Predefined timeframes
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    switch (timeframe) {
      case '24h':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '1d':
        startDate = new Date(endDate);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        // Default to 7d
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
    }
  }

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
        gte(feedings.startTime, startDate),
        lte(feedings.startTime, endDate)
      ),
      orderBy: [desc(feedings.startTime)],
    }),
    db.query.sleepLogs.findMany({
      where: and(
        eq(sleepLogs.babyId, babyId),
        gte(sleepLogs.startTime, startDate),
        lte(sleepLogs.startTime, endDate)
      ),
      orderBy: [desc(sleepLogs.startTime)],
    }),
    db.query.diapers.findMany({
      where: and(
        eq(diapers.babyId, babyId),
        gte(diapers.time, startDate),
        lte(diapers.time, endDate)
      ),
      orderBy: [desc(diapers.time)],
    }),
    db.query.pottyLogs.findMany({
      where: and(
        eq(pottyLogs.babyId, babyId),
        gte(pottyLogs.time, startDate),
        lte(pottyLogs.time, endDate)
      ),
      orderBy: [desc(pottyLogs.time)],
    }),
    db.query.pumpings.findMany({
      where: and(
        eq(pumpings.babyId, babyId),
        gte(pumpings.startTime, startDate),
        lte(pumpings.startTime, endDate)
      ),
      orderBy: [desc(pumpings.startTime)],
    }),
    db.query.medicines.findMany({
      where: and(
        eq(medicines.babyId, babyId),
        gte(medicines.time, startDate),
        lte(medicines.time, endDate)
      ),
      orderBy: [desc(medicines.time)],
    }),
    db.query.temperatures.findMany({
      where: and(
        eq(temperatures.babyId, babyId),
        gte(temperatures.time, startDate),
        lte(temperatures.time, endDate)
      ),
      orderBy: [desc(temperatures.time)],
    }),
    db.query.activities.findMany({
      where: and(
        eq(activities.babyId, babyId),
        gte(activities.startTime, startDate),
        lte(activities.startTime, endDate)
      ),
      orderBy: [desc(activities.startTime)],
    }),
    db.query.growthLogs.findMany({
      where: and(
        eq(growthLogs.babyId, babyId),
        gte(growthLogs.date, startDate.toISOString().split("T")[0]),
        lte(growthLogs.date, endDate.toISOString().split("T")[0])
      ),
      orderBy: [desc(growthLogs.date)],
    }),
    db.query.solids.findMany({
      where: and(
        eq(solids.babyId, babyId),
        gte(solids.time, startDate),
        lte(solids.time, endDate)
      ),
      orderBy: [desc(solids.time)],
    }),
  ]);

  // Combine and sort all entries
  const allEntries = [
    ...feedingsData.map((f) => ({
      ...f,
      entryType: "feeding" as const,
      time: f.startTime,
    })),
    ...sleepData.map((s) => ({
      ...s,
      entryType: "sleep" as const,
      time: s.startTime,
    })),
    ...diapersData.map((d) => ({ ...d, entryType: "diaper" as const })),
    ...pottyData.map((p) => ({ ...p, entryType: "potty" as const })),
    ...pumpingsData.map((p) => ({
      ...p,
      entryType: "pumping" as const,
      time: p.startTime,
    })),
    ...medicinesData.map((m) => ({ ...m, entryType: "medicine" as const })),
    ...temperaturesData.map((t) => ({
      ...t,
      entryType: "temperature" as const,
    })),
    ...activitiesData.map((a) => ({
      ...a,
      entryType: "activity" as const,
      time: a.startTime,
    })),
    ...growthData.map((g) => ({
      ...g,
      entryType: "growth" as const,
      time: new Date(g.date),
    })),
    ...solidsData.map((s) => ({ ...s, entryType: "solids" as const })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return allEntries;
}
