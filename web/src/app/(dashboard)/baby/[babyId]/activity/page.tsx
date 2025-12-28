"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Bath,
  Baby,
  BookOpen,
  Monitor,
  Heart,
  Gamepad2,
  Sun,
  MoreHorizontal,
} from "lucide-react";
import {
  TrackingContainer,
  TrackingHeader,
  TrackingContent,
  DateTimeRow,
  NotesInput,
  SaveButton,
} from "@/components/tracking/shared";
import { createActivity } from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";

type ActivityType =
  | "bath"
  | "tummy_time"
  | "story_time"
  | "screen_time"
  | "skin_to_skin"
  | "play"
  | "outdoor"
  | "other";

const activityOptions = [
  { value: "bath", label: "Bath", icon: Bath, color: "text-cyan" },
  { value: "tummy_time", label: "Tummy time", icon: Baby, color: "text-coral" },
  {
    value: "story_time",
    label: "Story time",
    icon: BookOpen,
    color: "text-yellow",
  },
  {
    value: "screen_time",
    label: "Screen time",
    icon: Monitor,
    color: "text-purple",
  },
  {
    value: "skin_to_skin",
    label: "Skin to skin",
    icon: Heart,
    color: "text-pink",
  },
  { value: "play", label: "Play", icon: Gamepad2, color: "text-primary" },
  { value: "outdoor", label: "Outdoor", icon: Sun, color: "text-yellow" },
  {
    value: "other",
    label: "Other",
    icon: MoreHorizontal,
    color: "text-muted-foreground",
  },
];

export default function ActivityPage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;

  const [startTime, setStartTime] = useState(new Date());
  const [activityType, setActivityType] = useState<ActivityType | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    if (!activityType) {
      toast.error("Please select an activity");
      return;
    }

    setSaving(true);
    try {
      await createActivity({
        babyId,
        startTime,
        type: activityType,
        notes: notes || undefined,
      });
      toast.success("Activity logged!");
      router.push(`/baby/${babyId}`);
    } catch (error) {
      toast.error("Failed to save");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TrackingContainer>
      <TrackingHeader title="Add activity" />
      <TrackingContent>
        <DateTimeRow
          label="Start Time"
          value={startTime}
          onChange={setStartTime}
        />

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

        <NotesInput value={notes} onChange={setNotes} />
        <SaveButton
          onClick={handleSave}
          saving={saving}
          disabled={!activityType}
        />
      </TrackingContent>
    </TrackingContainer>
  );
}
