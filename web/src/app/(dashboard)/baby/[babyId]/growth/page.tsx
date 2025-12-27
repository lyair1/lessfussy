"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGrowthLog } from "@/lib/actions/tracking";

export default function GrowthPage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );
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
        date,
        time: new Date(`${date}T${time}`),
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
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Add growth data</h1>
        <div className="w-10" />
      </div>

      <div className="space-y-6">
        {/* Date */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Date:</span>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto bg-transparent border-0 text-right text-accent"
          />
        </div>

        {/* Time */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Time:</span>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-auto bg-transparent border-0 text-right text-accent"
          />
        </div>

        {/* Height */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Height:</span>
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
        </div>

        {/* Weight */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Weight:</span>
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
        </div>

        {/* Head Circumference */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Head circumference:</span>
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
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

