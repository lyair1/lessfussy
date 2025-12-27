"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { X, Camera, Heart, Meh, Frown, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">Add Solids</h1>
        <div className="w-10" />
      </div>

      <div className="space-y-6">
        {/* Time */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Time:</span>
          <Input
            type="datetime-local"
            value={time.toISOString().slice(0, 16)}
            onChange={(e) => setTime(new Date(e.target.value))}
            className="w-auto bg-transparent border-0 text-right text-accent"
          />
        </div>

        {/* Food */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-muted-foreground">Food:</span>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add food"
                value={newFood}
                onChange={(e) => setNewFood(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFood()}
                className="w-32 bg-transparent border-0 text-right"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={addFood}
                className="text-accent"
              >
                add
              </Button>
            </div>
          </div>

          {/* Food Tags */}
          {foods.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {foods.map((food) => (
                <Badge
                  key={food}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {food}
                  <button
                    onClick={() => removeFood(food)}
                    className="ml-1 hover:text-destructive"
                  >
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
                onClick={() =>
                  setReaction(
                    reaction === opt.value ? null : (opt.value as Reaction)
                  )
                }
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

        {/* Add Photo Button */}
        <Button
          variant="outline"
          className="w-full gap-2 py-6 border-dashed"
        >
          <Camera className="h-5 w-5" />
          add photo
        </Button>

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

