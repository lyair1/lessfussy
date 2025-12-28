"use client";

import { useState } from "react";
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
import { createMedicine } from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";

type MedicineUnit = "oz" | "ml" | "drops" | "tsp";

const unitOptions: MedicineUnit[] = ["oz", "ml", "drops", "tsp"];

export default function MedicinePage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;

  const [time, setTime] = useState(new Date());
  const [medicineName, setMedicineName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [unit, setUnit] = useState<MedicineUnit>("ml");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    setSaving(true);
    try {
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
    } catch (error) {
      toast.error("Failed to save");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TrackingContainer>
      <TrackingHeader title="Medicine" />
      <TrackingContent>
        <DateTimeRow label="Start time:" value={time} onChange={setTime} />

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
        <SaveButton onClick={handleSave} saving={saving} />
      </TrackingContent>
    </TrackingContainer>
  );
}
