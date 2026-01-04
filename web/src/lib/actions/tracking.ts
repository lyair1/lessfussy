"use server";

import { getBaby } from "./babies";
import { revalidatePath } from "next/cache";
import { checkActivityConflicts } from "@/lib/conflicts";
import { type ActivityType } from "@/lib/utils";
import { requireUserId } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  Activity,
  Feeding,
  GrowthLog,
  Medicine,
  NewFeeding,
  Pumping,
  Solid,
  SleepLog,
  Temperature,
  NewSleepLog,
  NewDiaper,
  Diaper,
  PottyLog,
  NewPumping,
} from "@/lib/types/db";

function mapFeedingRow(row: any): Feeding {
  return {
    id: row.id,
    babyId: row.babyId ?? row.baby_id,
    type: row.type,
    startTime: new Date(row.startTime ?? row.start_time),
    endTime:
      row.endTime ?? row.end_time
        ? new Date(row.endTime ?? row.end_time)
        : null,
    side: row.side ?? null,
    leftDuration: row.leftDuration ?? row.left_duration ?? null,
    rightDuration: row.rightDuration ?? row.right_duration ?? null,
    pausedDuration: row.pausedDuration ?? row.paused_duration ?? null,
    lastPersistedAt:
      row.lastPersistedAt ?? row.last_persisted_at
        ? new Date(row.lastPersistedAt ?? row.last_persisted_at)
        : null,
    currentStatus: row.currentStatus ?? row.current_status ?? null,
    bottleContent: row.bottleContent ?? row.bottle_content ?? null,
    amount: row.amount ?? null,
    amountUnit: row.amountUnit ?? row.amount_unit ?? null,
    notes: row.notes ?? null,
    createdAt: new Date(row.createdAt ?? row.created_at),
    updatedAt: new Date(row.updatedAt ?? row.updated_at),
  };
}

function mapSleepRow(row: any): SleepLog {
  return {
    id: row.id,
    babyId: row.babyId ?? row.baby_id,
    startTime: new Date(row.startTime ?? row.start_time),
    endTime:
      row.endTime ?? row.end_time
        ? new Date(row.endTime ?? row.end_time)
        : null,
    startMood: row.startMood ?? row.start_mood ?? null,
    endMood: row.endMood ?? row.end_mood ?? null,
    fallAsleepTime: row.fallAsleepTime ?? row.fall_asleep_time ?? null,
    sleepMethod: row.sleepMethod ?? row.sleep_method ?? null,
    wokeUpChild: row.wokeUpChild ?? row.woke_up_child ?? null,
    notes: row.notes ?? null,
    createdAt: new Date(row.createdAt ?? row.created_at),
    updatedAt: new Date(row.updatedAt ?? row.updated_at),
  };
}

const feedingSelect =
  "id,babyId:baby_id,type,startTime:start_time,endTime:end_time,side,leftDuration:left_duration,rightDuration:right_duration,pausedDuration:paused_duration,lastPersistedAt:last_persisted_at,currentStatus:current_status,bottleContent:bottle_content,amount,amountUnit:amount_unit,notes,createdAt:created_at,updatedAt:updated_at";

const sleepSelect =
  "id,babyId:baby_id,startTime:start_time,endTime:end_time,startMood:start_mood,endMood:end_mood,fallAsleepTime:fall_asleep_time,sleepMethod:sleep_method,wokeUpChild:woke_up_child,notes,createdAt:created_at,updatedAt:updated_at";

const diaperSelect = "id,babyId:baby_id,time,type,notes,createdAt:created_at";

const pottySelect = "id,babyId:baby_id,time,type,notes,createdAt:created_at";

const pumpingSelect =
  "id,babyId:baby_id,startTime:start_time,endTime:end_time,duration,lastPersistedAt:last_persisted_at,currentStatus:current_status,leftAmount:left_amount,rightAmount:right_amount,totalAmount:total_amount,amountUnit:amount_unit,notes,createdAt:created_at";

const medicineSelect =
  "id,babyId:baby_id,time,name,amount,unit,notes,createdAt:created_at";

const temperatureSelect =
  "id,babyId:baby_id,time,value,unit,notes,createdAt:created_at";

const activitySelect =
  "id,babyId:baby_id,startTime:start_time,endTime:end_time,type,notes,createdAt:created_at";

