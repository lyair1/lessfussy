"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Bath, Baby, BookOpen, Monitor, Heart, Gamepad2, Sun, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBaby } from "@/components/layout/dashboard-shell";
import { createActivity } from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";

type ActivityType = "bath" | "tummy_time" | "story_time" | "screen_time" | "skin_to_skin" | "play" | "outdoor" | "other";

const activityOptions = [
  { value: "bath", label: "Bath", icon: Bath, color: "text-cyan" },
  { value: "tummy_time", label: "Tummy time", icon: Baby, color: "text-coral" },
  { value: "story_time", label: "Story time", icon: BookOpen, color: "text-yellow" },
  { value: "screen_time", label: "Screen time", icon: Monitor, color: "text-purple" },
  { value: "skin_to_skin", label: "Skin to skin", icon: Heart, color: "text-pink" },
  { value: "play", label: "Play", icon: Gamepad2, color: "text-primary" },
  { value: "outdoor", label: "Outdoor", icon: Sun, color: "text-yellow" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "text-muted-foreground" },
];

export default function ActivityPage() {
  const router = useRouter();
  const { selectedBaby } = useBaby();

  const [startTime, setStartTime] = useState(new Date());
  const [activityType, setActivityType] = useState<ActivityType | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedBaby) {
      toast.error("Please select a baby first");
      return;
    }

    if (!activityType) {
      toast.error("Please select an activity");
      return;
    }

    setSaving(true);
    try {
      await createActivity({
        babyId: selectedBaby.id,
        startTime,
        type: activityType,
        notes: notes || undefined,
      });
      toast.success("Activity logged!");
      router.push("/");
    } catch (error) {
      toast.error("Failed to save");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!selectedBaby) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Please select a baby first</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Add activity</h1>
        <div className="w-10" />
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

        {/* Activity Selection */}
        <div className="grid grid-cols-4 gap-3 py-4">
          {activityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActivityType(opt.value as ActivityType)}
              className={cn(
                "aspect-square rounded-full flex flex-col items-center justify-center gap-1 transition-all p-2",
                "border-2",
                activityType === opt.value
                  ? "bg-secondary border-accent"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <opt.icon className={cn("h-6 w-6 sm:h-8 sm:w-8", opt.color)} />
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                {opt.label}
              </span>
            </button>
          ))}
        </div>

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
          onClick={handleSave}
          disabled={saving || !activityType}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

