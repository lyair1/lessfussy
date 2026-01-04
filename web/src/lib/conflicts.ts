"use server";

import {
  ActivityType,
  ActiveActivity,
  Conflict,
  ConflictCheckResult,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

// Define which activities are mutually exclusive (can't happen simultaneously)
// Only core ongoing activities create conflicts - everything else can happen anytime
const MUTUALLY_EXCLUSIVE = {
  // Can't sleep while doing these core activities
  sleep: ["feeding", "activity"],
  // Can't feed while doing these core activities
  feeding: ["sleep", "activity"],
  // Can't do activities while sleeping
  activity: ["sleep"],
  // Pumping can happen anytime (wildcard activity)
  pumping: [],
} as const;

// Define which activities can have active sessions
const ACTIVITIES_WITH_ACTIVE_SESSIONS = new Set<ActivityType>([
  "feeding", // nursing only
  "sleep",
  "pumping",
]);

/**
 * Get all currently active activities for a baby
 */
export async function getActiveActivities(
  babyId: string
): Promise<ActiveActivity[]> {
  const activeActivities: ActiveActivity[] = [];
  const supabase = await createClient();

  // Check for active nursing (feeding with endTime null and type "nursing")
  const { data: activeNursing, error: nursingError } = await supabase
    .from("feedings")
    .select("id,start_time")
    .eq("baby_id", babyId)
    .eq("type", "nursing")
    .is("end_time", null)
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nursingError) throw new Error(nursingError.message);

  if (activeNursing) {
    activeActivities.push({
      id: (activeNursing as any).id,
      type: "feeding",
      startTime: new Date((activeNursing as any).start_time),
      description: "Nursing session in progress",
    });
  }

  // Check for active sleep
  const { data: activeSleep, error: sleepError } = await supabase
    .from("sleep_logs")
    .select("id,start_time")
    .eq("baby_id", babyId)
    .is("end_time", null)
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (sleepError) throw new Error(sleepError.message);

  if (activeSleep) {
    activeActivities.push({
      id: (activeSleep as any).id,
      type: "sleep",
      startTime: new Date((activeSleep as any).start_time),
      description: "Sleep session in progress",
    });
  }

  // Check for active pumping
  const { data: activePumping, error: pumpingError } = await supabase
    .from("pumpings")
    .select("id,start_time")
    .eq("baby_id", babyId)
    .is("end_time", null)
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (pumpingError) throw new Error(pumpingError.message);

  if (activePumping) {
    activeActivities.push({
      id: (activePumping as any).id,
      type: "pumping",
      startTime: new Date((activePumping as any).start_time),
      description: "Pumping session in progress",
    });
  }

  return activeActivities;
}

/**
 * Check if starting a new activity would conflict with active activities
 */
