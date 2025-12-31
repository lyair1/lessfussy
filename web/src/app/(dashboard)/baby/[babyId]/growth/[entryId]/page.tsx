"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  TrackingContainer,
  TrackingHeader,
  TrackingContent,
  DateTimeRow,
  NotesInput,
  SaveButton,
  LabeledRow,
} from "@/components/tracking/shared";
import { createGrowthLog, updateGrowthLog, deleteGrowthLog } from "@/lib/actions/tracking";
import { formatDateLocal } from "@/lib/utils";

export default function GrowthPage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;
  const entryId = params.entryId as string;

  const isEditMode = !!entryId && entryId !== 'new';

  const [dateTime, setDateTime] = useState(new Date());
  const [weight, setWeight] = useState<string>("");
  const [weightUnit, setWeightUnit] = useState<"lb" | "kg">("lb");
  const [height, setHeight] = useState<string>("");
  const [heightUnit, setHeightUnit] = useState<"in" | "cm">("in");
  const [headCircumference, setHeadCircumference] = useState<string>("");
  const [headUnit, setHeadUnit] = useState<"in" | "cm">("in");
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

        if (entry && entry.entryType === 'growth') {
          setDateTime(new Date(entry.time));
          setWeight(entry.weight?.toString() || "");
          setWeightUnit((entry.weightUnit as "lb" | "kg") || "lb");
          setHeight(entry.height?.toString() || "");
          setHeightUnit((entry.heightUnit as "in" | "cm") || "in");
          setHeadCircumference(entry.headCircumference?.toString() || "");
          setHeadUnit((entry.headUnit as "in" | "cm") || "in");
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

    if (!weight && !height && !headCircumference) {
      toast.error("Please enter at least one measurement");
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        await updateGrowthLog(entryId, babyId, {
          date: formatDateLocal(dateTime),
          time: dateTime,
          weight: weight ? parseFloat(weight) : undefined,
          weightUnit: weight ? weightUnit : undefined,
          height: height ? parseFloat(height) : undefined,
          heightUnit: height ? heightUnit : undefined,
          headCircumference: headCircumference
            ? parseFloat(headCircumference)
            : undefined,
          headUnit: headCircumference ? headUnit : undefined,
          notes: notes || undefined,
        });
        toast.success("Growth data updated!");
      } else {
        await createGrowthLog({
          babyId,
          date: formatDateLocal(dateTime),
          time: dateTime,
          weight: weight ? parseFloat(weight) : undefined,
          weightUnit: weight ? weightUnit : undefined,
          height: height ? parseFloat(height) : undefined,
          heightUnit: height ? heightUnit : undefined,
          headCircumference: headCircumference
            ? parseFloat(headCircumference)
            : undefined,
          headUnit: headCircumference ? headUnit : undefined,
          notes: notes || undefined,
        });
        toast.success("Growth data saved!");
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
      await deleteGrowthLog(entryId, babyId);
      toast.success("Growth data deleted!");
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
        <TrackingHeader title={isEditMode ? "Edit growth data" : "Add growth data"} />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading entry...</div>
        </div>
      </TrackingContainer>
    );
  }

  return (
    <TrackingContainer>
      <TrackingHeader title={isEditMode ? "Edit growth data" : "Growth"} />
      <TrackingContent>
        <DateTimeRow
          label="Date & Time:"
          value={dateTime}
          onChange={setDateTime}
        />

        {/* Height */}
        <LabeledRow label="Height:">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder="Set"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-20 bg-transparent border-0 text-right text-accent placeholder:text-accent"
            />
            <select
              value={heightUnit}
              onChange={(e) => setHeightUnit(e.target.value as "in" | "cm")}
              className="bg-transparent text-accent border-0 outline-none"
            >
              <option value="in">in</option>
              <option value="cm">cm</option>
            </select>
          </div>
        </LabeledRow>

        {/* Weight */}
        <LabeledRow label="Weight:">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder="Set"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-20 bg-transparent border-0 text-right text-accent placeholder:text-accent"
            />
            <select
              value={weightUnit}
              onChange={(e) => setWeightUnit(e.target.value as "lb" | "kg")}
              className="bg-transparent text-accent border-0 outline-none"
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </LabeledRow>

        {/* Head Circumference */}
        <LabeledRow label="Head circumference:">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder="Set"
              value={headCircumference}
              onChange={(e) => setHeadCircumference(e.target.value)}
              className="w-20 bg-transparent border-0 text-right text-accent placeholder:text-accent"
            />
            <select
              value={headUnit}
              onChange={(e) => setHeadUnit(e.target.value as "in" | "cm")}
              className="bg-transparent text-accent border-0 outline-none"
            >
              <option value="in">in</option>
              <option value="cm">cm</option>
            </select>
          </div>
        </LabeledRow>

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
              disabled={saving || (!weight && !height && !headCircumference)}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <SaveButton
            onClick={handleSave}
            saving={saving}
            disabled={!weight && !height && !headCircumference}
          />
        )}
      </TrackingContent>
    </TrackingContainer>
  );
}
