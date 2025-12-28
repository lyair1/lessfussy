"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { X, Clock, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFeeding, getLastFeeding } from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";

type FeedingTab = "nursing" | "bottle";
type NursingSide = "left" | "right";
type BottleContent = "breast_milk" | "formula";

// Format date for datetime-local input (local timezone, not UTC)
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function FeedingPage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;

  // Tab state
  const [activeTab, setActiveTab] = useState<FeedingTab>("nursing");

  // Nursing state
  const [lastSide, setLastSide] = useState<NursingSide | null>(null);
  const [activeSide, setActiveSide] = useState<NursingSide | null>(null);
  const [leftDuration, setLeftDuration] = useState(0);
  const [rightDuration, setRightDuration] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [nursingStartTime, setNursingStartTime] = useState<Date | null>(null);

  // Bottle state
  const [bottleContent, setBottleContent] = useState<BottleContent>("breast_milk");
  const [amountUnit, setAmountUnit] = useState<"oz" | "ml">("oz");
  const [amount, setAmount] = useState(4);
  const [bottleStartTime, setBottleStartTime] = useState(new Date());
  const [notes, setNotes] = useState("");

  // Loading state
  const [saving, setSaving] = useState(false);

  // Fetch last feeding to determine last side
  useEffect(() => {
    async function fetchLastFeeding() {
      if (!babyId) return;
      try {
        const last = await getLastFeeding(babyId);
        if (last?.side && last.side !== "both") {
          setLastSide(last.side as NursingSide);
        }
      } catch (error) {
        console.error(error);
      }
    }
    fetchLastFeeding();
  }, [babyId]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && activeSide) {
      interval = setInterval(() => {
        if (activeSide === "left") {
          setLeftDuration((d) => d + 1);
        } else {
          setRightDuration((d) => d + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeSide]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSidePress = (side: NursingSide) => {
    if (activeSide === side && isTimerRunning) {
      // Pause current side
      setIsTimerRunning(false);
    } else if (activeSide === side && !isTimerRunning) {
      // Resume current side
      setIsTimerRunning(true);
    } else {
      // Switch to new side or start
      if (!nursingStartTime) {
        setNursingStartTime(new Date());
      }
      setActiveSide(side);
      setIsTimerRunning(true);
    }
  };

  const resetNursing = () => {
    setActiveSide(null);
    setLeftDuration(0);
    setRightDuration(0);
    setIsTimerRunning(false);
    setNursingStartTime(null);
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

    setSaving(true);
    try {
      let side: "left" | "right" | "both" = "both";
      if (leftDuration > 0 && rightDuration === 0) side = "left";
      if (rightDuration > 0 && leftDuration === 0) side = "right";

      await createFeeding({
        babyId,
        type: "nursing",
        startTime: nursingStartTime || new Date(),
        endTime: new Date(),
        side,
        leftDuration,
        rightDuration,
        notes: notes || undefined,
      });

      toast.success("Nursing session saved!");
      router.push(`/baby/${babyId}`);
    } catch (error) {
      toast.error("Failed to save");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBottle = async () => {
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    setSaving(true);
    try {
      await createFeeding({
        babyId,
        type: "bottle",
        startTime: bottleStartTime,
        bottleContent,
        amount,
        amountUnit,
        notes: notes || undefined,
      });

      toast.success("Bottle feeding saved!");
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
        <h1 className="text-xl font-bold">Add feeding</h1>
        <Button variant="ghost" size="icon">
          <Clock className="h-5 w-5" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as FeedingTab)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger
            value="nursing"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Nursing
          </TabsTrigger>
          <TabsTrigger
            value="bottle"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Bottle
          </TabsTrigger>
        </TabsList>

        {/* Nursing Tab */}
        <TabsContent value="nursing" className="space-y-6">
          {/* Start Time - shown once nursing has started */}
          {nursingStartTime && (
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Start Time</span>
              <Input
                type="datetime-local"
                value={formatDateTimeLocal(nursingStartTime)}
                onChange={(e) => {
                  const newStartTime = new Date(e.target.value);
                  const oldStartTime = nursingStartTime;
                  // Calculate the difference in seconds
                  const diffSeconds = Math.floor(
                    (oldStartTime.getTime() - newStartTime.getTime()) / 1000
                  );
                  // Adjust the active side's duration (or left if none active)
                  if (diffSeconds !== 0) {
                    if (activeSide === "right") {
                      setRightDuration((d) => Math.max(0, d + diffSeconds));
                    } else {
                      setLeftDuration((d) => Math.max(0, d + diffSeconds));
                    }
                  }
                  setNursingStartTime(newStartTime);
                }}
                className="w-auto bg-transparent border-0 text-right text-accent"
              />
            </div>
          )}

          {/* Timer Display */}
          {(leftDuration > 0 || rightDuration > 0 || isTimerRunning) && (
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
                      {formatDuration(side === "left" ? leftDuration : rightDuration)}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Duration Distribution Slider */}
          {(leftDuration > 0 || rightDuration > 0) && (
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

          {/* Reset button */}
          {(leftDuration > 0 || rightDuration > 0) && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetNursing}
                className="text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Add notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Save Button */}
          <Button
            className="w-full h-14 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSaveNursing}
            disabled={saving || (leftDuration === 0 && rightDuration === 0)}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </TabsContent>

        {/* Bottle Tab */}
        <TabsContent value="bottle" className="space-y-6">
          {/* Start Time */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Start Time</span>
            <Input
              type="datetime-local"
              value={formatDateTimeLocal(bottleStartTime)}
              onChange={(e) => setBottleStartTime(new Date(e.target.value))}
              className="w-auto bg-transparent border-0 text-right text-accent"
            />
          </div>

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
                onClick={() => setAmountUnit(unit)}
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
              <span className="text-muted-foreground">Amount (optional)</span>
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="bottle-notes">Notes (optional)</Label>
            <Input
              id="bottle-notes"
              placeholder="Add notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Save Button */}
          <Button
            className="w-full h-14 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSaveBottle}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

