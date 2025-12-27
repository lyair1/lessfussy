"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Baby } from "lucide-react";
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
import { createBaby } from "@/lib/actions/babies";

interface AddBabyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBabyDialog({ open, onOpenChange }: AddBabyDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setLoading(true);
    try {
      const newBaby = await createBaby({
        name: name.trim(),
        birthDate: birthDate || undefined,
      });
      toast.success(`${name} has been added!`);
      onOpenChange(false);
      setName("");
      setBirthDate("");
      // Navigate to the new baby's dashboard
      router.push(`/baby/${newBaby.id}`);
    } catch (error) {
      toast.error("Failed to add baby");
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
            <Baby className="h-6 w-6 text-accent" />
          </div>
          <DialogTitle className="text-center">Add a Baby</DialogTitle>
          <DialogDescription className="text-center">
            Enter your baby&apos;s details to start tracking
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
            <Label htmlFor="birthDate">Birth Date (optional)</Label>
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
              {loading ? "Adding..." : "Add Baby"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

