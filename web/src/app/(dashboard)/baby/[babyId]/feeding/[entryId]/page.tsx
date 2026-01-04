"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Play, Pause } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  TrackingContainer,
  TrackingHeader,
  DateTimeRow,
  NotesInput,
  SaveButton,
} from "@/components/tracking/shared";
import { ConflictDialog } from "@/components/tracking/conflict-dialog";
import {
  createFeeding,
  updateFeeding,
  deleteFeeding,
  getLastFeeding,
  getActiveNursing,
  startOrUpdateActiveNursing,
  cancelActiveNursing,
  completeActiveNursing,
  getActivityConflicts,
  getActiveSleep,
  createSleepLog,
  updateSleepLog,
} from "@/lib/actions/tracking";
import {
  cn,
  Conflict,
  convertVolume,
  roundToStep,
  type VolumeUnit,
} from "@/lib/utils";
import { getCurrentUser } from "@/lib/actions/users";

type FeedingTab = "nursing" | "bottle";
type NursingSide = "left" | "right";
type BottleContent = "breast_milk" | "formula";

export default function FeedingPage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;
  const entryId = params.entryId as string;

  const isEditMode = !!entryId && entryId !== "new";

  // Tab state
  const [activeTab, setActiveTab] = useState<FeedingTab>("nursing");
  const [originalFeedingType, setOriginalFeedingType] =
    useState<FeedingTab | null>(null);

  const [unitSystem, setUnitSystem] = useState<"imperial" | "metric">(
    "imperial"
  );

  // Nursing mode
  const [isManualMode, setIsManualMode] = useState(false);

  // Nursing state
  const [lastSide, setLastSide] = useState<NursingSide | null>(null);
  const [activeSide, setActiveSide] = useState<NursingSide | null>(null);
  const [leftDuration, setLeftDuration] = useState(0);
  const [rightDuration, setRightDuration] = useState(0);
  const [pausedDuration, setPausedDuration] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [nursingStartTime, setNursingStartTime] = useState<Date | null>(null);
  const [nursingEndTime, setNursingEndTime] = useState<Date | null>(null);

  const [manualStartTime, setManualStartTime] = useState<Date>(new Date());
  const [manualEndTime, setManualEndTime] = useState<Date>(new Date());
  const [manualLeftMinutes, setManualLeftMinutes] = useState<number>(0);
  const [manualRightMinutes, setManualRightMinutes] = useState<number>(0);

  // Bottle state
  const [bottleContent, setBottleContent] =
    useState<BottleContent>("breast_milk");
  const [amountUnit, setAmountUnit] = useState<VolumeUnit>("oz");
  const [amount, setAmount] = useState(4);
  const [bottleStartTime, setBottleStartTime] = useState(new Date());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadUserSettings() {
      try {
        const user = await getCurrentUser();
        if (user?.unitSystem) {
          setUnitSystem(user.unitSystem);
          setAmountUnit(user.unitSystem === "metric" ? "ml" : "oz");
        }
      } catch {
        // ignore
      }
    }

    loadUserSettings();
  }, []);

  // Loading state
  const [saving, setSaving] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingEntry, setLoadingEntry] = useState(isEditMode);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);

  // Conflict handling
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingConflicts, setPendingConflicts] = useState<Conflict[]>([]);
  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);

  // Sleep prompt after nighttime feeding
  const [sleepPromptOpen, setSleepPromptOpen] = useState(false);
  const [pendingSleepStart, setPendingSleepStart] = useState<
    (() => Promise<void>) | null
  >(null);

  // Current status for persistence: which state is the timer in?
  // "left" = timer running on left, "right" = timer running on right, "paused" = timer stopped
  const getCurrentStatus = (): "left" | "right" | "paused" => {
    if (!isTimerRunning) return "paused";
    return activeSide || "paused";
  };

  // Load entry data if in edit mode
  useEffect(() => {
    async function loadEntry() {
      if (!isEditMode) return;

      setLoadingEntry(true);
      try {
        // For now, we'll need to get the entry from the timeline
        // In a real implementation, you'd have a getEntryById function
        const { getTimelineEntries } = await import("@/lib/actions/tracking");
        const entries = await getTimelineEntries(babyId, "7d");
        const entry = entries.find((e) => e.id === entryId);

        if (entry && entry.entryType === "feeding") {
          // Check if this is an active nursing session
          if (
            entry.type === "nursing" &&
            !entry.endTime &&
            entry.currentStatus
          ) {
            // This is an active nursing session, redirect to the "new" view
            router.replace(`/baby/${babyId}/feeding/new`);
            return;
          }

          if (entry.type === "bottle") {
            setActiveTab("bottle");
            setOriginalFeedingType("bottle");
            setBottleStartTime(new Date(entry.startTime || entry.time));
            setBottleContent(entry.bottleContent || "breast_milk");
            setAmount(entry.amount || 4);
            setAmountUnit((entry.amountUnit || "oz") as VolumeUnit);
            setNotes(entry.notes || "");
          } else {
            // Nursing entry (completed)
            setActiveTab("nursing");
            setOriginalFeedingType("nursing");
            setNursingStartTime(new Date(entry.startTime || entry.time));
            setNursingEndTime(entry.endTime ? new Date(entry.endTime) : null);
            setLeftDuration(entry.leftDuration || 0);
            setRightDuration(entry.rightDuration || 0);
            setPausedDuration(entry.pausedDuration || 0);
            setNotes(entry.notes || "");
          }
        }
      } catch (error) {
        console.error("Failed to load entry:", error);
        toast.error("Failed to load entry");
      } finally {
        setLoadingEntry(false);
      }
    }

    loadEntry();
  }, [isEditMode, entryId, babyId]);

  // If a nursing timer session is active, lock the UI to nursing
  useEffect(() => {
    if (!isEditMode && nursingStartTime) {
      setActiveTab("nursing");
    }
  }, [isEditMode, nursingStartTime]);

  // Load active nursing session and last feeding info on mount
  useEffect(() => {
    async function loadSession() {
      if (isEditMode) {
        setLoadingSession(false);
        return;
      }

      try {
        // Check for active nursing session first
        const activeSession = await getActiveNursing(babyId);
        if (activeSession) {
          // Restore the session
          const startTime = new Date(activeSession.startTime);
          const lastPersisted = activeSession.lastPersistedAt
            ? new Date(activeSession.lastPersistedAt)
            : new Date();
          const savedStatus = activeSession.currentStatus as
            | "left"
            | "right"
            | "paused"
            | null;

          // Calculate time elapsed since last persist
          const timeSinceLastPersist = Math.floor(
            (Date.now() - lastPersisted.getTime()) / 1000
          );

          // Add elapsed time to the appropriate duration based on saved status
          let left = activeSession.leftDuration || 0;
          let right = activeSession.rightDuration || 0;
          let paused = activeSession.pausedDuration || 0;

          if (savedStatus === "left") {
            left += timeSinceLastPersist;
          } else if (savedStatus === "right") {
            right += timeSinceLastPersist;
          } else if (savedStatus === "paused") {
            paused += timeSinceLastPersist;
          }

          setNursingStartTime(startTime);
          setLeftDuration(left);
          setRightDuration(right);
          setPausedDuration(paused);

          // Restore the active side and timer state
          if (savedStatus === "left") {
            setActiveSide("left");
            setIsTimerRunning(true);
          } else if (savedStatus === "right") {
            setActiveSide("right");
            setIsTimerRunning(true);
          } else {
            // Paused - determine which side was last active
            if (left > 0 && right === 0) setActiveSide("left");
            else if (right > 0) setActiveSide("right");
            else setActiveSide(null);
            setIsTimerRunning(false);
          }

          setNotes(activeSession.notes || "");
        } else {
          // No active session, get last feeding for "last side" hint
          const last = await getLastFeeding(babyId);
          if (last?.side && last.side !== "both") {
            setLastSide(last.side as NursingSide);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSession(false);
      }
    }
    loadSession();
  }, [babyId, isEditMode]);

  // Persist nursing session to DB (only called on state changes)
  const persistSession = useCallback(
    async (overrideStatus?: "left" | "right" | "paused") => {
      if (!babyId || !nursingStartTime) return;

      const status = overrideStatus ?? getCurrentStatus();

      try {
        await startOrUpdateActiveNursing({
          babyId,
          startTime: nursingStartTime,
          leftDuration,
          rightDuration,
          pausedDuration,
          currentStatus: status,
          notes: notes || undefined,
        });
      } catch (error) {
        console.error("Failed to persist nursing session:", error);
      }
    },
    [
      babyId,
      nursingStartTime,
      leftDuration,
      rightDuration,
      pausedDuration,
      notes,
      getCurrentStatus,
    ]
  );

  // Timer logic - increments the appropriate duration every second
  useEffect(() => {
    // Only start timer if we have a session
    if (!nursingStartTime) return;

    const interval = setInterval(() => {
      if (isTimerRunning && activeSide === "left") {
        setLeftDuration((d) => d + 1);
      } else if (isTimerRunning && activeSide === "right") {
        setRightDuration((d) => d + 1);
      } else if (!isTimerRunning && (leftDuration > 0 || rightDuration > 0)) {
        // Timer is paused but session exists - increment paused time
        setPausedDuration((d) => d + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isTimerRunning,
    activeSide,
    nursingStartTime,
    leftDuration,
    rightDuration,
  ]);

  // Persist when state changes (start, pause, switch sides)
  const prevStateRef = useRef<{ running: boolean; side: NursingSide | null }>({
    running: false,
    side: null,
  });
  useEffect(() => {
    const prev = prevStateRef.current;
    const stateChanged =
      prev.running !== isTimerRunning || prev.side !== activeSide;

    // Persist on state transitions (but not on initial load)
    if (
      stateChanged &&
      nursingStartTime &&
      (leftDuration > 0 || rightDuration > 0 || pausedDuration > 0)
    ) {
      persistSession();
    }

    prevStateRef.current = { running: isTimerRunning, side: activeSide };
  }, [
    isTimerRunning,
    activeSide,
    nursingStartTime,
    persistSession,
    leftDuration,
    rightDuration,
    pausedDuration,
  ]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Check if current time is nighttime (8pm to 8am)
  const isNighttime = (date: Date) => {
    const hour = date.getHours();
    return hour >= 20 || hour < 8; // 8pm (20) to 8am (8)
  };

  // Handle sleep prompt after nighttime feeding
  const handleSleepPrompt = async () => {
    setSleepPromptOpen(false);
    if (pendingSleepStart) {
      await pendingSleepStart();
      setPendingSleepStart(null);
    }
  };

  const dismissSleepPrompt = () => {
    setSleepPromptOpen(false);
    setPendingSleepStart(null);
    if (isEditMode) {
      router.push(`/baby/${babyId}`);
    } else {
      router.push(`/baby/${babyId}`);
    }
  };

  // Helper to check conflicts and show dialog if needed
  const checkConflictsAndProceed = async (
    activityType: "feeding",
    action: () => Promise<void>,
    startTime?: Date,
    endTime?: Date
  ) => {
    try {
      // When editing, pass the entry ID to exclude it from conflict checking
      const conflictResult = await getActivityConflicts(
        babyId,
        activityType,
        startTime,
        endTime,
        isEditMode ? entryId : undefined
      );

      if (conflictResult.hasConflicts) {
        setPendingConflicts(conflictResult.conflicts);
        setPendingAction(() => action);
        setConflictDialogOpen(true);
        return;
      }

      // No conflicts, proceed with action
      await action();
    } catch (error) {
      console.error("Failed to check conflicts:", error);
      toast.error("Failed to check for conflicts");
    }
  };

  // Handle conflict resolution
  const handleConflictConfirm = async () => {
    if (!pendingAction) return;

    try {
      // Special case: feeding conflicting with sleep -> stop sleep first, then start feeding
      const hasSleepConflict = pendingConflicts.some(
        (conflict) =>
          conflict.type === "active_conflict" &&
          conflict.conflictingActivities.some(
            (activity) => activity.type === "sleep"
          )
      );

      if (hasSleepConflict) {
        // Stop the active sleep session
        const activeSleep = await getActiveSleep(babyId);
        if (activeSleep) {
          await updateSleepLog(activeSleep.id, babyId, {
            endTime: new Date(),
            notes: activeSleep.notes
              ? `${activeSleep.notes} (Auto-completed when starting feeding)`
              : "Auto-completed when starting feeding",
          });
          toast.success("Sleep session completed");
        }
      }

      // Now proceed with the original action (starting feeding)
      await pendingAction();
    } catch (error) {
      console.error("Failed to execute pending action:", error);
      toast.error(
        `Failed to save: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setPendingAction(null);
      setPendingConflicts([]);
      setConflictDialogOpen(false);
    }
  };

  const handleConflictCancel = () => {
    setPendingAction(null);
    setPendingConflicts([]);
  };

  const handleSidePress = async (side: NursingSide) => {
    if (activeSide === side && isTimerRunning) {
      // Pause current side
      setIsTimerRunning(false);
    } else if (activeSide === side && !isTimerRunning) {
      // Resume current side
      setIsTimerRunning(true);
    } else {
      // Switch to new side or start
      const startTime = nursingStartTime || new Date();
      if (!nursingStartTime) {
        // Update UI state immediately for responsive feedback
        setNursingStartTime(startTime);
        setActiveSide(side);
        setIsTimerRunning(true);

        // Check for conflicts and persist to DB (async)
        await checkConflictsAndProceed(
          "feeding",
          async () => {
            // Immediately persist to DB when starting
            await startOrUpdateActiveNursing(
              {
                babyId,
                startTime,
                leftDuration: 0,
                rightDuration: 0,
                pausedDuration: 0,
                currentStatus: side,
                notes: notes || undefined,
              },
              { allowOverride: true }
            );
          },
          startTime
        );
      } else {
        // Just switch sides - no conflict checking needed for updates
        setActiveSide(side);
        setIsTimerRunning(true);
      }
    }
  };

  const resetNursing = async () => {
    // Cancel the active session in DB
    try {
      await cancelActiveNursing(babyId);
    } catch (error) {
      console.error("Failed to cancel nursing session:", error);
    }

    setActiveSide(null);
    setLeftDuration(0);
    setRightDuration(0);
    setPausedDuration(0);
    setIsTimerRunning(false);
    setNursingStartTime(null);
    setNotes("");
  };

  const getManualTotalMinutes = () => {
    return Math.max(0, manualLeftMinutes) + Math.max(0, manualRightMinutes);
  };

  const addMinutes = (date: Date, minutes: number) => {
    return new Date(date.getTime() + minutes * 60 * 1000);
  };

  const syncManualEndFromStartAndMinutes = (
    start: Date,
    leftMin: number,
    rightMin: number
  ) => {
    const total = Math.max(0, leftMin) + Math.max(0, rightMin);
    setManualEndTime(addMinutes(start, total));
  };

  const syncManualMinutesFromStartEnd = (start: Date, end: Date) => {
    const durationMinutes = Math.max(
      0,
      Math.round((end.getTime() - start.getTime()) / (60 * 1000))
    );

    if (durationMinutes === 0) {
      setManualLeftMinutes(0);
      setManualRightMinutes(0);
      return;
    }

    const currentLeft = Math.max(0, manualLeftMinutes);
    const currentRight = Math.max(0, manualRightMinutes);
    const currentTotal = currentLeft + currentRight;

    if (currentTotal === 0) {
      setManualLeftMinutes(durationMinutes);
      setManualRightMinutes(0);
      return;
    }

    const leftRatio = currentLeft / currentTotal;
    const newLeft = Math.round(durationMinutes * leftRatio);
    const newRight = Math.max(0, durationMinutes - newLeft);

    setManualLeftMinutes(newLeft);
    setManualRightMinutes(newRight);
  };

  const handleManualStartTimeChange = (newStart: Date) => {
    setManualStartTime(newStart);
    syncManualEndFromStartAndMinutes(
      newStart,
      manualLeftMinutes,
      manualRightMinutes
    );
  };

  const handleManualEndTimeChange = (newEnd: Date) => {
    setManualEndTime(newEnd);
    syncManualMinutesFromStartEnd(manualStartTime, newEnd);
  };

  const handleManualMinutesChange = (
    side: "left" | "right",
    minutes: number
  ) => {
    const next = Math.max(0, minutes);
    const nextLeft = side === "left" ? next : manualLeftMinutes;
    const nextRight = side === "right" ? next : manualRightMinutes;

    if (side === "left") setManualLeftMinutes(nextLeft);
    else setManualRightMinutes(nextRight);

    const requiredEnd = addMinutes(
      manualStartTime,
      Math.max(0, nextLeft) + Math.max(0, nextRight)
    );
    if (requiredEnd.getTime() > manualEndTime.getTime()) {
      setManualEndTime(requiredEnd);
    }
  };

  const enterManualModeFromTimers = () => {
    const start = nursingStartTime || new Date();
    const end = new Date();
    setManualStartTime(start);
    setManualEndTime(end);
    setManualLeftMinutes(Math.floor(leftDuration / 60));
    setManualRightMinutes(Math.floor(rightDuration / 60));
    setIsManualMode(true);
  };

  const enterManualModeBlank = () => {
    const now = new Date();
    setManualStartTime(now);
    setManualEndTime(now);
    setManualLeftMinutes(0);
    setManualRightMinutes(0);
    setIsManualMode(true);
  };

  const handleSaveManualNursing = async () => {
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    const leftSeconds = Math.max(0, Math.floor(manualLeftMinutes * 60));
    const rightSeconds = Math.max(0, Math.floor(manualRightMinutes * 60));

    if (leftSeconds === 0 && rightSeconds === 0) {
      toast.error("Please enter a duration");
      return;
    }

    const startTime = manualStartTime;
    const endTime = manualEndTime;

    if (endTime <= startTime) {
      toast.error("End time must be after start time");
      return;
    }

    await checkConflictsAndProceed(
      "feeding",
      async () => {
        setSaving(true);
        try {
          if (isEditMode) {
            await updateFeeding(entryId, babyId, {
              startTime,
              endTime,
              leftDuration: leftSeconds,
              rightDuration: rightSeconds,
              pausedDuration: 0,
              notes: notes || undefined,
            });
            toast.success("Nursing session updated!");
          } else {
            await createFeeding(
              {
                babyId,
                type: "nursing",
                startTime,
                endTime,
                leftDuration: leftSeconds,
                rightDuration: rightSeconds,
                pausedDuration: 0,
                notes: notes || undefined,
              },
              { allowOverride: true }
            );
            toast.success("Nursing session saved!");
          }
          router.push(`/baby/${babyId}`);
        } catch (error) {
          toast.error("Failed to save");
          console.error(error);
        } finally {
          setSaving(false);
        }
      },
      startTime,
      endTime
    );
  };

  const handleNursingStartTimeChange = async (newStartTime: Date) => {
    if (!nursingStartTime) return;

    const oldStartTime = nursingStartTime;
    // Calculate the difference in seconds
    const diffSeconds = Math.floor(
      (oldStartTime.getTime() - newStartTime.getTime()) / 1000
    );
    // Calculate new durations - add time to active side
    let newLeftDuration = leftDuration;
    let newRightDuration = rightDuration;
    if (diffSeconds !== 0) {
      if (activeSide === "right") {
        newRightDuration = Math.max(0, rightDuration + diffSeconds);
        setRightDuration(newRightDuration);
      } else {
        newLeftDuration = Math.max(0, leftDuration + diffSeconds);
        setLeftDuration(newLeftDuration);
      }
    }
    setNursingStartTime(newStartTime);
    // Persist the changes
    try {
      await startOrUpdateActiveNursing({
        babyId,
        startTime: newStartTime,
        leftDuration: newLeftDuration,
        rightDuration: newRightDuration,
        pausedDuration,
        currentStatus: getCurrentStatus(),
        notes: notes || undefined,
      });
    } catch (error) {
      console.error("Failed to persist start time change:", error);
    }
  };

  const handleEditModeTimeChange = (type: "start" | "end", newTime: Date) => {
    if (!nursingStartTime || !nursingEndTime) return;

    if (type === "start") {
      setNursingStartTime(newTime);
      // Recalculate durations based on new start time
      const newTotalSeconds = Math.floor(
        (nursingEndTime.getTime() - newTime.getTime()) / 1000
      );
      const oldTotalSeconds = leftDuration + rightDuration;

      if (newTotalSeconds > 0 && oldTotalSeconds > 0) {
        const ratio = newTotalSeconds / oldTotalSeconds;
        setLeftDuration(Math.floor(leftDuration * ratio));
        setRightDuration(Math.floor(rightDuration * ratio));
      } else if (newTotalSeconds <= 0) {
        // Start time is after end time, keep end time but show warning
        toast.error("Start time must be before end time");
      }
    } else {
      setNursingEndTime(newTime);
      // Recalculate durations based on new end time
      const newTotalSeconds = Math.floor(
        (newTime.getTime() - nursingStartTime.getTime()) / 1000
      );
      const oldTotalSeconds = leftDuration + rightDuration;

      if (newTotalSeconds > 0 && oldTotalSeconds > 0) {
        const ratio = newTotalSeconds / oldTotalSeconds;
        setLeftDuration(Math.floor(leftDuration * ratio));
        setRightDuration(Math.floor(rightDuration * ratio));
      } else if (newTotalSeconds <= 0) {
        // End time is before start time, show warning
        toast.error("End time must be after start time");
      }
    }
  };

  const handleSaveNursing = async () => {
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    if (leftDuration === 0 && rightDuration === 0) {
      toast.error("Please start a nursing session first");
      return;
    }

    const startTime = nursingStartTime || new Date();
    const endTime = isEditMode ? nursingEndTime || new Date() : new Date();

    await checkConflictsAndProceed(
      "feeding",
      async () => {
        setSaving(true);
        try {
          if (isEditMode) {
            // Update existing entry
            await updateFeeding(entryId, babyId, {
              startTime,
              endTime,
              leftDuration,
              rightDuration,
              pausedDuration,
              notes: notes || undefined,
            });
            toast.success("Nursing session updated!");
            router.push(`/baby/${babyId}`);
          } else {
            // Complete the active nursing session (sets endTime, clears lastPersistedAt & currentStatus)
            await completeActiveNursing(babyId, {
              startTime,
              endTime,
              leftDuration,
              rightDuration,
              pausedDuration,
              notes: notes || undefined,
            });

            toast.success("Nursing session saved!");

            // Check if it's nighttime and prompt for sleep tracking
            if (isNighttime(endTime)) {
              setPendingSleepStart(() => async () => {
                try {
                  await createSleepLog(
                    {
                      babyId,
                      startTime: endTime,
                    },
                    { allowOverride: true }
                  );
                  toast.success("Sleep tracking started!");
                  router.push(`/baby/${babyId}/sleep/new`);
                } catch (error) {
                  console.error("Failed to start sleep tracking:", error);
                  toast.error("Failed to start sleep tracking");
                  router.push(`/baby/${babyId}`);
                }
              });
              setSleepPromptOpen(true);
            } else {
              router.push(`/baby/${babyId}`);
            }
          }
        } catch (error) {
          toast.error("Failed to save");
          console.error(error);
        } finally {
          setSaving(false);
        }
      },
      startTime,
      endTime
    );
  };

  const handleSaveBottle = async () => {
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    await checkConflictsAndProceed(
      "feeding",
      async () => {
        setSaving(true);
        try {
          if (isEditMode) {
            // Update existing entry
            await updateFeeding(entryId, babyId, {
              startTime: bottleStartTime,
              endTime: bottleStartTime,
              bottleContent,
              amount,
              amountUnit,
              notes: notes || undefined,
            });
            toast.success("Bottle feeding updated!");
            router.push(`/baby/${babyId}`);
          } else {
            await createFeeding(
              {
                babyId,
                type: "bottle",
                startTime: bottleStartTime,
                endTime: bottleStartTime, // Bottle feedings are completed immediately
                bottleContent,
                amount,
                amountUnit,
                notes: notes || undefined,
              },
              { allowOverride: true }
            );

            toast.success("Bottle feeding saved!");

            // Check if it's nighttime and prompt for sleep tracking
            if (isNighttime(bottleStartTime)) {
              setPendingSleepStart(() => async () => {
                try {
                  await createSleepLog(
                    {
                      babyId,
                      startTime: bottleStartTime,
                    },
                    { allowOverride: true }
                  );
                  toast.success("Sleep tracking started!");
                  router.push(`/baby/${babyId}/sleep/new`);
                } catch (error) {
                  console.error("Failed to start sleep tracking:", error);
                  toast.error("Failed to start sleep tracking");
                  router.push(`/baby/${babyId}`);
                }
              });
              setSleepPromptOpen(true);
            } else {
              router.push(`/baby/${babyId}`);
            }
          }
        } catch (error) {
          toast.error("Failed to save");
          console.error(error);
        } finally {
          setSaving(false);
        }
      },
      bottleStartTime,
      bottleStartTime
    );
  };

  const handleDelete = async () => {
    if (!isEditMode) return;

    try {
      await deleteFeeding(entryId, babyId);
      toast.success("Feeding deleted!");
      router.push(`/baby/${babyId}`);
    } catch (error) {
      toast.error("Failed to delete feeding");
      console.error(error);
    }
  };

  const handleCancel = () => {
    router.push(`/baby/${babyId}`);
  };

  if (loadingSession || loadingEntry) {
    return (
      <TrackingContainer>
        <TrackingHeader title={isEditMode ? "Edit feeding" : "Add feeding"} />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            {loadingEntry ? "Loading entry..." : "Loading session..."}
          </div>
        </div>
      </TrackingContainer>
    );
  }

  return (
    <TrackingContainer>
      <TrackingHeader title={isEditMode ? "Edit feeding" : "Add feeding"} />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          // In edit mode, prevent switching between nursing and bottle
          if (isEditMode && originalFeedingType && originalFeedingType !== v) {
            return;
          }
          // During an active nursing session, keep user on nursing
          if (!isEditMode && nursingStartTime) {
            return;
          }
          setActiveTab(v as FeedingTab);
        }}
        className="w-full"
      >
        {(() => {
          const hasActiveNursingSession = !isEditMode && !!nursingStartTime;
          const showNursingTab =
            !isEditMode || originalFeedingType === "nursing";
          const showBottleTab =
            !hasActiveNursingSession &&
            (!isEditMode || originalFeedingType === "bottle");
          const cols = (showNursingTab ? 1 : 0) + (showBottleTab ? 1 : 0);

          return (
            <TabsList
              className={cn(
                "grid w-full mb-6",
                cols === 1 ? "grid-cols-1" : "grid-cols-2"
              )}
            >
              {showNursingTab && (
                <TabsTrigger
                  value="nursing"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Nursing
                </TabsTrigger>
              )}
              {showBottleTab && (
                <TabsTrigger
                  value="bottle"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Bottle
                </TabsTrigger>
              )}
            </TabsList>
          );
        })()}

        {/* Nursing Tab */}
        <TabsContent value="nursing" className="space-y-6">
          {!isEditMode && !nursingStartTime && !isManualMode && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={enterManualModeBlank}>
                Manual
              </Button>
            </div>
          )}

          {isManualMode && (
            <>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setIsManualMode(false)}
                  disabled={saving}
                >
                  Use timers
                </Button>
              </div>

              <DateTimeRow
                label="Start Time"
                value={manualStartTime}
                onChange={handleManualStartTimeChange}
              />
              <DateTimeRow
                label="End Time"
                value={manualEndTime}
                onChange={handleManualEndTimeChange}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Left (minutes)</span>
                  <Input
                    type="number"
                    min={0}
                    max={240}
                    value={manualLeftMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      handleManualMinutesChange(
                        "left",
                        Number.isFinite(val) ? val : 0
                      );
                    }}
                    className="w-24 text-right"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Right (minutes)</span>
                  <Input
                    type="number"
                    min={0}
                    max={240}
                    value={manualRightMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      handleManualMinutesChange(
                        "right",
                        Number.isFinite(val) ? val : 0
                      );
                    }}
                    className="w-24 text-right"
                  />
                </div>
              </div>

              <NotesInput value={notes} onChange={setNotes} />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-14 text-lg rounded-full"
                  onClick={() => {
                    setIsManualMode(false);
                    setNotes("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-14 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleSaveManualNursing}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </>
          )}

          {!isManualMode && isEditMode && (
            <>
              {/* Start Time - shown in edit mode */}
              <DateTimeRow
                label="Start Time"
                value={nursingStartTime || new Date()}
                onChange={(newTime) =>
                  handleEditModeTimeChange("start", newTime)
                }
              />

              {/* End Time for edit mode */}
              <DateTimeRow
                label="End Time"
                value={nursingEndTime || new Date()}
                onChange={(newTime) => handleEditModeTimeChange("end", newTime)}
              />
            </>
          )}

          {/* Start Time - shown once nursing has started */}
          {nursingStartTime && !isEditMode && !isManualMode && (
            <DateTimeRow
              label="Start Time"
              value={nursingStartTime}
              onChange={handleNursingStartTimeChange}
            />
          )}

          {/* Timer Display - only when paused (not running) */}
          {(leftDuration > 0 || rightDuration > 0) &&
            !isTimerRunning &&
            !isEditMode &&
            !isManualMode && (
              <div className="text-center">
                <div className="text-4xl font-bold font-mono">
                  {formatDuration(leftDuration + rightDuration)}
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  Total duration
                </p>
              </div>
            )}

          {/* Side Buttons */}
          {!isManualMode && (
            <div className="flex gap-4 justify-center">
              {(["left", "right"] as const).map((side) => (
                <div key={side} className="relative">
                  {lastSide === side && !activeSide && (
                    <span className="absolute -top-2 -left-2 bg-card text-xs px-2 py-1 rounded-full border border-border z-10">
                      Last Side
                    </span>
                  )}
                  <button
                    onClick={() => handleSidePress(side)}
                    className={cn(
                      "w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2 transition-all",
                      "border-2 border-dashed",
                      activeSide === side && isTimerRunning
                        ? "bg-coral text-white border-coral timer-pulse"
                        : activeSide === side
                        ? "bg-coral/80 text-white border-coral"
                        : "bg-coral/20 text-coral border-coral/50 hover:bg-coral/30"
                    )}
                  >
                    {activeSide === side && isTimerRunning ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8" />
                    )}
                    <span className="font-bold uppercase">{side}</span>
                    {(side === "left" ? leftDuration : rightDuration) > 0 && (
                      <span className="text-sm">
                        {formatDuration(
                          side === "left" ? leftDuration : rightDuration
                        )}
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Duration Distribution Slider */}
          {(leftDuration > 0 || rightDuration > 0) &&
            !isTimerRunning &&
            !isEditMode &&
            !isManualMode && (
              <div className="space-y-3 px-4">
                <div className="flex justify-between text-sm">
                  <span className="text-coral font-medium">
                    Left: {formatDuration(leftDuration)}
                  </span>
                  <span className="text-coral font-medium">
                    Right: {formatDuration(rightDuration)}
                  </span>
                </div>
                <Slider
                  value={[leftDuration]}
                  onValueChange={([newLeft]) => {
                    const total = leftDuration + rightDuration;
                    const clampedLeft = Math.max(0, Math.min(total, newLeft));
                    setLeftDuration(clampedLeft);
                    setRightDuration(total - clampedLeft);
                  }}
                  onValueCommit={async () => {
                    // Persist when user releases the slider
                    await persistSession();
                  }}
                  min={0}
                  max={leftDuration + rightDuration}
                  step={1}
                  className="w-full"
                />
                <p className="text-center text-xs text-muted-foreground">
                  Drag to adjust time distribution
                </p>
              </div>
            )}

          {!isTimerRunning &&
            !isEditMode &&
            nursingStartTime &&
            !isManualMode && <NotesInput value={notes} onChange={setNotes} />}

          {/* Action Buttons */}
          {isEditMode ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14 text-lg rounded-full"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-14 text-lg rounded-full"
                onClick={handleDelete}
                disabled={saving}
              >
                Delete
              </Button>
              <Button
                className="flex-1 h-14 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSaveNursing}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <>
              {/* While timer running: show nothing here (per spec) */}
              {!isTimerRunning &&
                (leftDuration > 0 || rightDuration > 0) &&
                !isManualMode && (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-14 text-lg rounded-full"
                      onClick={resetNursing}
                      disabled={saving}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-14 text-lg rounded-full"
                      onClick={enterManualModeFromTimers}
                      disabled={saving}
                    >
                      Edit
                    </Button>
                    <Button
                      className="flex-1 h-14 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleSaveNursing}
                      disabled={
                        saving || (leftDuration === 0 && rightDuration === 0)
                      }
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
            </>
          )}

          {/* Dismiss Confirmation Dialog */}
          <Dialog
            open={showDismissConfirm}
            onOpenChange={setShowDismissConfirm}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dismiss session?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to dismiss this nursing session? All
                  recorded time will be lost.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDismissConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDismissConfirm(false);
                    resetNursing();
                  }}
                >
                  Dismiss
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Bottle Tab */}
        {!(!isEditMode && !!nursingStartTime) &&
          (!isEditMode || originalFeedingType === "bottle") && (
            <TabsContent value="bottle" className="space-y-6">
              <DateTimeRow
                label="Start Time"
                value={bottleStartTime}
                onChange={setBottleStartTime}
              />

              {/* Content Type */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Type:</span>
                <div className="flex gap-2">
                  {(["breast_milk", "formula"] as const).map((type) => (
                    <Button
                      key={type}
                      variant={bottleContent === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBottleContent(type)}
                      className={cn(
                        bottleContent === type &&
                          "bg-accent text-accent-foreground"
                      )}
                    >
                      {type === "breast_milk" ? "Breast milk" : "Formula"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Unit Toggle */}
              <div className="flex justify-center gap-2">
                {(["oz", "ml"] as const).map((unit) => (
                  <Button
                    key={unit}
                    variant={amountUnit === unit ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (amountUnit === unit) return;
                      const converted = convertVolume(amount, amountUnit, unit);
                      const step = unit === "oz" ? 0.25 : 5;
                      const rounded = roundToStep(converted, step);
                      const clamped =
                        unit === "oz"
                          ? Math.min(12, Math.max(0, rounded))
                          : Math.min(350, Math.max(0, rounded));
                      setAmountUnit(unit);
                      setAmount(
                        unit === "oz"
                          ? Number(clamped.toFixed(2))
                          : Math.round(clamped)
                      );
                    }}
                    className={cn(
                      amountUnit === unit && "bg-cyan text-cyan-foreground"
                    )}
                  >
                    {unit}
                  </Button>
                ))}
              </div>

              {/* Amount */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Amount (optional)
                  </span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val >= 0) {
                          const max = amountUnit === "oz" ? 12 : 350;
                          setAmount(Math.min(val, max));
                        }
                      }}
                      min={0}
                      max={amountUnit === "oz" ? 12 : 350}
                      step={amountUnit === "oz" ? 0.25 : 5}
                      className="w-20 text-right bg-transparent border-border text-accent"
                    />
                    <span className="text-accent">{amountUnit}</span>
                  </div>
                </div>
                <Slider
                  value={[amount]}
                  onValueChange={([v]) => setAmount(v)}
                  min={0}
                  max={amountUnit === "oz" ? 12 : 350}
                  step={amountUnit === "oz" ? 0.25 : 5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0</span>
                  <span>{amountUnit === "oz" ? "12" : "350"}</span>
                </div>
              </div>

              <NotesInput value={notes} onChange={setNotes} id="bottle-notes" />

              {/* Action Buttons */}
              {isEditMode ? (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-14 text-lg rounded-full"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 h-14 text-lg rounded-full"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    Delete
                  </Button>
                  <Button
                    className="flex-1 h-14 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleSaveBottle}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              ) : (
                <SaveButton onClick={handleSaveBottle} saving={saving} />
              )}
            </TabsContent>
          )}
      </Tabs>

      {/* Conflict Dialog */}
      <ConflictDialog
        open={conflictDialogOpen}
        onOpenChange={setConflictDialogOpen}
        conflicts={pendingConflicts}
        activityType="feeding"
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
        onGoToActivity={(activityType) => {
          if (activityType === "sleep")
            router.push(`/baby/${babyId}/sleep/new`);
          if (activityType === "pumping")
            router.push(`/baby/${babyId}/pumping/new`);
          // For feeding conflicts, stay on current page
        }}
        loading={saving}
      />

      {/* Sleep Prompt Dialog */}
      <Dialog open={sleepPromptOpen} onOpenChange={setSleepPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">Is Rafa asleep?</DialogTitle>
            <DialogDescription className="text-center">
              It looks like it's nighttime. Would you like to start tracking
              sleep?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={dismissSleepPrompt}
              className="flex-1"
            >
              Not asleep yet
            </Button>
            <Button
              onClick={handleSleepPrompt}
              className="flex-1 bg-cyan text-cyan-foreground hover:bg-cyan/90"
            >
              Start sleep tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TrackingContainer>
  );
}
