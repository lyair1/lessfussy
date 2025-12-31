"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import {
  TrackingContainer,
  TrackingHeader,
  TrackingContent,
  DateTimeRow,
  NotesInput,
  SaveButton,
} from "@/components/tracking/shared";
import { createDiaper, createPottyLog, updateDiaper, updatePottyLog, deleteDiaper, deletePottyLog } from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

export default function DiaperPage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;
  const entryId = params.entryId as string;

  const isEditMode = !!entryId && entryId !== 'new';

  const [activeTab, setActiveTab] = useState<"diaper" | "potty">("diaper");
  const [time, setTime] = useState(new Date());
  const [diaperType, setDiaperType] = useState<DiaperType | null>(null);
  const [pottyType, setPottyType] = useState<PottyType | null>(null);
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

        if (entry) {
          setTime(new Date(entry.time));
          setNotes(entry.notes || "");

          if (entry.entryType === 'diaper') {
            setActiveTab('diaper');
            setDiaperType(entry.type);
          } else if (entry.entryType === 'potty') {
            setActiveTab('potty');
            setPottyType(entry.type);
          }
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
      if (isEditMode) {
        // Update existing entry
        if (activeTab === "diaper") {
          await updateDiaper(entryId, babyId, {
            time,
            type: diaperType!,
            notes: notes || undefined,
          });
          toast.success("Diaper updated!");
        } else {
          await updatePottyLog(entryId, babyId, {
            time,
            type: pottyType!,
            notes: notes || undefined,
          });
          toast.success("Potty updated!");
        }
        router.push(`/baby/${babyId}`);
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
    if (!isEditMode) return;

    try {
      if (activeTab === "diaper") {
        await deleteDiaper(entryId, babyId);
        toast.success("Diaper deleted!");
      } else {
        await deletePottyLog(entryId, babyId);
        toast.success("Potty deleted!");
      }
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
        <TrackingHeader title={isEditMode ? "Edit diaper" : "Add diaper"} />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading entry...</div>
        </div>
      </TrackingContainer>
    );
  }

  return (
    <TrackingContainer>
      <TrackingHeader title={isEditMode ? `Edit ${activeTab === "diaper" ? "diaper" : "potty"}` : `Add ${activeTab === "diaper" ? "diaper" : "potty"}`} />

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
          <DateTimeRow label="Time:" value={time} onChange={setTime} />

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
          <DateTimeRow label="Time:" value={time} onChange={setTime} />

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
            disabled={saving || (activeTab === "diaper" ? !diaperType : !pottyType)}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <SaveButton
            onClick={handleSave}
            saving={saving}
            disabled={activeTab === "diaper" ? !diaperType : !pottyType}
          />
        </div>
      )}
    </TrackingContainer>
  );
}
