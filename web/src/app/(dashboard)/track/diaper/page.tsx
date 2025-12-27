"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Clock, Droplet, Cloud, CloudRain, CircleDashed, Toilet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBaby } from "@/components/layout/dashboard-shell";
import { createDiaper, createPottyLog } from "@/lib/actions/tracking";
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

export default function DiaperPage() {
  const router = useRouter();
  const { selectedBaby } = useBaby();

  const [activeTab, setActiveTab] = useState<"diaper" | "potty">("diaper");
  const [time, setTime] = useState(new Date());
  const [diaperType, setDiaperType] = useState<DiaperType | null>(null);
  const [pottyType, setPottyType] = useState<PottyType | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedBaby) {
      toast.error("Please select a baby first");
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
      if (activeTab === "diaper") {
        await createDiaper({
          babyId: selectedBaby.id,
          time,
          type: diaperType!,
          notes: notes || undefined,
        });
        toast.success("Diaper logged!");
      } else {
        await createPottyLog({
          babyId: selectedBaby.id,
          time,
          type: pottyType!,
          notes: notes || undefined,
        });
        toast.success("Potty logged!");
      }
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
        <h1 className="text-xl font-bold">
          Add {activeTab === "diaper" ? "diaper" : "potty"}
        </h1>
        <Button variant="ghost" size="icon">
          <Clock className="h-5 w-5" />
        </Button>
      </div>

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
          {/* Time */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Start time:</span>
            <Input
              type="datetime-local"
              value={time.toISOString().slice(0, 16)}
              onChange={(e) => setTime(new Date(e.target.value))}
              className="w-auto bg-transparent border-0 text-right text-accent"
            />
          </div>

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
        </TabsContent>

        {/* Potty Tab */}
        <TabsContent value="potty" className="space-y-6">
          {/* Time */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Start time:</span>
            <Input
              type="datetime-local"
              value={time.toISOString().slice(0, 16)}
              onChange={(e) => setTime(new Date(e.target.value))}
              className="w-auto bg-transparent border-0 text-right text-accent"
            />
          </div>

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
                <span className="text-xs font-medium text-center px-1">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="potty-notes">Notes (optional)</Label>
            <Input
              id="potty-notes"
              placeholder="Add notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="mt-6">
        <Button
          className="w-full h-14 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleSave}
          disabled={saving || (activeTab === "diaper" ? !diaperType : !pottyType)}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