const growthSelect =
  "id,babyId:baby_id,date,time,weight,weightUnit:weight_unit,height,heightUnit:height_unit,headCircumference:head_circumference,headUnit:head_unit,notes,createdAt:created_at";

const solidsSelect =
  "id,babyId:baby_id,time,foods,reaction,photoUrl:photo_url,notes,createdAt:created_at";

// Helper to check baby access
async function checkBabyAccess(babyId: string) {
  await requireUserId();

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
  options: {
    allowOverride?: boolean;
    babyName?: string;
    excludeEntryId?: string;
  } = {}
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

  const supabase = await createClient();

  const insertData: Record<string, unknown> = {
    baby_id: (data as any).babyId,
    type: (data as any).type,
    start_time: (data as any).startTime,
    end_time: (data as any).endTime ?? null,
    side: (data as any).side ?? null,
    left_duration: (data as any).leftDuration ?? null,
    right_duration: (data as any).rightDuration ?? null,
    paused_duration: (data as any).pausedDuration ?? null,
    last_persisted_at: (data as any).lastPersistedAt ?? null,
    current_status: (data as any).currentStatus ?? null,
    bottle_content: (data as any).bottleContent ?? null,
    amount: (data as any).amount ?? null,
    amount_unit: (data as any).amountUnit ?? null,
    notes: (data as any).notes ?? null,
  };

  const { data: result, error } = await supabase
    .from("feedings")
    .insert(insertData)
    .select(feedingSelect)
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/history");
  return mapFeedingRow(result);
}

export async function getLastFeeding(babyId: string): Promise<Feeding | null> {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedings")
    .select(feedingSelect)
    .eq("baby_id", babyId)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapFeedingRow(data) : null;
}

