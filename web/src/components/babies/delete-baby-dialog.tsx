"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteBaby } from "@/lib/actions/babies";
import type { Baby } from "@/lib/db/schema";

interface DeleteBabyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baby: Baby;
}

export function DeleteBabyDialog({
  open,
  onOpenChange,
  baby,
}: DeleteBabyDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteBaby(baby.id);
      toast.success(`${baby.name} has been removed`);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete baby");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto rounded-full bg-destructive/20 p-3 mb-2">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">Delete {baby.name}?</DialogTitle>
          <DialogDescription className="text-center">
            This will permanently delete all tracking data for {baby.name}. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

