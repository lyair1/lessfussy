"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Clock, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBaby } from "@/components/layout/dashboard-shell";
import { createMedicine } from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";

type MedicineUnit = "oz" | "ml" | "drops" | "tsp";

const unitOptions: MedicineUnit[] = ["oz", "ml", "drops", "tsp"];

export default function MedicinePage() {
  const router = useRouter();
  const { selectedBaby } = useBaby();

  const [time, setTime] = useState(new Date());
  const [medicineName, setMedicineName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [unit, setUnit] = useState<MedicineUnit>("ml");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedBaby) {
      toast.error("Please select a baby first");
      return;
    }

    setSaving(true);
    try {
      await createMedicine({
        babyId: selectedBaby.id,
        time,
        name: medicineName || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        unit: amount ? unit : undefined,
        notes: notes || undefined,
      });
      toast.success("Medicine logged!");
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
        <h1 className="text-xl font-bold">Medicine</h1>
        <Button variant="ghost" size="icon">
          <Clock className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Start Time */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Start time:</span>
          <Input
            type="datetime-local"
            value={time.toISOString().slice(0, 16)}
            onChange={(e) => setTime(new Date(e.target.value))}
            className="w-auto bg-transparent border-0 text-right text-accent"
          />
        </div>

        {/* Medicine Type */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Type:</span>
          <Input
            placeholder="Not Set"
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
            className="w-48 bg-transparent border-0 text-right text-accent placeholder:text-accent"
          />
        </div>

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

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input
            id="notes"
            placeholder="Add notes (optional)"
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

