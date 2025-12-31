"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Clock,
  Square,
  Play,
  Frown,
  Smile,
  Timer,
  Moon,
  Baby,
  User,
  Car,
  CircleDot,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrackingContainer,
  TrackingHeader,
  DateTimeRow,
} from "@/components/tracking/shared";
import { ConflictDialog } from "@/components/tracking/conflict-dialog";
import {
  createSleepLog,
  getActiveSleep,
  updateSleepLog,
  deleteSleepLog,
  getActivityConflicts,
  getActiveNursing,
  completeActiveNursing,
} from "@/lib/actions/tracking";
import { Conflict } from "@/lib/utils";

type Mood = "upset" | "content";
type FallAsleepTime = "under_10_min" | "10_to_20_min" | "over_20_min";
type SleepMethod =
  | "on_own_in_bed"
  | "nursing"
  | "worn_or_held"
  | "next_to_carer"
  | "car_seat"
  | "stroller"
  | "other";

const fallAsleepOptions = [
  { value: "under_10_min", label: "Under 10 min", icon: Timer },
  { value: "10_to_20_min", label: "10-20 min", icon: Timer },
  { value: "over_20_min", label: "20+ min", icon: Timer },
];

const sleepMethodOptions = [
  { value: "on_own_in_bed", label: "On own in bed", icon: Moon },
  { value: "nursing", label: "Nursing", icon: Baby },
  { value: "worn_or_held", label: "Worn or held", icon: User },
  { value: "next_to_carer", label: "Next to carer", icon: User },
  { value: "car_seat", label: "Car seat", icon: Car },
  { value: "stroller", label: "Stroller", icon: CircleDot },
];

