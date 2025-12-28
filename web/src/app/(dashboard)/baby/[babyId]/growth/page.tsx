"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
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
import { createGrowthLog } from "@/lib/actions/tracking";
import { formatDateLocal } from "@/lib/utils";

export default function GrowthPage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;

  const [dateTime, setDateTime] = useState(new Date());
  const [weight, setWeight] = useState<string>("");
  const [weightUnit, setWeightUnit] = useState<"lb" | "kg">("lb");
  const [height, setHeight] = useState<string>("");
  const [heightUnit, setHeightUnit] = useState<"in" | "cm">("in");
  const [headCircumference, setHeadCircumference] = useState<string>("");
  const [headUnit, setHeadUnit] = useState<"in" | "cm">("in");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

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
      <TrackingHeader title="Add growth data" />
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
        <SaveButton onClick={handleSave} saving={saving} />
      </TrackingContent>
    </TrackingContainer>
  );
}