export async function getLastTrackingForAllTypes(babyId: string): Promise<{
  feeding: Feeding | undefined;
  sleep: SleepLog | undefined;
  diaper: Diaper | undefined;
  pumping: Pumping | undefined;
  medicine: Medicine | undefined;
  temperature: Temperature | undefined;
  activity: Activity | undefined;
  growth: GrowthLog | undefined;
  potty: PottyLog | undefined;
  solids: Solid | undefined;
}> {
  await checkBabyAccess(babyId);

  const supabase = await createClient();

  const [lastFeeding, lastSleep] = await Promise.all([
    supabase
      .from("feedings")
      .select(feedingSelect)
      .eq("baby_id", babyId)
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sleep_logs")
      .select(sleepSelect)
      .eq("baby_id", babyId)
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (lastFeeding.error) throw new Error(lastFeeding.error.message);
  if (lastSleep.error) throw new Error(lastSleep.error.message);

  return {
    feeding: lastFeeding.data ? mapFeedingRow(lastFeeding.data) : undefined,
    sleep: lastSleep.data ? mapSleepRow(lastSleep.data) : undefined,
    diaper: undefined,
    pumping: undefined,
    medicine: undefined,
    temperature: undefined,
    activity: undefined,
    growth: undefined,
    potty: undefined,
    solids: undefined,
  };
}

export async function getActiveNursing(
  babyId: string
): Promise<Feeding | null> {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedings")
    .select(feedingSelect)
    .eq("baby_id", babyId)
    .eq("type", "nursing")
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapFeedingRow(data) : null;
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
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("feedings")
    .select(feedingSelect)
    .eq("baby_id", data.babyId)
    .eq("type", "nursing")
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

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
    const { data: result, error } = await supabase
      .from("feedings")
      .update({
        start_time: data.startTime,
        side,
        left_duration: data.leftDuration,
        right_duration: data.rightDuration,
        paused_duration: data.pausedDuration,
        last_persisted_at: now,
        current_status: data.currentStatus,
        notes: data.notes ?? null,
        updated_at: now.toISOString(),
      })
      .eq("id", (existing as any).id)
      .select(feedingSelect)
      .single();

    if (error) throw new Error(error.message);
    return result;
  } else {
    // Create new active session
    const { data: result, error } = await supabase
      .from("feedings")
      .insert({
        baby_id: data.babyId,
        type: "nursing",
        start_time: data.startTime,
        end_time: null,
        side,
        left_duration: data.leftDuration,
        right_duration: data.rightDuration,
        paused_duration: data.pausedDuration,
        last_persisted_at: now,
        current_status: data.currentStatus,
        notes: data.notes ?? null,
      })
      .select(feedingSelect)
      .single();

    if (error) throw new Error(error.message);
    return result;
  }
}

export async function cancelActiveNursing(babyId: string) {
  await checkBabyAccess(babyId);

  // Find and delete the active nursing session
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("feedings")
    .select("id")
    .eq("baby_id", babyId)
    .eq("type", "nursing")
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing) {
    const { error } = await supabase
      .from("feedings")
      .delete()
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
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
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("feedings")
    .select("id")
    .eq("baby_id", babyId)
    .eq("type", "nursing")
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing) {
    // Complete the existing session - clear lastPersistedAt and currentStatus
    const { data: result, error } = await supabase
      .from("feedings")
      .update({
        start_time: data.startTime,
        end_time: data.endTime,
        side,
        left_duration: data.leftDuration,
        right_duration: data.rightDuration,
        paused_duration: data.pausedDuration,
        last_persisted_at: null,
        current_status: null,
        notes: data.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select(feedingSelect)
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/");
    revalidatePath("/history");
    return result;
  } else {
    // No active session, create a completed one
    const { data: result, error } = await supabase
      .from("feedings")
      .insert({
        baby_id: babyId,
        type: "nursing",
        start_time: data.startTime,
        end_time: data.endTime,
        side,
        left_duration: data.leftDuration,
        right_duration: data.rightDuration,
        paused_duration: data.pausedDuration,
        last_persisted_at: null,
        current_status: null,
        notes: data.notes ?? null,
      })
      .select(feedingSelect)
      .single();

    if (error) throw new Error(error.message);

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

  const supabase = await createClient();
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if ((data as any).startTime !== undefined)
    updateData.start_time = (data as any).startTime;
  if ((data as any).endTime !== undefined)
    updateData.end_time = (data as any).endTime;
  if ((data as any).type !== undefined) updateData.type = (data as any).type;
  if ((data as any).side !== undefined) updateData.side = (data as any).side;
  if ((data as any).leftDuration !== undefined)
    updateData.left_duration = (data as any).leftDuration;
  if ((data as any).rightDuration !== undefined)
    updateData.right_duration = (data as any).rightDuration;
  if ((data as any).pausedDuration !== undefined)
    updateData.paused_duration = (data as any).pausedDuration;
  if ((data as any).lastPersistedAt !== undefined)
    updateData.last_persisted_at = (data as any).lastPersistedAt;
  if ((data as any).currentStatus !== undefined)
    updateData.current_status = (data as any).currentStatus;
  if ((data as any).bottleContent !== undefined)
    updateData.bottle_content = (data as any).bottleContent;
  if ((data as any).amount !== undefined)
    updateData.amount = (data as any).amount;
  if ((data as any).amountUnit !== undefined)
    updateData.amount_unit = (data as any).amountUnit;
  if ((data as any).notes !== undefined) updateData.notes = (data as any).notes;

  const { data: result, error } = await supabase
    .from("feedings")
    .update(updateData)
    .eq("id", id)
    .select(feedingSelect)
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function deleteFeeding(id: string, babyId: string) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { error } = await supabase.from("feedings").delete().eq("id", id);
  if (error) throw new Error(error.message);

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

  const supabase = await createClient();

  const insertData: Record<string, unknown> = {
    baby_id: (data as any).babyId,
    start_time: (data as any).startTime,
    end_time: (data as any).endTime ?? null,
    start_mood: (data as any).startMood ?? null,
    end_mood: (data as any).endMood ?? null,
    fall_asleep_time: (data as any).fallAsleepTime ?? null,
    sleep_method: (data as any).sleepMethod ?? null,
    woke_up_child: (data as any).wokeUpChild ?? null,
    notes: (data as any).notes ?? null,
  };

  const { data: result, error } = await supabase
    .from("sleep_logs")
    .insert(insertData)
    .select(sleepSelect)
    .single();

  if (error) throw new Error(error.message);
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

  const supabase = await createClient();
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if ((data as any).startTime !== undefined)
    updateData.start_time = (data as any).startTime;
  if ((data as any).endTime !== undefined)
    updateData.end_time = (data as any).endTime;
  if ((data as any).startMood !== undefined)
    updateData.start_mood = (data as any).startMood;
  if ((data as any).endMood !== undefined)
    updateData.end_mood = (data as any).endMood;
  if ((data as any).fallAsleepTime !== undefined)
    updateData.fall_asleep_time = (data as any).fallAsleepTime;
  if ((data as any).sleepMethod !== undefined)
    updateData.sleep_method = (data as any).sleepMethod;
  if ((data as any).wokeUpChild !== undefined)
    updateData.woke_up_child = (data as any).wokeUpChild;
  if ((data as any).notes !== undefined) updateData.notes = (data as any).notes;

  const { data: result, error } = await supabase
    .from("sleep_logs")
    .update(updateData)
    .eq("id", id)
    .select(sleepSelect)
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function getActiveSleep(babyId: string) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sleep_logs")
    .select(sleepSelect)
    .eq("baby_id", babyId)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSleepLog(id: string, babyId: string) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { error } = await supabase.from("sleep_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/history");
}

// ============ DIAPER ============

export async function createDiaper(data: Omit<NewDiaper, "id" | "createdAt">) {
  await checkBabyAccess(data.babyId);

  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("diapers")
    .insert({
      baby_id: (data as any).babyId,
      time: (data as any).time,
      type: (data as any).type,
      notes: (data as any).notes ?? null,
    })
    .select(diaperSelect)
    .single();

  if (error) throw new Error(error.message);
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

  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (data.time !== undefined) updateData.time = data.time;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { error } = await supabase
    .from("diapers")
    .update(updateData)
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteDiaper(id: string, babyId: string) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { error } = await supabase.from("diapers").delete().eq("id", id);
  if (error) throw new Error(error.message);

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

  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("potty_logs")
    .insert({
      baby_id: data.babyId,
      time: data.time,
      type: data.type,
      notes: data.notes ?? null,
    })
    .select(pottySelect)
    .single();

  if (error) throw new Error(error.message);
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

  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (data.time !== undefined) updateData.time = data.time;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { error } = await supabase
    .from("potty_logs")
    .update(updateData)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/history");
}

export async function deletePottyLog(id: string, babyId: string) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { error } = await supabase.from("potty_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);

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

  const supabase = await createClient();

  const insertData: Record<string, unknown> = {
    baby_id: (data as any).babyId,
    start_time: (data as any).startTime,
    end_time: (data as any).endTime ?? null,
    duration: (data as any).duration ?? null,
    last_persisted_at: (data as any).lastPersistedAt ?? null,
    current_status: (data as any).currentStatus ?? null,
    left_amount: (data as any).leftAmount ?? null,
    right_amount: (data as any).rightAmount ?? null,
    total_amount: (data as any).totalAmount ?? null,
    amount_unit: (data as any).amountUnit ?? null,
    notes: (data as any).notes ?? null,
  };

  const { data: result, error } = await supabase
    .from("pumpings")
    .insert(insertData)
    .select(pumpingSelect)
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/history");
  return result;
}

export async function getActivePumping(babyId: string) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pumpings")
    .select(pumpingSelect)
    .eq("baby_id", babyId)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
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
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("pumpings")
    .select(pumpingSelect)
    .eq("baby_id", data.babyId)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

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
    const { data: result, error } = await supabase
      .from("pumpings")
      .update({
        start_time: data.startTime,
        duration: data.duration,
        last_persisted_at: now,
        current_status: data.currentStatus,
        left_amount: data.leftAmount ?? null,
        right_amount: data.rightAmount ?? null,
        total_amount: data.totalAmount ?? null,
        amount_unit: data.amountUnit ?? null,
        notes: data.notes ?? null,
      })
      .eq("id", (existing as any).id)
      .select(pumpingSelect)
      .single();

    if (error) throw new Error(error.message);
    return result;
  } else {
    // Create new active session
    const { data: result, error } = await supabase
      .from("pumpings")
      .insert({
        baby_id: data.babyId,
        start_time: data.startTime,
        end_time: null,
        duration: data.duration,
        last_persisted_at: now,
        current_status: data.currentStatus,
        left_amount: data.leftAmount ?? null,
        right_amount: data.rightAmount ?? null,
        total_amount: data.totalAmount ?? null,
        amount_unit: data.amountUnit ?? null,
        notes: data.notes ?? null,
      })
      .select(pumpingSelect)
      .single();

    if (error) throw new Error(error.message);
    return result;
  }
}

export async function cancelActivePumping(babyId: string) {
  await checkBabyAccess(babyId);

  // Find and delete the active pumping session
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("pumpings")
    .select("id")
    .eq("baby_id", babyId)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing) {
    const { error } = await supabase
      .from("pumpings")
      .delete()
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
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
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("pumpings")
    .select("id")
    .eq("baby_id", babyId)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing) {
    // Complete the existing session - clear lastPersistedAt and currentStatus
    const { data: result, error } = await supabase
      .from("pumpings")
      .update({
        start_time: data.startTime,
        end_time: data.endTime,
        duration: data.duration,
        last_persisted_at: null,
        current_status: null,
        left_amount: data.leftAmount ?? null,
        right_amount: data.rightAmount ?? null,
        total_amount: data.totalAmount ?? null,
        amount_unit: data.amountUnit ?? null,
        notes: data.notes ?? null,
      })
      .eq("id", existing.id)
      .select(pumpingSelect)
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/");
    revalidatePath("/history");
    return result;
  } else {
    // No active session, create a completed one
    const { data: result, error } = await supabase
      .from("pumpings")
      .insert({
        baby_id: babyId,
        start_time: data.startTime,
        end_time: data.endTime,
        duration: data.duration,
        last_persisted_at: null,
        current_status: null,
        left_amount: data.leftAmount ?? null,
        right_amount: data.rightAmount ?? null,
        total_amount: data.totalAmount ?? null,
        amount_unit: data.amountUnit ?? null,
        notes: data.notes ?? null,
      })
      .select(pumpingSelect)
      .single();

    if (error) throw new Error(error.message);

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

  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (data.startTime !== undefined) updateData.start_time = data.startTime;
  if (data.endTime !== undefined) updateData.end_time = data.endTime;
  if (data.leftAmount !== undefined) updateData.left_amount = data.leftAmount;
  if (data.rightAmount !== undefined)
    updateData.right_amount = data.rightAmount;
  if (data.totalAmount !== undefined)
    updateData.total_amount = data.totalAmount;
  if (data.amountUnit !== undefined) updateData.amount_unit = data.amountUnit;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { error } = await supabase
    .from("pumpings")
    .update(updateData)
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/history");
}

export async function deletePumping(id: string, babyId: string) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { error } = await supabase.from("pumpings").delete().eq("id", id);
  if (error) throw new Error(error.message);

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

  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("medicines")
    .insert({
      baby_id: data.babyId,
      time: data.time,
      name: data.name ?? null,
      amount: data.amount ?? null,
      unit: data.unit ?? null,
      notes: data.notes ?? null,
    })
    .select(medicineSelect)
    .single();

  if (error) throw new Error(error.message);
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

  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (data.time !== undefined) updateData.time = data.time;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { error } = await supabase
    .from("medicines")
    .update(updateData)
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteMedicine(id: string, babyId: string) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { error } = await supabase.from("medicines").delete().eq("id", id);
  if (error) throw new Error(error.message);

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

  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("temperatures")
    .insert({
      baby_id: data.babyId,
      time: data.time,
      value: data.value,
      unit: data.unit,
      notes: data.notes ?? null,
    })
    .select(temperatureSelect)
    .single();

  if (error) throw new Error(error.message);
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

  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (data.time !== undefined) updateData.time = data.time;
  if (data.value !== undefined) updateData.value = data.value;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { error } = await supabase
    .from("temperatures")
    .update(updateData)
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteTemperature(id: string, babyId: string) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { error } = await supabase.from("temperatures").delete().eq("id", id);
  if (error) throw new Error(error.message);

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

  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("activities")
    .insert({
      baby_id: data.babyId,
      start_time: data.startTime,
      end_time: data.endTime ?? null,
      type: data.type,
      notes: data.notes ?? null,
    })
    .select(activitySelect)
    .single();

  if (error) throw new Error(error.message);
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
    type?:
      | "bath"
      | "tummy_time"
      | "story_time"
      | "screen_time"
      | "skin_to_skin"
      | "play"
      | "outdoor"
      | "other";
    notes?: string;
  }
) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (data.startTime !== undefined) updateData.start_time = data.startTime;
  if (data.endTime !== undefined) updateData.end_time = data.endTime;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { error } = await supabase
    .from("activities")
    .update(updateData)
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteActivity(id: string, babyId: string) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) throw new Error(error.message);

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

  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("growth_logs")
    .insert({
      baby_id: data.babyId,
      date: data.date,
      time: data.time ?? null,
      weight: data.weight ?? null,
      weight_unit: data.weightUnit ?? null,
      height: data.height ?? null,
      height_unit: data.heightUnit ?? null,
      head_circumference: data.headCircumference ?? null,
      head_unit: data.headUnit ?? null,
      notes: data.notes ?? null,
    })
    .select(growthSelect)
    .single();

  if (error) throw new Error(error.message);
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

  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (data.date !== undefined) updateData.date = data.date;
  if (data.time !== undefined) updateData.time = data.time;
  if (data.weight !== undefined) updateData.weight = data.weight;
  if (data.weightUnit !== undefined) updateData.weight_unit = data.weightUnit;
  if (data.height !== undefined) updateData.height = data.height;
  if (data.heightUnit !== undefined) updateData.height_unit = data.heightUnit;
  if (data.headCircumference !== undefined)
    updateData.head_circumference = data.headCircumference;
  if (data.headUnit !== undefined) updateData.head_unit = data.headUnit;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { error } = await supabase
    .from("growth_logs")
    .update(updateData)
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteGrowthLog(id: string, babyId: string) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { error } = await supabase.from("growth_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);

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

  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("solids")
    .insert({
      baby_id: data.babyId,
      time: data.time,
      foods: data.foods ?? null,
      reaction: data.reaction ?? null,
      photo_url: data.photoUrl ?? null,
      notes: data.notes ?? null,
    })
    .select(solidsSelect)
    .single();

  if (error) throw new Error(error.message);
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

  const supabase = await createClient();
  const updateData: Record<string, unknown> = {};
  if (data.time !== undefined) updateData.time = data.time;
  if (data.foods !== undefined) updateData.foods = data.foods;
  if (data.reaction !== undefined) updateData.reaction = data.reaction;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const { error } = await supabase
    .from("solids")
    .update(updateData)
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/history");
}

