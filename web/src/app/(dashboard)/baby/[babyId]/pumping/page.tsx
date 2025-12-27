"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { X, Clock, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPumping } from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";

type AmountMode = "total" | "left_right";

export default function PumpingPage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;

  const [startTime, setStartTime] = useState(new Date());
  const [duration, setDuration] = useState<number | null>(null);
  const [amountMode, setAmountMode] = useState<AmountMode>("left_right");
  const [amountUnit, setAmountUnit] = useState<"oz" | "ml">("oz");
  const [leftAmount, setLeftAmount] = useState(3);
  const [rightAmount, setRightAmount] = useState(3);
  const [totalAmount, setTotalAmount] = useState(6);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Timer state
  const [isTimerMode, setIsTimerMode] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const maxAmount = amountUnit === "oz" ? 8 : 240;

  const handleSave = async () => {
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    setSaving(true);
    try {
      const data = {
        babyId,
        startTime,
        duration: isTimerMode ? elapsedSeconds : duration || undefined,
        leftAmount: amountMode === "left_right" ? leftAmount : undefined,
        rightAmount: amountMode === "left_right" ? rightAmount : undefined,
        totalAmount:
          amountMode === "total"
            ? totalAmount
            : leftAmount + rightAmount,
        amountUnit,
        notes: notes || undefined,
      };

      await createPumping(data);
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
        <Button variant="ghost" size="icon">
          <Clock className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Start Time */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Start Time</span>
          <Input
            type="datetime-local"
            value={startTime.toISOString().slice(0, 16)}
            onChange={(e) => setStartTime(new Date(e.target.value))}
            className="w-auto bg-transparent border-0 text-right text-accent"
          />
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <span className="text-xs text-muted-foreground block">optional</span>
          </div>
          {isTimerMode ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg">
                {formatDuration(elapsedSeconds)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              >
                {isTimerRunning ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <span className="text-accent">Set time</span>
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

        {/* Timer Toggle */}
        <div className="text-center">
          <Button
            variant="link"
            className="text-accent"
            onClick={() => {
              setIsTimerMode(!isTimerMode);
              setElapsedSeconds(0);
              setIsTimerRunning(false);
            }}
          >
            {isTimerMode ? "Switch to manual entry" : "Switch to timer"}
          </Button>
        </div>

        {/* Save Button */}
        <Button
          className="w-full h-14 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

