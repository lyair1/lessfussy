"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBaby } from "@/components/layout/dashboard-shell";
import { createTemperature } from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";

export default function TemperaturePage() {
  const router = useRouter();
  const { selectedBaby } = useBaby();

  const [time, setTime] = useState(new Date());
  const [unit, setUnit] = useState<"F" | "C">("F");
  const [temperature, setTemperature] = useState(98.6);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Temperature ranges
  const minTemp = unit === "F" ? 93 : 34;
  const maxTemp = unit === "F" ? 105 : 41;
  const normalTemp = unit === "F" ? 98.6 : 37;

  // Convert temperature when switching units
  const handleUnitChange = (newUnit: "F" | "C") => {
    if (newUnit === unit) return;
    
    if (newUnit === "C") {
      setTemperature(Math.round(((temperature - 32) * 5) / 9 * 10) / 10);
    } else {
      setTemperature(Math.round((temperature * 9) / 5 + 32 * 10) / 10);
    }
    setUnit(newUnit);
  };

  // Temperature color based on fever threshold
  const getTempColor = () => {
    const feverThreshold = unit === "F" ? 100.4 : 38;
    if (temperature >= feverThreshold) return "text-destructive";
    return "text-cyan";
  };

  // Generate temperature marks for the thermometer
  const tempMarks = [];
  for (let t = maxTemp; t >= minTemp; t--) {
    tempMarks.push(t);
  }

  const handleSave = async () => {
    if (!selectedBaby) {
      toast.error("Please select a baby first");
      return;
    }

    setSaving(true);
    try {
      await createTemperature({
        babyId: selectedBaby.id,
        time,
        value: temperature,
        unit,
        notes: notes || undefined,
      });
      toast.success("Temperature logged!");
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
        <h1 className="text-xl font-bold">Temperature</h1>
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5" />
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

        {/* Unit Toggle */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Temperature</span>
          <div className="flex gap-1">
            <Button
              variant={unit === "C" ? "default" : "outline"}
              size="sm"
              onClick={() => handleUnitChange("C")}
              className={cn(
                "px-4",
                unit === "C" && "bg-cyan text-cyan-foreground"
              )}
            >
              °C
            </Button>
            <Button
              variant={unit === "F" ? "default" : "outline"}
              size="sm"
              onClick={() => handleUnitChange("F")}
              className={cn(
                "px-4",
                unit === "F" && "bg-cyan text-cyan-foreground"
              )}
            >
              °F
            </Button>
          </div>
        </div>

        {/* Thermometer Display */}
        <div className="flex items-center justify-center gap-8 py-4">
          {/* Current Temperature Badge */}
          <div
            className={cn(
              "px-4 py-2 rounded-lg font-bold text-xl",
              getTempColor(),
              "bg-cyan/20"
            )}
          >
            {temperature.toFixed(1)} °{unit}
          </div>

          {/* Thermometer */}
          <div className="relative flex items-center">
            {/* Temperature Scale */}
            <div className="flex flex-col items-end mr-2 text-sm text-muted-foreground">
              {tempMarks.filter((_, i) => i % 2 === 0).map((t) => (
                <div key={t} className="h-6 flex items-center">
                  {t}
                </div>
              ))}
            </div>

            {/* Thermometer Bar */}
            <div className="relative w-8 h-80 rounded-full bg-muted overflow-hidden">
              {/* Mercury fill */}
              <div
                className="absolute bottom-0 left-0 right-0 rounded-b-full transition-all duration-200"
                style={{
                  height: `${((temperature - minTemp) / (maxTemp - minTemp)) * 100}%`,
                  background: `linear-gradient(to top, #ef4444 0%, #f97316 30%, #ffffff 60%, #ffffff 100%)`,
                }}
              />

              {/* Slider Handle */}
              <input
                type="range"
                min={minTemp}
                max={maxTemp}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ writingMode: "vertical-lr", direction: "rtl" }}
              />

              {/* Handle indicator */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-muted-foreground shadow-lg pointer-events-none transition-all duration-200"
                style={{
                  bottom: `calc(${((temperature - minTemp) / (maxTemp - minTemp)) * 100}% - 8px)`,
                }}
              />
            </div>

            {/* Tick marks */}
            <div className="ml-2 h-80 flex flex-col justify-between py-2">
              {tempMarks.map((t) => (
                <div
                  key={t}
                  className="w-3 h-px bg-muted-foreground/30"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            placeholder="+ add note"
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