export async function deleteSolid(id: string, babyId: string) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();
  const { error } = await supabase.from("solids").delete().eq("id", id);
  if (error) throw new Error(error.message);

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

export type TimeframeOption =
  | "24h"
  | "1d"
  | "7d"
  | "30d"
  | { start: Date; end: Date };

export async function getTimelineEntries(
  babyId: string,
  timeframe: TimeframeOption = "7d"
) {
  await checkBabyAccess(babyId);

  const supabase = await createClient();

  let startDate: Date;
  let endDate: Date;

  if (typeof timeframe === "object" && "start" in timeframe) {
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
      case "24h":
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "1d":
        startDate = new Date(endDate);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "7d":
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "30d":
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        // Default to 7d
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
    }
  }

  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();
  const startDateOnly = startDateStr.split("T")[0];
  const endDateOnly = endDateStr.split("T")[0];

  const [
    feedingsRes,
    sleepRes,
    diapersRes,
    pottyRes,
    pumpingsRes,
    medicinesRes,
    temperaturesRes,
    activitiesRes,
    growthRes,
    solidsRes,
  ] = await Promise.all([
    supabase
      .from("feedings")
      .select(feedingSelect)
      .eq("baby_id", babyId)
      .gte("start_time", startDateStr)
      .lte("start_time", endDateStr)
      .order("start_time", { ascending: false }),
    supabase
      .from("sleep_logs")
      .select(sleepSelect)
      .eq("baby_id", babyId)
      .gte("start_time", startDateStr)
      .lte("start_time", endDateStr)
      .order("start_time", { ascending: false }),
    supabase
      .from("diapers")
      .select(diaperSelect)
      .eq("baby_id", babyId)
      .gte("time", startDateStr)
      .lte("time", endDateStr)
      .order("time", { ascending: false }),
    supabase
      .from("potty_logs")
      .select(pottySelect)
      .eq("baby_id", babyId)
      .gte("time", startDateStr)
      .lte("time", endDateStr)
      .order("time", { ascending: false }),
    supabase
      .from("pumpings")
      .select(pumpingSelect)
      .eq("baby_id", babyId)
      .gte("start_time", startDateStr)
      .lte("start_time", endDateStr)
      .order("start_time", { ascending: false }),
    supabase
      .from("medicines")
      .select(medicineSelect)
      .eq("baby_id", babyId)
      .gte("time", startDateStr)
      .lte("time", endDateStr)
      .order("time", { ascending: false }),
    supabase
      .from("temperatures")
      .select(temperatureSelect)
      .eq("baby_id", babyId)
      .gte("time", startDateStr)
      .lte("time", endDateStr)
      .order("time", { ascending: false }),
    supabase
      .from("activities")
      .select(activitySelect)
      .eq("baby_id", babyId)
      .gte("start_time", startDateStr)
      .lte("start_time", endDateStr)
      .order("start_time", { ascending: false }),
    supabase
      .from("growth_logs")
      .select(growthSelect)
      .eq("baby_id", babyId)
      .gte("date", startDateOnly)
      .lte("date", endDateOnly)
      .order("date", { ascending: false }),
    supabase
      .from("solids")
      .select(solidsSelect)
      .eq("baby_id", babyId)
      .gte("time", startDateStr)
      .lte("time", endDateStr)
      .order("time", { ascending: false }),
  ]);

  if (feedingsRes.error) throw new Error(feedingsRes.error.message);
  if (sleepRes.error) throw new Error(sleepRes.error.message);
  if (diapersRes.error) throw new Error(diapersRes.error.message);
  if (pottyRes.error) throw new Error(pottyRes.error.message);
  if (pumpingsRes.error) throw new Error(pumpingsRes.error.message);
  if (medicinesRes.error) throw new Error(medicinesRes.error.message);
  if (temperaturesRes.error) throw new Error(temperaturesRes.error.message);
  if (activitiesRes.error) throw new Error(activitiesRes.error.message);
  if (growthRes.error) throw new Error(growthRes.error.message);
  if (solidsRes.error) throw new Error(solidsRes.error.message);

  const feedingsData = feedingsRes.data ?? [];
  const sleepData = sleepRes.data ?? [];
  const diapersData = diapersRes.data ?? [];
  const pottyData = pottyRes.data ?? [];
  const pumpingsData = pumpingsRes.data ?? [];
  const medicinesData = medicinesRes.data ?? [];
  const temperaturesData = temperaturesRes.data ?? [];
  const activitiesData = activitiesRes.data ?? [];
  const growthData = growthRes.data ?? [];
  const solidsData = solidsRes.data ?? [];

  // Combine and sort all entries
  const allEntries = [
    ...feedingsData.map((f) => ({
      ...f,
      entryType: "feeding" as const,
      startTime: (f as any).startTime ?? (f as any).start_time,
      endTime: (f as any).endTime ?? (f as any).end_time ?? null,
      time: (f as any).startTime ?? (f as any).start_time,
    })),
    ...sleepData.map((s) => ({
      ...s,
      entryType: "sleep" as const,
      startTime: (s as any).startTime ?? (s as any).start_time,
      endTime: (s as any).endTime ?? (s as any).end_time ?? null,
      time: (s as any).startTime ?? (s as any).start_time,
    })),
    ...diapersData.map((d) => ({ ...d, entryType: "diaper" as const })),
    ...pottyData.map((p) => ({ ...p, entryType: "potty" as const })),
    ...pumpingsData.map((p) => ({
      ...p,
      entryType: "pumping" as const,
      startTime: (p as any).startTime ?? (p as any).start_time,
      endTime: (p as any).endTime ?? (p as any).end_time ?? null,
      time: (p as any).startTime ?? (p as any).start_time,
    })),
    ...medicinesData.map((m) => ({ ...m, entryType: "medicine" as const })),
    ...temperaturesData.map((t) => ({
      ...t,
      entryType: "temperature" as const,
    })),
    ...activitiesData.map((a) => ({
      ...a,
      entryType: "activity" as const,
      startTime: (a as any).startTime ?? (a as any).start_time,
      endTime: (a as any).endTime ?? (a as any).end_time ?? null,
      time: (a as any).startTime ?? (a as any).start_time,
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
