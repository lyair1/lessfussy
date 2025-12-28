"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { X, Play, Pause, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getActivePumping,
  startOrUpdateActivePumping,
  cancelActivePumping,
  completeActivePumping,
} from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";

type AmountMode = "total" | "left_right";

// Format date for datetime-local input (local timezone, not UTC)
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function PumpingPage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;

  // Start time - always editable, defaults to now for new sessions
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [amountMode, setAmountMode] = useState<AmountMode>("left_right");
  const [amountUnit, setAmountUnit] = useState<"oz" | "ml">("oz");
  const [leftAmount, setLeftAmount] = useState(3);
  const [rightAmount, setRightAmount] = useState(3);
  const [totalAmount, setTotalAmount] = useState(6);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);

  // Timer state
  const [timerActive, setTimerActive] = useState(false); // Whether a timer session is active
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [activePumpingId, setActivePumpingId] = useState<string | null>(null);

  // Manual duration input (in minutes)
  const [manualDuration, setManualDuration] = useState<number | null>(null);

  // Load active pumping session on mount
  useEffect(() => {
    async function loadSession() {
      if (!babyId) return;
      try {
        const active = await getActivePumping(babyId);
        if (active) {
          setActivePumpingId(active.id);
          const activeStartTime = new Date(active.startTime);
          setStartTime(activeStartTime);
          setTimerActive(true);

          const savedStatus = active.currentStatus as
            | "running"
            | "paused"
            | null;
          const lastPersisted = active.lastPersistedAt
            ? new Date(active.lastPersistedAt)
            : new Date();

          // Calculate time elapsed since last persist
          const timeSinceLastPersist = Math.floor(
            (Date.now() - lastPersisted.getTime()) / 1000
          );

          // Add elapsed time if timer was running
          let duration = active.duration || 0;
          if (savedStatus === "running") {
            duration += timeSinceLastPersist;
          }

          setAccumulatedSeconds(duration);
          setDisplaySeconds(duration);
          setIsTimerRunning(savedStatus === "running");

          if (active.leftAmount !== null) setLeftAmount(active.leftAmount);
          if (active.rightAmount !== null) setRightAmount(active.rightAmount);
          if (active.totalAmount !== null) setTotalAmount(active.totalAmount);
          if (active.amountUnit)
            setAmountUnit(active.amountUnit as "oz" | "ml");
          if (active.notes) setNotes(active.notes);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSession(false);
      }
    }
    loadSession();
  }, [babyId]);

  // Timer tick logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimerRunning) {
      interval = setInterval(() => {
        setAccumulatedSeconds((s) => s + 1);
        setDisplaySeconds((s) => s + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Persist session to DB when state changes
  const prevStateRef = useRef<{ running: boolean }>({ running: false });
  const persistSession = useCallback(async () => {
    if (!babyId || !timerActive) return;

    try {
      await startOrUpdateActivePumping({
        babyId,
        startTime,
        duration: accumulatedSeconds,
        currentStatus: isTimerRunning ? "running" : "paused",
        leftAmount: amountMode === "left_right" ? leftAmount : undefined,
        rightAmount: amountMode === "left_right" ? rightAmount : undefined,
        totalAmount:
          amountMode === "total" ? totalAmount : leftAmount + rightAmount,
        amountUnit,
        notes: notes || undefined,
      });
    } catch (error) {
      console.error("Failed to persist pumping session:", error);
    }
  }, [
    babyId,
    timerActive,
    startTime,
    accumulatedSeconds,
    isTimerRunning,
    amountMode,
    leftAmount,
    rightAmount,
    totalAmount,
    amountUnit,
    notes,
  ]);

  // Persist on state transitions
  useEffect(() => {
    const prev = prevStateRef.current;
    const stateChanged = prev.running !== isTimerRunning;

    if (stateChanged && timerActive && accumulatedSeconds > 0) {
      persistSession();
    }

    prevStateRef.current = { running: isTimerRunning };
  }, [isTimerRunning, timerActive, accumulatedSeconds, persistSession]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartTimer = async () => {
    const now = new Date();
    setStartTime(now);
    setTimerActive(true);
    setIsTimerRunning(true);
    setManualDuration(null);
    setAccumulatedSeconds(0);
    setDisplaySeconds(0);

    // Immediately persist to DB
    try {
      const result = await startOrUpdateActivePumping({
        babyId,
        startTime: now,
        duration: 0,
        currentStatus: "running",
        leftAmount: amountMode === "left_right" ? leftAmount : undefined,
        rightAmount: amountMode === "left_right" ? rightAmount : undefined,
        totalAmount:
          amountMode === "total" ? totalAmount : leftAmount + rightAmount,
        amountUnit,
        notes: notes || undefined,
      });
      setActivePumpingId(result.id);
      toast.success("Pumping session started");
    } catch (error) {
      toast.error("Failed to start pumping session");
      console.error(error);
      setTimerActive(false);
      setIsTimerRunning(false);
    }
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResumeTimer = () => {
    setIsTimerRunning(true);
  };

  const handleResetTimer = async () => {
    try {
      await cancelActivePumping(babyId);
    } catch (error) {
      console.error("Failed to cancel pumping session:", error);
    }

    setStartTime(new Date());
    setTimerActive(false);
    setAccumulatedSeconds(0);
    setDisplaySeconds(0);
    setIsTimerRunning(false);
    setActivePumpingId(null);
    setManualDuration(null);
  };

  const handleSetManualDuration = (minutes: number) => {
    setManualDuration(minutes);
    setTimerActive(false);
    setAccumulatedSeconds(0);
    setDisplaySeconds(0);
    setIsTimerRunning(false);
    setActivePumpingId(null);
  };

  const maxAmount = amountUnit === "oz" ? 8 : 240;

  const handleSave = async () => {
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    // Calculate final duration
    let finalDuration: number | undefined;
    if (manualDuration !== null) {
      finalDuration = manualDuration * 60; // convert minutes to seconds
    } else if (timerActive) {
      finalDuration = accumulatedSeconds;
    }

    setSaving(true);
    try {
      const now = new Date();

      await completeActivePumping(babyId, {
        startTime,
        endTime: now,
        duration: finalDuration || 0,
        leftAmount: amountMode === "left_right" ? leftAmount : undefined,
        rightAmount: amountMode === "left_right" ? rightAmount : undefined,
        totalAmount:
          amountMode === "total" ? totalAmount : leftAmount + rightAmount,
        amountUnit,
        notes: notes || undefined,
      });

      toast.success("Pumping session saved!");
      router.push(`/baby/${babyId}`);
    } catch (error) {
      toast.error("Failed to save");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Add pumping</h1>
        <Button variant="ghost" size="icon"></Button>
      </div>

      {loadingSession ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading session...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Start Time - always shown for manual entry */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Start Time</span>
            <Input
              type="datetime-local"
              value={formatDateTimeLocal(startTime)}
              onChange={(e) => setStartTime(new Date(e.target.value))}
              className="w-auto bg-transparent border-0 text-right text-accent"
            />
          </div>

          {/* Duration Section */}
          <div className="py-3 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-muted-foreground">Duration</span>
                <span className="text-xs text-muted-foreground block">
                  optional
                </span>
              </div>

              {/* Timer display when active */}
              {timerActive && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xl font-bold text-accent">
                    {formatDuration(displaySeconds)}
                  </span>
                  {isTimerRunning ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePauseTimer}
                      className="h-10 w-10"
                    >
                      <Pause className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleResumeTimer}
                      className="h-10 w-10"
                    >
                      <Play className="h-5 w-5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDismissConfirm(true)}
                    className="h-10 w-10 text-muted-foreground hover:text-destructive"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Manual duration display */}
              {!timerActive && manualDuration !== null && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-medium text-accent">
                    {manualDuration} min
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setManualDuration(null)}
                    className="text-muted-foreground"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Controls when timer not started and no manual duration */}
            {!timerActive && manualDuration === null && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleStartTimer}
                  className="bg-cyan text-cyan-foreground hover:bg-cyan/90 flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Timer
                </Button>

                <span className="text-muted-foreground text-sm">or</span>

                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="number"
                    placeholder="Minutes"
                    min={1}
                    max={120}
                    className="w-24"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const value = parseInt(
                          (e.target as HTMLInputElement).value
                        );
                        if (value > 0) {
                          handleSetManualDuration(value);
                        }
                      }
                    }}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value > 0) {
                        handleSetManualDuration(value);
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
            )}

            {/* Quick duration buttons when no timer and no manual */}
            {!timerActive && manualDuration === null && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {[5, 10, 15, 20, 30].map((mins) => (
                  <Button
                    key={mins}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetManualDuration(mins)}
                    className="text-xs"
                  >
                    {mins} min
                  </Button>
                ))}
              </div>
            )}

            {/* Show timer is paused indicator */}
            {timerActive && !isTimerRunning && (
              <div className="text-sm text-amber-500 mt-2">Timer paused</div>
            )}

            {/* Show timer is running indicator */}
            {isTimerRunning && (
              <div className="text-sm text-green-500 mt-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Timer running
              </div>
            )}
          </div>

          {/* Amount Mode Toggle */}
          <div className="flex justify-center gap-2">
            <Button
              variant={amountMode === "total" ? "default" : "outline"}
              size="sm"
              onClick={() => setAmountMode("total")}
              className={cn(
                amountMode === "total" && "bg-cyan text-cyan-foreground"
              )}
            >
              total
            </Button>
            <Button
              variant={amountMode === "left_right" ? "default" : "outline"}
              size="sm"
              onClick={() => setAmountMode("left_right")}
              className={cn(
                amountMode === "left_right" && "bg-cyan text-cyan-foreground"
              )}
            >
              left/right
            </Button>
            <div className="w-4" />
            <Button
              variant={amountUnit === "oz" ? "default" : "outline"}
              size="sm"
              onClick={() => setAmountUnit("oz")}
              className={cn(
                amountUnit === "oz" && "bg-cyan text-cyan-foreground"
              )}
            >
              oz
            </Button>
            <Button
              variant={amountUnit === "ml" ? "default" : "outline"}
              size="sm"
              onClick={() => setAmountUnit("ml")}
              className={cn(
                amountUnit === "ml" && "bg-cyan text-cyan-foreground"
              )}
            >
              ml
            </Button>
          </div>

          {/* Amount Sliders */}
          {amountMode === "left_right" ? (
            <div className="space-y-6">
              {/* Left Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Left</span>
                  <span className="text-accent">
                    {leftAmount.toFixed(2)} {amountUnit}
                  </span>
                </div>
                <Slider
                  value={[leftAmount]}
                  onValueChange={([v]) => setLeftAmount(v)}
                  min={0}
                  max={maxAmount}
                  step={amountUnit === "oz" ? 0.25 : 5}
                  className="w-full [&>span:first-child]:bg-purple"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{maxAmount}</span>
                </div>
              </div>

              {/* Right Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Right</span>
                  <span className="text-accent">
                    {rightAmount.toFixed(2)} {amountUnit}
                  </span>
                </div>
                <Slider
                  value={[rightAmount]}
                  onValueChange={([v]) => setRightAmount(v)}
                  min={0}
                  max={maxAmount}
                  step={amountUnit === "oz" ? 0.25 : 5}
                  className="w-full [&>span:first-child]:bg-purple"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{maxAmount}</span>
                </div>
              </div>

              {/* Total Display */}
              <div className="text-center py-2 bg-secondary rounded-lg">
                <span className="text-sm text-muted-foreground">Total: </span>
                <span className="font-bold">
                  {(leftAmount + rightAmount).toFixed(2)} {amountUnit}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Amount</span>
                <span className="text-accent">
                  {totalAmount.toFixed(2)} {amountUnit}
                </span>
              </div>
              <Slider
                value={[totalAmount]}
                onValueChange={([v]) => setTotalAmount(v)}
                min={0}
                max={maxAmount * 2}
                step={amountUnit === "oz" ? 0.25 : 5}
                className="w-full [&>span:first-child]:bg-purple"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{maxAmount * 2}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="+ add note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {timerActive && (
              <Button
                variant="outline"
                className="flex-1 h-14 text-lg rounded-full"
                onClick={() => setShowDismissConfirm(true)}
                disabled={saving}
              >
                Dismiss
              </Button>
            )}
            <Button
              className={cn(
                "h-14 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90",
                timerActive ? "flex-1" : "w-full"
              )}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>

          {/* Dismiss Confirmation Dialog */}
          <Dialog
            open={showDismissConfirm}
            onOpenChange={setShowDismissConfirm}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dismiss session?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to dismiss this pumping session? All
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
                    handleResetTimer();
                  }}
                >
                  Dismiss
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
