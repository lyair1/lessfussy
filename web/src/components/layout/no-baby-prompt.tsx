"use client";

import { useState } from "react";
import { Baby, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddBabyDialog } from "@/components/babies/add-baby-dialog";

export function NoBabyPrompt() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-accent/20 p-6 mb-6">
        <Baby className="h-16 w-16 text-accent" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Welcome to LessFussy!</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Get started by adding your first baby. You&apos;ll be able to track
        feedings, sleep, diapers, and more.
      </p>
      <Button
        size="lg"
        onClick={() => setDialogOpen(true)}
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="h-5 w-5" />
        Add Your Baby
      </Button>

      <AddBabyDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

