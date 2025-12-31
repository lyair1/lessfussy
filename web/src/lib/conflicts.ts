"use server";

import { db } from "@/lib/db";
import { and, eq, isNull, gte, lte, or } from "drizzle-orm";
import { feedings, sleepLogs, pumpings, activities } from "@/lib/db/schema";
import { ActivityType, ActiveActivity, Conflict, ConflictCheckResult } from "@/lib/utils";

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
export async function getActiveActivities(babyId: string): Promise<ActiveActivity[]> {
  const activeActivities: ActiveActivity[] = [];

  // Check for active nursing (feeding with endTime null and type "nursing")
  const activeNursing = await db.query.feedings.findFirst({
    where: and(
      eq(feedings.babyId, babyId),
      eq(feedings.type, "nursing"),
      isNull(feedings.endTime)
    ),
    orderBy: [feedings.startTime],
  });

  if (activeNursing) {
    activeActivities.push({
      id: activeNursing.id,
      type: "feeding",
      startTime: activeNursing.startTime,
      description: "Nursing session in progress",
    });
  }

  // Check for active sleep
  const activeSleep = await db.query.sleepLogs.findFirst({
    where: and(eq(sleepLogs.babyId, babyId), isNull(sleepLogs.endTime)),
    orderBy: [sleepLogs.startTime],
  });

  if (activeSleep) {
    activeActivities.push({
      id: activeSleep.id,
      type: "sleep",
      startTime: activeSleep.startTime,
      description: "Sleep session in progress",
    });
  }

  // Check for active pumping
  const activePumping = await db.query.pumpings.findFirst({
    where: and(eq(pumpings.babyId, babyId), isNull(pumpings.endTime)),
    orderBy: [pumpings.startTime],
  });

  if (activePumping) {
    activeActivities.push({
      id: activePumping.id,
      type: "pumping",
      startTime: activePumping.startTime,
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
  babyName?: string
): Promise<ConflictCheckResult> {
  const conflicts: Conflict[] = [];
  const activeActivities = await getActiveActivities(babyId);

  // Check for active session conflicts
  // Skip this check for pumping since it's a wildcard activity that can happen anytime
  if (ACTIVITIES_WITH_ACTIVE_SESSIONS.has(newActivityType) && newActivityType !== "pumping") {
    const conflictingActives = activeActivities.filter(active =>
      active.type !== newActivityType && active.type !== "pumping" // Can't have two of the same type active, but pumping can run with anything
    );

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
    const logicalConflicts = activeActivities.filter(active => {
      const exclusiveWith = MUTUALLY_EXCLUSIVE[newActivityType as keyof typeof MUTUALLY_EXCLUSIVE] as readonly ActivityType[] | undefined;
      return exclusiveWith?.includes(active.type);
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
    const pastConflicts = await checkPastEventConflicts(babyId, newActivityType, startTime, endTime, babyName);
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
  babyName?: string
): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  // Only check conflicts for activities that can be ongoing
  if (!ACTIVITIES_WITH_ACTIVE_SESSIONS.has(newActivityType)) {
    return conflicts;
  }

  // Check for activities that were active during this time period
  const checkTime = endTime || startTime;

  // Get all activities that were active during this period
  const [
    activeFeedings,
    activeSleeps,
    activePumpings,
  ] = await Promise.all([
    // Find feeding sessions that overlap with the new activity time
    db.query.feedings.findMany({
      where: and(
        eq(feedings.babyId, babyId),
        eq(feedings.type, "nursing"),
        isNull(feedings.endTime), // Still active
        gte(feedings.startTime, startTime), // Started before or at the check time
      ),
    }),
    // Find sleep sessions that overlap
    db.query.sleepLogs.findMany({
      where: and(
        eq(sleepLogs.babyId, babyId),
        isNull(sleepLogs.endTime), // Still active
        gte(sleepLogs.startTime, startTime),
      ),
    }),
    // Find pumping sessions that overlap
    db.query.pumpings.findMany({
      where: and(
        eq(pumpings.babyId, babyId),
        isNull(pumpings.endTime), // Still active
        gte(pumpings.startTime, startTime),
      ),
    }),
  ]);

  const pastActiveActivities: ActiveActivity[] = [
    ...activeFeedings.map(f => ({
      id: f.id,
      type: "feeding" as ActivityType,
      startTime: f.startTime,
      description: `Nursing session active since ${f.startTime.toLocaleTimeString()}`,
    })),
    ...activeSleeps.map(s => ({
      id: s.id,
      type: "sleep" as ActivityType,
      startTime: s.startTime,
      description: `Sleep session active since ${s.startTime.toLocaleTimeString()}`,
    })),
    ...activePumpings.map(p => ({
      id: p.id,
      type: "pumping" as ActivityType,
      startTime: p.startTime,
      description: `Pumping session active since ${p.startTime.toLocaleTimeString()}`,
    })),
  ];

  // Check for logical conflicts with past active activities
  const logicalConflicts = pastActiveActivities.filter(active => {
    const exclusiveWith = MUTUALLY_EXCLUSIVE[newActivityType as keyof typeof MUTUALLY_EXCLUSIVE] as readonly ActivityType[] | undefined;
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
