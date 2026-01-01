"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import {
  TrackingContainer,
  TrackingHeader,
  TrackingContent,
  DateTimeRow,
  NotesInput,
  SaveButton,
} from "@/components/tracking/shared";
import { createActivity, updateActivity, deleteActivity } from "@/lib/actions/tracking";
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
  const entryId = params.entryId as string;

  const isEditMode = !!entryId && entryId !== 'new';

  const [startTime, setStartTime] = useState(new Date());
  const [activityType, setActivityType] = useState<ActivityType | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(isEditMode);

  // Load entry data if in edit mode
  useEffect(() => {
    async function loadEntry() {
      if (!isEditMode) return;

      setLoadingEntry(true);
      try {
        const { getTimelineEntries } = await import("@/lib/actions/tracking");
        const entries = await getTimelineEntries(babyId, '7d');
        const entry = entries.find(e => e.id === entryId);

        if (entry && entry.entryType === 'activity') {
          setStartTime(new Date(entry.startTime));
          setActivityType(entry.type);
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
      if (isEditMode) {
        await updateActivity(entryId, babyId, {
          startTime,
          type: activityType,
          notes: notes || undefined,
        });
        toast.success("Activity updated!");
      } else {
        await createActivity({
          babyId,
          startTime,
          type: activityType,
          notes: notes || undefined,
        });
        toast.success("Activity logged!");
      }
      router.push(`/baby/${babyId}`);
    } catch (error) {
      toast.error("Failed to save");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;

    try {
      await deleteActivity(entryId, babyId);
      toast.success("Activity deleted!");
      router.push(`/baby/${babyId}`);
    } catch (error) {
      toast.error("Failed to delete");
      console.error(error);
    }
  };

  const handleCancel = () => {
    router.push(`/baby/${babyId}`);
  };

  if (loadingEntry) {
    return (
      <TrackingContainer>
        <TrackingHeader title={isEditMode ? "Edit activity" : "Add activity"} />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading entry...</div>
        </div>
      </TrackingContainer>
    );
  }

  return (
    <TrackingContainer>
      <TrackingHeader title={isEditMode ? "Edit activity" : "Activity"} />
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
              onClick={handleSave}
              disabled={saving || !activityType}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <SaveButton
            onClick={handleSave}
            saving={saving}
            disabled={!activityType}
          />
        )}
      </TrackingContent>
    </TrackingContainer>
  );
}

