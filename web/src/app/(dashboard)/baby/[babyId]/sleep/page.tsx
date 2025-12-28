"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  X,
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
  createSleepLog,
  getActiveSleep,
  updateSleepLog,
} from "@/lib/actions/tracking";

// Format date for datetime-local input (local timezone, not UTC)
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

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

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeSleepId, setActiveSleepId] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [startMood, setStartMood] = useState<Mood | null>(null);
  const [endMood, setEndMood] = useState<Mood | null>(null);
  const [fallAsleepTime, setFallAsleepTime] = useState<FallAsleepTime | null>(
    null
  );
  const [sleepMethod, setSleepMethod] = useState<SleepMethod | null>(null);
  const [wokeUpChild, setWokeUpChild] = useState(false);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempStartTime, setTempStartTime] = useState<Date>(new Date());

  // Check for active sleep on mount
  useEffect(() => {
    async function checkActiveSleep() {
      if (!babyId) return;
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
  }, [babyId]);

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
    setStartTime(now);
    setIsTimerRunning(true);

    try {
      const result = await createSleepLog({
        babyId,
        startTime: now,
        startMood: startMood || undefined,
        fallAsleepTime: fallAsleepTime || undefined,
        sleepMethod: sleepMethod || undefined,
      });
      setActiveSleepId(result.id);
      toast.success("Sleep tracking started");
    } catch (error) {
      toast.error("Failed to start sleep tracking");
      console.error(error);
      setIsTimerRunning(false);
      setStartTime(null);
    }
  };

  const handleStop = async () => {
    if (!babyId || !activeSleepId) return;

    setSaving(true);
    try {
      await updateSleepLog(activeSleepId, babyId, {
        endTime: new Date(),
        endMood: endMood || undefined,
        wokeUpChild,
        notes: notes || undefined,
      });
      toast.success("Sleep logged!");
      router.push(`/baby/${babyId}`);
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
        });
        setActiveSleepId(result.id);
        toast.success("Sleep tracking started");
      } catch (error) {
        toast.error("Failed to start sleep tracking");
        console.error(error);
        setIsTimerRunning(false);
        setStartTime(null);
        setElapsedSeconds(0);
      }
    }
  };

  const duration = formatDuration(elapsedSeconds);

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Add sleep</h1>
        <Button variant="ghost"></Button>
      </div>

      {loadingSession ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading session...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Start Time - clickable to edit */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Start Time</span>
            {startTime ? (
              <button
                onClick={() => {
                  setTempStartTime(startTime);
                  setShowTimePicker(true);
                }}
                className="text-accent hover:underline"
              >
                {startTime.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </button>
            ) : (
              <button
                onClick={() => {
                  setTempStartTime(new Date());
                  setShowTimePicker(true);
                }}
                className="text-accent hover:underline"
              >
                Set time
              </button>
            )}
          </div>

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
            {!isTimerRunning ? (
              <button
                onClick={handleStart}
                className="w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 bg-cyan text-cyan-foreground hover:bg-cyan/90 transition-all border-4 border-dashed border-cyan/50"
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
        </div>
      )}

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
            {isTimerRunning && (
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

      {/* Time Picker Dialog */}
      <Dialog open={showTimePicker} onOpenChange={setShowTimePicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Set Start Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="datetime-local"
              value={formatDateTimeLocal(tempStartTime)}
              max={formatDateTimeLocal(new Date())}
              onChange={(e) => {
                const newTime = new Date(e.target.value);
                // Prevent future times
                if (newTime <= new Date()) {
                  setTempStartTime(newTime);
                }
              }}
              className="w-full"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowTimePicker(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  // Validate not in the future
                  if (tempStartTime > new Date()) {
                    toast.error("Start time cannot be in the future");
                    return;
                  }
                  handleStartTimeChange(tempStartTime);
                  setShowTimePicker(false);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
