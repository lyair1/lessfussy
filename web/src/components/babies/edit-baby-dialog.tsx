"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBaby } from "@/lib/actions/babies";
import type { Baby } from "@/lib/db/schema";

interface EditBabyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baby: Baby;
}

export function EditBabyDialog({
  open,
  onOpenChange,
  baby,
}: EditBabyDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(baby.name);
  const [birthDate, setBirthDate] = useState(baby.birthDate || "");

  useEffect(() => {
    setName(baby.name);
    setBirthDate(baby.birthDate || "");
  }, [baby]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setLoading(true);
    try {
      await updateBaby(baby.id, {
        name: name.trim(),
        birthDate: birthDate || undefined,
      });
      toast.success("Baby updated!");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update baby");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto rounded-full bg-accent/20 p-3 mb-2">
            <Pencil className="h-6 w-6 text-accent" />
          </div>
          <DialogTitle className="text-center">Edit {baby.name}</DialogTitle>
          <DialogDescription className="text-center">
            Update your baby&apos;s information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Baby's name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Birth Date</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="bg-background"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

