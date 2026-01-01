"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrackingContainer,
  TrackingHeader,
  TrackingContent,
  DateTimeRow,
  NotesInput,
  SaveButton,
  LabeledRow,
} from "@/components/tracking/shared";
import { createMedicine, updateMedicine, deleteMedicine } from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";

type MedicineUnit = "oz" | "ml" | "drops" | "tsp";

const unitOptions: MedicineUnit[] = ["oz", "ml", "drops", "tsp"];

export default function MedicinePage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;
  const entryId = params.entryId as string;

  const isEditMode = !!entryId && entryId !== 'new';

  const [time, setTime] = useState(new Date());
  const [medicineName, setMedicineName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [unit, setUnit] = useState<MedicineUnit>("ml");
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

        if (entry && entry.entryType === 'medicine') {
          setTime(new Date(entry.time));
          setMedicineName(entry.name || "");
          setAmount(entry.amount?.toString() || "");
          setUnit(entry.unit || "ml");
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

    setSaving(true);
    try {
      if (isEditMode) {
        // Update existing entry
        await updateMedicine(entryId, babyId, {
          time,
          name: medicineName || undefined,
          amount: amount ? parseFloat(amount) : undefined,
          unit: amount ? unit : undefined,
          notes: notes || undefined,
        });
        toast.success("Medicine updated!");
        router.push(`/baby/${babyId}`);
      } else {
        await createMedicine({
          babyId,
          time,
          name: medicineName || undefined,
          amount: amount ? parseFloat(amount) : undefined,
          unit: amount ? unit : undefined,
          notes: notes || undefined,
        });
        toast.success("Medicine logged!");
        router.push(`/baby/${babyId}`);
      }
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
      await deleteMedicine(entryId, babyId);
      toast.success("Medicine deleted!");
      router.push(`/baby/${babyId}`);
    } catch (error) {
      toast.error("Failed to delete medicine");
      console.error(error);
    }
  };

  const handleCancel = () => {
    router.push(`/baby/${babyId}`);
  };

  if (loadingEntry) {
    return (
      <TrackingContainer>
        <TrackingHeader title={isEditMode ? "Edit medicine" : "Medicine"} />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading entry...</div>
        </div>
      </TrackingContainer>
    );
  }

  return (
    <TrackingContainer>
      <TrackingHeader title={isEditMode ? "Edit medicine" : "Medicine"} />
      <TrackingContent>
        <DateTimeRow label="Time:" value={time} onChange={setTime} />

        {/* Medicine Type */}
        <LabeledRow label="Type:">
          <Input
            placeholder="Not Set"
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
            className="w-48 bg-transparent border-0 text-right text-accent placeholder:text-accent"
          />
        </LabeledRow>

        {/* Amount Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Amount</span>
            <div className="flex gap-1">
              {unitOptions.map((u) => (
                <Button
                  key={u}
                  variant={unit === u ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUnit(u)}
                  className={cn(
                    "px-3",
                    unit === u && "bg-secondary text-secondary-foreground"
                  )}
                >
                  {u}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Input
              type="number"
              step="0.1"
              placeholder="Add amount (optional)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <NotesInput
          value={notes}
          onChange={setNotes}
          placeholder="Add notes (optional)"
        />

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
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <SaveButton onClick={handleSave} saving={saving} />
        )}
      </TrackingContent>
    </TrackingContainer>
  );
}

