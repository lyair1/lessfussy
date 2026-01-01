"use client";

import { useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Droplet,
  Cloud,
  CloudRain,
  CircleDashed,
  Toilet,
  AlertTriangle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  TrackingContainer,
  TrackingHeader,
  TrackingContent,
  DateTimeRow,
  NotesInput,
  SaveButton,
} from "@/components/tracking/shared";
import { createDiaper, updateDiaper, deleteDiaper, createPottyLog, updatePottyLog, deletePottyLog } from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";

type DiaperType = "pee" | "poo" | "mixed" | "dry";
type PottyType = "sat_but_dry" | "success" | "accident";

const diaperOptions = [
  { value: "pee", label: "Pee", icon: Droplet, color: "text-cyan" },
  { value: "poo", label: "Poo", icon: Cloud, color: "text-yellow" },
  { value: "mixed", label: "Mixed", icon: CloudRain, color: "text-coral" },
  { value: "dry", label: "Dry", icon: CircleDashed, color: "text-muted-foreground" },
];

const pottyOptions = [
  { value: "sat_but_dry", label: "Sat but dry", icon: CircleDashed, color: "text-muted-foreground" },
  { value: "success", label: "Potty", icon: Toilet, color: "text-primary" },
  { value: "accident", label: "Accident", icon: AlertTriangle, color: "text-coral" },
];

interface DiaperPageProps {
  editEntry?: any;
  onSave?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

export default function DiaperPage({
  editEntry,
  onSave,
  onDelete,
  onClose
}: DiaperPageProps = {}) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const babyId = params.babyId as string;

  const initialTab = editEntry?.entryType === "potty" ? "potty" : "diaper";
  const [activeTab, setActiveTab] = useState<"diaper" | "potty">(initialTab);
  const [time, setTime] = useState(editEntry?.time ? new Date(editEntry.time) : new Date());
  const [diaperType, setDiaperType] = useState<DiaperType | null>(
    editEntry?.type || null
  );
  const [pottyType, setPottyType] = useState<PottyType | null>(
    editEntry?.type || null
  );
  const [notes, setNotes] = useState(editEntry?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    if (activeTab === "diaper" && !diaperType) {
      toast.error("Please select a diaper type");
      return;
    }

    if (activeTab === "potty" && !pottyType) {
      toast.error("Please select a potty type");
      return;
    }

    setSaving(true);
    try {
      if (editEntry) {
        // Update existing entry
        if (activeTab === "diaper") {
          await updateDiaper(editEntry.id, babyId, {
            time,
            type: diaperType!,
            notes: notes || undefined,
          });
          toast.success("Diaper updated!");
        } else {
          await updatePottyLog(editEntry.id, babyId, {
            time,
            type: pottyType!,
            notes: notes || undefined,
          });
          toast.success("Potty updated!");
        }
        onSave?.();
      } else {
        // Create new entry
        if (activeTab === "diaper") {
          await createDiaper({
            babyId,
            time,
            type: diaperType!,
            notes: notes || undefined,
          });
          toast.success("Diaper logged!");
        } else {
          await createPottyLog({
            babyId,
            time,
            type: pottyType!,
            notes: notes || undefined,
          });
          toast.success("Potty logged!");
        }
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
    if (!editEntry) return;

    try {
      if (editEntry.entryType === "diaper") {
        await deleteDiaper(editEntry.id, babyId);
        toast.success("Diaper deleted!");
      } else {
        await deletePottyLog(editEntry.id, babyId);
        toast.success("Potty deleted!");
      }
      onDelete?.();
    } catch (error) {
      toast.error("Failed to delete");
      console.error(error);
    }
  };

  return (
    <TrackingContainer>
      <TrackingHeader title={`${editEntry ? "Edit" : "Add"} ${activeTab === "diaper" ? "diaper" : "potty"}`} />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger
            value="diaper"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Diaper
          </TabsTrigger>
          <TabsTrigger
            value="potty"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Potty
          </TabsTrigger>
        </TabsList>

        {/* Diaper Tab */}
        <TabsContent value="diaper" className="space-y-6">
          <DateTimeRow label="Start time:" value={time} onChange={setTime} />

          {/* Type Selection */}
          <div className="flex justify-center gap-4 py-6">
            {diaperOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDiaperType(opt.value as DiaperType)}
                className={cn(
                  "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all",
                  "border-2",
                  diaperType === opt.value
                    ? "bg-secondary border-accent"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <opt.icon className={cn("h-8 w-8", opt.color)} />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>

          <NotesInput value={notes} onChange={setNotes} />
        </TabsContent>

        {/* Potty Tab */}
        <TabsContent value="potty" className="space-y-6">
          <DateTimeRow label="Start time:" value={time} onChange={setTime} />

          {/* Type Selection */}
          <div className="flex justify-center gap-4 py-6">
            {pottyOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPottyType(opt.value as PottyType)}
                className={cn(
                  "w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center gap-1 transition-all",
                  "border-2",
                  pottyType === opt.value
                    ? "bg-secondary border-accent"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <opt.icon className={cn("h-8 w-8", opt.color)} />
                <span className="text-xs font-medium text-center px-1">{opt.label}</span>
              </button>
            ))}
          </div>

          <NotesInput value={notes} onChange={setNotes} id="potty-notes" />
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="mt-6">
        {editEntry ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-14 text-lg rounded-full"
              onClick={onClose}
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
              disabled={saving || (activeTab === "diaper" ? !diaperType : !pottyType)}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <SaveButton
            onClick={handleSave}
            saving={saving}
            disabled={activeTab === "diaper" ? !diaperType : !pottyType}
          />
        )}
      </div>
    </TrackingContainer>
  );
}
