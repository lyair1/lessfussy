"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  TrackingContainer,
  TrackingHeader,
  TrackingContent,
  DateTimeRow,
  NotesInput,
  SaveButton,
} from "@/components/tracking/shared";
import { createTemperature, updateTemperature, deleteTemperature } from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";

export default function TemperaturePage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;
  const entryId = params.entryId as string;

  const isEditMode = !!entryId && entryId !== 'new';

  const [time, setTime] = useState(new Date());
  const [unit, setUnit] = useState<"F" | "C">("F");
  const [temperature, setTemperature] = useState(98.6);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(isEditMode);

  // Temperature ranges
  const minTemp = unit === "F" ? 93 : 34;
  const maxTemp = unit === "F" ? 105 : 41;

  // Load entry data if in edit mode
  useEffect(() => {
    async function loadEntry() {
      if (!isEditMode) return;

      setLoadingEntry(true);
      try {
        const { getTimelineEntries } = await import("@/lib/actions/tracking");
        const entries = await getTimelineEntries(babyId, '7d');
        const entry = entries.find(e => e.id === entryId);

        if (entry && entry.entryType === 'temperature') {
          setTime(new Date(entry.time));
          setTemperature(entry.value);
          setUnit(entry.unit as "F" | "C");
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

  // Convert temperature when switching units
  const handleUnitChange = (newUnit: "F" | "C") => {
    if (newUnit === unit) return;

    if (newUnit === "C") {
      setTemperature(Math.round((((temperature - 32) * 5) / 9) * 10) / 10);
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
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        await updateTemperature(entryId, babyId, {
          time,
          value: temperature,
          unit,
          notes: notes || undefined,
        });
        toast.success("Temperature updated!");
      } else {
        await createTemperature({
          babyId,
          time,
          value: temperature,
          unit,
          notes: notes || undefined,
        });
        toast.success("Temperature logged!");
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
      await deleteTemperature(entryId, babyId);
      toast.success("Temperature deleted!");
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
        <TrackingHeader title={isEditMode ? "Edit temperature" : "Add temperature"} />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading entry...</div>
        </div>
      </TrackingContainer>
    );
  }

  return (
    <TrackingContainer>
      <TrackingHeader title={isEditMode ? "Edit temperature" : "Temperature"} />
      <TrackingContent>
        <DateTimeRow label="Time:" value={time} onChange={setTime} />

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
              {tempMarks
                .filter((_, i) => i % 2 === 0)
                .map((t) => (
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
                  height: `${
                    ((temperature - minTemp) / (maxTemp - minTemp)) * 100
                  }%`,
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
                  bottom: `calc(${
                    ((temperature - minTemp) / (maxTemp - minTemp)) * 100
                  }% - 8px)`,
                }}
              />
            </div>

            {/* Tick marks */}
            <div className="ml-2 h-80 flex flex-col justify-between py-2">
              {tempMarks.map((t) => (
                <div key={t} className="w-3 h-px bg-muted-foreground/30" />
              ))}
            </div>
          </div>
        </div>

        <NotesInput
          value={notes}
          onChange={setNotes}
          label="Notes"
          placeholder="+ add note"
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

