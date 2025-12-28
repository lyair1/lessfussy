"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Heart, Meh, Frown, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TrackingContainer,
  TrackingHeader,
  TrackingContent,
  DateTimeRow,
  NotesInput,
  SaveButton,
  LabeledRow,
} from "@/components/tracking/shared";
import { createSolid } from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";

type Reaction = "loved_it" | "meh" | "hated_it" | "allergy_or_sensitivity";

const reactionOptions = [
  { value: "loved_it", label: "loved it", icon: Heart, color: "text-pink bg-pink/20" },
  { value: "meh", label: "meh", icon: Meh, color: "text-yellow bg-yellow/20" },
  { value: "hated_it", label: "hated it", icon: Frown, color: "text-muted-foreground bg-muted" },
  { value: "allergy_or_sensitivity", label: "allergy or sensitivity", icon: AlertTriangle, color: "text-destructive bg-destructive/20" },
];

export default function SolidsPage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;

  const [time, setTime] = useState(new Date());
  const [foods, setFoods] = useState<string[]>([]);
  const [newFood, setNewFood] = useState("");
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const addFood = () => {
    if (newFood.trim() && !foods.includes(newFood.trim())) {
      setFoods([...foods, newFood.trim()]);
      setNewFood("");
    }
  };

  const removeFood = (food: string) => {
    setFoods(foods.filter((f) => f !== food));
  };

  const handleSave = async () => {
    if (!babyId) {
      toast.error("Baby not found");
      return;
    }

    setSaving(true);
    try {
      await createSolid({
        babyId,
        time,
        foods: foods.length > 0 ? foods : undefined,
        reaction: reaction || undefined,
        notes: notes || undefined,
      });
      toast.success("Solids logged!");
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
      <TrackingHeader title="Add Solids" />
      <TrackingContent>
        <DateTimeRow label="Time:" value={time} onChange={setTime} />

        {/* Food */}
        <div className="space-y-3">
          <LabeledRow label="Food:">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add food"
                value={newFood}
                onChange={(e) => setNewFood(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFood()}
                className="w-32 bg-transparent border-0 text-right"
              />
              <Button variant="ghost" size="sm" onClick={addFood} className="text-accent">
                add
              </Button>
            </div>
          </LabeledRow>

          {/* Food Tags */}
          {foods.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {foods.map((food) => (
                <Badge key={food} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                  {food}
                  <button onClick={() => removeFood(food)} className="ml-1 hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Reaction */}
        <div className="space-y-3">
          <h3 className="font-medium">Reaction</h3>
          <div className="flex flex-wrap gap-2">
            {reactionOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setReaction(reaction === opt.value ? null : (opt.value as Reaction))}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                  "border-2",
                  reaction === opt.value
                    ? `border-current ${opt.color}`
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <opt.icon className="h-5 w-5" />
                <span className="text-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <NotesInput value={notes} onChange={setNotes} label="Notes" placeholder="+ add note" />
        <SaveButton onClick={handleSave} saving={saving} />
      </TrackingContent>
    </TrackingContainer>
  );
}