export default function SleepPage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;
  const entryId = params.entryId as string;

  const isEditMode = !!entryId && entryId !== 'new';

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeSleepId, setActiveSleepId] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(isEditMode);
  const [startMood, setStartMood] = useState<Mood | null>(null);
  const [endMood, setEndMood] = useState<Mood | null>(null);
  const [fallAsleepTime, setFallAsleepTime] = useState<FallAsleepTime | null>(
    null
  );
  const [sleepMethod, setSleepMethod] = useState<SleepMethod | null>(null);
  const [wokeUpChild, setWokeUpChild] = useState(false);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingSession, setLoadingSession] = useState(!isEditMode);
  const [loadingEntry, setLoadingEntry] = useState(isEditMode);

  // Conflict handling
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingConflicts, setPendingConflicts] = useState<Conflict[]>([]);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  // Load entry data if in edit mode
  useEffect(() => {
    async function loadEntry() {
      if (!isEditMode) return;

      setLoadingEntry(true);
      try {
        const { getTimelineEntries } = await import("@/lib/actions/tracking");
        const entries = await getTimelineEntries(babyId, '7d');
        const entry = entries.find(e => e.id === entryId);

        if (entry && entry.entryType === 'sleep') {
          setStartTime(new Date(entry.startTime || entry.time));
          setActiveSleepId(entry.id);

          // Set end time if it exists
          if (entry.endTime) {
            setEndTime(new Date(entry.endTime));
            const start = new Date(entry.startTime || entry.time);
            const end = new Date(entry.endTime);
            const elapsed = Math.floor((end.getTime() - start.getTime()) / 1000);
            setElapsedSeconds(elapsed);
          }

          setStartMood(entry.startMood || null);
          setEndMood(entry.endMood || null);
          setFallAsleepTime(entry.fallAsleepTime || null);
          setSleepMethod(entry.sleepMethod || null);
          setWokeUpChild(entry.wokeUpChild || false);
          setNotes(entry.notes || "");
        }
      } catch (error) {
        console.error('Failed to load entry:', error);
        toast.error('Failed to load entry');
      } finally {
        setLoadingEntry(false);
      }
    }

    loadEntry();
  }, [isEditMode, entryId, babyId]);

  // Check for active sleep on mount (only in create mode)
  useEffect(() => {
    async function checkActiveSleep() {
      if (isEditMode) return;

      try {
        const active = await getActiveSleep(babyId);
        if (active) {
          setActiveSleepId(active.id);
          const activeStartTime = new Date(active.startTime);
          setStartTime(activeStartTime);
          setIsTimerRunning(true);
          const elapsed = Math.floor(
            (Date.now() - activeStartTime.getTime()) / 1000
          );
          setElapsedSeconds(elapsed);
          if (active.startMood) setStartMood(active.startMood);
          if (active.fallAsleepTime) setFallAsleepTime(active.fallAsleepTime);
          if (active.sleepMethod) setSleepMethod(active.sleepMethod);
          if (active.notes) setNotes(active.notes);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSession(false);
      }
    }
    checkActiveSleep();
  }, [babyId, isEditMode]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return {
      hours: hours.toString().padStart(2, "0"),
      mins: mins.toString().padStart(2, "0"),
      secs: secs.toString().padStart(2, "0"),
    };
  };

  const handleStart = async () => {
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    const now = new Date();

    await checkConflictsAndProceed(
      "sleep",
      async () => {
        setStartTime(now);
        setIsTimerRunning(true);

        try {
          const result = await createSleepLog({
            babyId,
            startTime: now,
            startMood: startMood || undefined,
            fallAsleepTime: fallAsleepTime || undefined,
            sleepMethod: sleepMethod || undefined,
          }, { allowOverride: true });
          setActiveSleepId(result.id);
          toast.success("Sleep tracking started");
        } catch (error) {
          toast.error("Failed to start sleep tracking");
          console.error(error);
          setIsTimerRunning(false);
          setStartTime(null);
        }
      },
      now
    );
  };

  const handleStop = async () => {
    if (!babyId || !activeSleepId) return;

    setSaving(true);
    try {
      const finalEndTime = endTime || new Date();

      if (isEditMode) {
        // Update existing entry
        await updateSleepLog(activeSleepId, babyId, {
          startTime: startTime || new Date(),
          endTime: finalEndTime,
          startMood: startMood || undefined,
          endMood: endMood || undefined,
          fallAsleepTime: fallAsleepTime || undefined,
          sleepMethod: sleepMethod || undefined,
          wokeUpChild,
          notes: notes || undefined,
        });
        toast.success("Sleep updated!");
        router.push(`/baby/${babyId}`);
      } else {
        await updateSleepLog(activeSleepId, babyId, {
          endTime: finalEndTime,
          endMood: endMood || undefined,
          wokeUpChild,
          notes: notes || undefined,
        });
        toast.success("Sleep logged!");
        router.push(`/baby/${babyId}`);
      }
    } catch (error) {
      toast.error("Failed to save sleep");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDirectSave = async () => {
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    if (!startTime) {
      toast.error("Please set a start time");
      return;
    }

    setSaving(true);
    try {
      if (isEditMode && activeSleepId) {
        // Update existing entry
        await updateSleepLog(activeSleepId, babyId, {
          startTime: startTime,
          endTime: endTime || undefined,
          startMood: startMood || undefined,
          endMood: endMood || undefined,
          fallAsleepTime: fallAsleepTime || undefined,
          sleepMethod: sleepMethod || undefined,
          wokeUpChild,
          notes: notes || undefined,
        });
        toast.success("Sleep updated!");
        router.push(`/baby/${babyId}`);
      } else {
        // Create new entry
        await createSleepLog({
          babyId,
          startTime: startTime,
          endTime: endTime || undefined,
          startMood: startMood || undefined,
          endMood: endMood || undefined,
          fallAsleepTime: fallAsleepTime || undefined,
          sleepMethod: sleepMethod || undefined,
          wokeUpChild,
          notes: notes || undefined,
        }, { allowOverride: true });
        toast.success("Sleep saved!");
        router.push(`/baby/${babyId}`);
      }
    } catch (error) {
      toast.error("Failed to save sleep");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleStartTimeChange = async (newStartTime: Date) => {
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    if (activeSleepId && startTime) {
      // Update existing session - adjust elapsed time
      const newElapsed = Math.floor(
        (Date.now() - newStartTime.getTime()) / 1000
      );

      try {
        await updateSleepLog(activeSleepId, babyId, {
          startTime: newStartTime,
        });
        setStartTime(newStartTime);
        setElapsedSeconds(Math.max(0, newElapsed));
      } catch (error) {
        toast.error("Failed to update start time");
        console.error(error);
      }
    } else {
      // No active session - create one and start the timer
      await checkConflictsAndProceed(
        "sleep",
        async () => {
          setStartTime(newStartTime);
          const newElapsed = Math.floor(
            (Date.now() - newStartTime.getTime()) / 1000
          );
          setElapsedSeconds(Math.max(0, newElapsed));
          setIsTimerRunning(true);

          try {
            const result = await createSleepLog({
              babyId,
              startTime: newStartTime,
              startMood: startMood || undefined,
              fallAsleepTime: fallAsleepTime || undefined,
              sleepMethod: sleepMethod || undefined,
            }, { allowOverride: true });
            setActiveSleepId(result.id);
            toast.success("Sleep tracking started");
          } catch (error) {
            toast.error("Failed to start sleep tracking");
            console.error(error);
            setIsTimerRunning(false);
            setStartTime(null);
            setElapsedSeconds(0);
          }
        },
        newStartTime
      );
    }
  };

  // Helper to check conflicts and show dialog if needed
  const checkConflictsAndProceed = async (
    activityType: "sleep",
    action: () => Promise<void>,
    startTime?: Date,
    endTime?: Date
  ) => {
    try {
      const conflictResult = await getActivityConflicts(babyId, activityType, startTime, endTime);

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
      // Special case: sleep conflicting with feeding -> stop feeding first, then start sleep
      const hasFeedingConflict = pendingConflicts.some(
        conflict => conflict.type === "active_conflict" &&
        conflict.conflictingActivities.some(activity => activity.type === "feeding")
      );

      if (hasFeedingConflict) {
        // Stop the active feeding session
        const activeFeeding = await getActiveNursing(babyId);
        if (activeFeeding) {
          await completeActiveNursing(babyId, {
            startTime: activeFeeding.startTime,
            endTime: new Date(),
            leftDuration: activeFeeding.leftDuration || 0,
            rightDuration: activeFeeding.rightDuration || 0,
            pausedDuration: activeFeeding.pausedDuration || 0,
            notes: activeFeeding.notes ? `${activeFeeding.notes} (Auto-completed when starting sleep)` : "Auto-completed when starting sleep session"
          });
          toast.success("Nursing session completed");
        }
      }

      // Now proceed with the original action (starting sleep)
      await pendingAction();
    } catch (error) {
      console.error("Failed to execute pending action:", error);
      toast.error(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const handleDelete = async () => {
    if (!isEditMode) return;

    try {
      await deleteSleepLog(entryId, babyId);
      toast.success("Sleep deleted!");
      router.push(`/baby/${babyId}`);
    } catch (error) {
      toast.error("Failed to delete sleep");
      console.error(error);
    }
  };

  const handleCancel = () => {
    router.push(`/baby/${babyId}`);
  };

  const duration = formatDuration(
    startTime && endTime
      ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
      : elapsedSeconds
  );

  if (loadingSession || loadingEntry) {
    return (
      <TrackingContainer>
        <TrackingHeader title={isEditMode ? "Edit sleep" : "Add sleep"} />
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
      <TrackingHeader title={isEditMode ? "Edit sleep" : "Add sleep"} />

      <div className="space-y-6">
        <DateTimeRow
          label="Start Time"
          value={startTime || new Date()}
          onChange={handleStartTimeChange}
        />

        <DateTimeRow
          label="End Time (optional)"
          value={endTime || startTime || new Date()}
          onChange={setEndTime}
        />

        {/* Timer Display */}
        <div className="flex flex-col items-center py-8">
          <div className="flex items-baseline gap-1 text-5xl font-bold font-mono">
            <span>{duration.hours}</span>
            <span className="text-muted-foreground">:</span>
            <span>{duration.mins}</span>
            <span className="text-muted-foreground">:</span>
            <span>{duration.secs}</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground mt-2">
            <span>HOURS</span>
            <span>MIN</span>
            <span>SEC</span>
          </div>
        </div>

        {/* Main Action Button */}
        <div className="flex justify-center">
          {startTime && endTime && !isTimerRunning ? (
            // Direct save when both times are set
            <button
              onClick={handleDirectSave}
              disabled={saving}
              className="w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 transition-all border-4 border-dashed border-green-500"
            >
              <Square className="h-10 w-10" />
              <span className="font-bold text-lg">
                {saving ? "SAVING..." : "SAVE"}
              </span>
            </button>
          ) : !isTimerRunning ? (
            <button
              onClick={handleStart}
              disabled={!startTime}
              className="w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 bg-cyan text-cyan-foreground hover:bg-cyan/90 transition-all border-4 border-dashed border-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-12 w-12" />
              <span className="font-bold text-lg">START</span>
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={saving}
              className="w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 bg-cyan text-cyan-foreground hover:bg-cyan/90 transition-all border-4 border-dashed border-cyan/50 timer-pulse"
            >
              <Square className="h-10 w-10" />
              <span className="font-bold text-lg">
                {saving ? "SAVING..." : "STOP"}
              </span>
            </button>
          )}
        </div>

        {/* Add Details Button */}
        <div className="text-center">
          <Button
            variant="link"
            className="text-accent"
            onClick={() => setDetailsOpen(true)}
          >
            <Clock className="h-4 w-4 mr-2" />
            Add Details
          </Button>
        </div>

        {/* Action Buttons */}
        {(isEditMode || (startTime && endTime)) && (
          <div className="flex gap-3">
            {!isEditMode && (
              <Button
                variant="outline"
                className="flex-1 h-14 text-lg rounded-full"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
            )}
            {isEditMode && (
              <>
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
              </>
            )}
            <Button
              className="flex-1 h-14 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={startTime && endTime ? handleDirectSave : handleStop}
              disabled={saving || (!startTime)}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Details</DialogTitle>
            <p className="text-center text-muted-foreground text-sm">
              Optional
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Start of Sleep */}
            <div>
              <h3 className="font-semibold mb-3">START OF SLEEP</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={startMood === "upset" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStartMood("upset")}
                  className="gap-2"
                >
                  <Frown className="h-4 w-4" />
                  Upset
                </Button>
                <Button
                  variant={startMood === "content" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStartMood("content")}
                  className="gap-2"
                >
                  <Smile className="h-4 w-4" />
                  Content
                </Button>
                {fallAsleepOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={
                      fallAsleepTime === opt.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setFallAsleepTime(opt.value as FallAsleepTime)
                    }
                    className="gap-1 text-xs"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* How it happened */}
            <div>
              <h3 className="font-semibold mb-3">How it happened</h3>
              <div className="flex flex-wrap gap-2">
                {sleepMethodOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={sleepMethod === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSleepMethod(opt.value as SleepMethod)}
                    className="gap-2"
                  >
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* End of Sleep */}
            {(isTimerRunning || isEditMode || endTime) && (
              <div>
                <h3 className="font-semibold mb-3">END OF SLEEP</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={wokeUpChild ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWokeUpChild(!wokeUpChild)}
                    className="gap-2"
                  >
                    <Bell className="h-4 w-4" />
                    Woke up child
                  </Button>
                  <Button
                    variant={endMood === "upset" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEndMood("upset")}
                    className="gap-2"
                  >
                    <Frown className="h-4 w-4" />
                    Upset
                  </Button>
                  <Button
                    variant={endMood === "content" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEndMood("content")}
                    className="gap-2"
                  >
                    <Smile className="h-4 w-4" />
                    Content
                  </Button>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Add notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-background"
              />
            </div>

            <Button className="w-full" onClick={() => setDetailsOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conflict Dialog */}
      <ConflictDialog
        open={conflictDialogOpen}
        onOpenChange={setConflictDialogOpen}
        conflicts={pendingConflicts}
        activityType="sleep"
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
        onGoToActivity={(activityType) => {
          if (activityType === "feeding") router.push(`/baby/${babyId}/feeding`);
          if (activityType === "pumping") router.push(`/baby/${babyId}/pumping`);
          // For sleep conflicts, stay on current page
        }}
        loading={saving}
      />
    </TrackingContainer>
  );
}