export async function checkActivityConflicts(
  babyId: string,
  newActivityType: ActivityType,
  startTime?: Date,
  endTime?: Date,
  babyName?: string,
  excludeEntryId?: string
): Promise<ConflictCheckResult> {
  const conflicts: Conflict[] = [];

  const supabase = await createClient();
  let activeActivities = await getActiveActivities(babyId);

  // Exclude the current entry if we're editing
  if (excludeEntryId) {
    activeActivities = activeActivities.filter(
      (active) => active.id !== excludeEntryId
    );
  }

  // Check for active session conflicts
  // Skip this check if:
  // - We're editing (excludeEntryId is provided) AND the session has an endTime (it's completed)
  // - The activity is pumping (wildcard activity that can happen anytime)
  const isEditingCompletedSession = excludeEntryId && endTime;
  if (
    !isEditingCompletedSession &&
    ACTIVITIES_WITH_ACTIVE_SESSIONS.has(newActivityType) &&
    newActivityType !== "pumping"
  ) {
    // Only flag as conflict if there's actual time overlap
    const conflictingActives = activeActivities.filter((active) => {
      // Skip same type and pumping
      if (active.type === newActivityType || active.type === "pumping") {
        return false;
      }

      // If we have a time range, check for actual overlap
      if (startTime && endTime) {
        // Active session started before our end time - potential overlap
        return active.startTime < endTime;
      }

      // If we only have start time, check if active session overlaps
      if (startTime) {
        // For active sessions (no end time), check if they started before our start time
        // This means they could still be active when we want to start
        return active.startTime <= startTime;
      }

      // Default: consider it a conflict
      return true;
    });

    if (conflictingActives.length > 0) {
      conflicts.push({
        type: "active_conflict",
        message: `You are trying to start a ${newActivityType} session while there is an ongoing ${conflictingActives[0].type} session.`,
        conflictingActivities: conflictingActives,
        canOverride: false, // Can't override active sessions
      });
    }
  }

  // Check for logical conflicts with active activities
  // Skip if we already have active conflicts (prioritize active conflicts)
  if (conflicts.length === 0) {
    const logicalConflicts = activeActivities.filter((active) => {
      const exclusiveWith = MUTUALLY_EXCLUSIVE[
        newActivityType as keyof typeof MUTUALLY_EXCLUSIVE
      ] as readonly ActivityType[] | undefined;
      if (!exclusiveWith?.includes(active.type)) {
        return false;
      }

      // If we have time information, check for actual overlap
      if (startTime && endTime) {
        // Only flag as conflict if the active session started before our end time
        return active.startTime < endTime;
      }

      // If no end time, both are active, so they conflict
      return true;
    });

    if (logicalConflicts.length > 0) {
      conflicts.push({
        type: "logical_conflict",
        message: `This would conflict with your active ${logicalConflicts[0].type} session. Are you sure you want to proceed?`,
        conflictingActivities: logicalConflicts,
        canOverride: true, // User can choose to override logical conflicts
      });
    }
  }

  // For past events, check if they would conflict with activities that were active at that time
  if (startTime && startTime < new Date()) {
    const pastConflicts = await checkPastEventConflicts(
      babyId,
      newActivityType,
      startTime,
      endTime,
      babyName,
      excludeEntryId
    );
    conflicts.push(...pastConflicts);
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Check conflicts for past events (events being added retroactively)
 */
async function checkPastEventConflicts(
  babyId: string,
  newActivityType: ActivityType,
  startTime: Date,
  endTime?: Date,
  babyName?: string,
  excludeEntryId?: string
): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  const supabase = await createClient();

  // Only check conflicts for activities that can be ongoing
  if (!ACTIVITIES_WITH_ACTIVE_SESSIONS.has(newActivityType)) {
    return conflicts;
  }

  // Check for activities that were active during this time period
  const checkTime = endTime || startTime;

  // Get all activities that are currently active (no endTime)
  // We'll filter for time overlap after
  const [activeFeedings, activeSleeps, activePumpings] = await Promise.all([
    // Find all active feeding sessions
    supabase
      .from("feedings")
      .select("id,start_time")
      .eq("baby_id", babyId)
      .eq("type", "nursing")
      .is("end_time", null),
    // Find all active sleep sessions
    supabase
      .from("sleep_logs")
      .select("id,start_time")
      .eq("baby_id", babyId)
      .is("end_time", null),
    // Find all active pumping sessions
    supabase
      .from("pumpings")
      .select("id,start_time")
      .eq("baby_id", babyId)
      .is("end_time", null),
  ]);

  if (activeFeedings.error) throw new Error(activeFeedings.error.message);
  if (activeSleeps.error) throw new Error(activeSleeps.error.message);
  if (activePumpings.error) throw new Error(activePumpings.error.message);

  let pastActiveActivities: ActiveActivity[] = [
    ...(activeFeedings.data ?? []).map((f: unknown) => ({
      id: (f as any).id,
      type: "feeding" as ActivityType,
      startTime: new Date((f as any).start_time),
      description: `Nursing session active since ${new Date(
        (f as any).start_time
      ).toLocaleTimeString()}`,
    })),
    ...(activeSleeps.data ?? []).map((s: unknown) => ({
      id: (s as any).id,
      type: "sleep" as ActivityType,
      startTime: new Date((s as any).start_time),
      description: `Sleep session active since ${new Date(
        (s as any).start_time
      ).toLocaleTimeString()}`,
    })),
    ...(activePumpings.data ?? []).map((p: unknown) => ({
      id: (p as any).id,
      type: "pumping" as ActivityType,
      startTime: new Date((p as any).start_time),
      description: `Pumping session active since ${new Date(
        (p as any).start_time
      ).toLocaleTimeString()}`,
    })),
  ];

  // Exclude the current entry if we're editing
  if (excludeEntryId) {
    pastActiveActivities = pastActiveActivities.filter(
      (active) => active.id !== excludeEntryId
    );
  }

  // Filter to only activities that actually overlap in time
  if (endTime) {
    // If we have an end time, check if the active session started before our end time
    // This means: active session is still ongoing AND it started before our activity ended
    pastActiveActivities = pastActiveActivities.filter(
      (active) => active.startTime < endTime
    );
  } else {
    // If we don't have an end time (still active), check if the active session started before now
    // Since both sessions are active, they would overlap
    const now = new Date();
    pastActiveActivities = pastActiveActivities.filter(
      (active) => active.startTime < now
    );
  }

  // Check for logical conflicts with past active activities
  const logicalConflicts = pastActiveActivities.filter((active) => {
    const exclusiveWith = MUTUALLY_EXCLUSIVE[
      newActivityType as keyof typeof MUTUALLY_EXCLUSIVE
    ] as readonly ActivityType[] | undefined;
    return exclusiveWith?.includes(active.type);
  });

  if (logicalConflicts.length > 0) {
    const babyNameText = babyName ? `${babyName} was ` : "";
    conflicts.push({
      type: "logical_conflict",
      message: `${babyNameText}${logicalConflicts[0].type} at the time of this activity, are you sure you want to log it?`,
      conflictingActivities: logicalConflicts,
      canOverride: true, // User can choose to override for past events
    });
  }

  return conflicts;
}
