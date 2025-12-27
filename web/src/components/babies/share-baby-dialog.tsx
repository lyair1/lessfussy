"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shareBaby } from "@/lib/actions/babies";
import type { Baby } from "@/lib/db/schema";

interface ShareBabyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baby: Baby;
}

export function ShareBabyDialog({
  open,
  onOpenChange,
  baby,
}: ShareBabyDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("editor");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter an email");
      return;
    }

    setLoading(true);
    try {
      await shareBaby(baby.id, email.trim(), role);
      toast.success(`${baby.name} shared with ${email}`);
      onOpenChange(false);
      setEmail("");
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to share";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto rounded-full bg-accent/20 p-3 mb-2">
            <Share2 className="h-6 w-6 text-accent" />
          </div>
          <DialogTitle className="text-center">Share {baby.name}</DialogTitle>
          <DialogDescription className="text-center">
            Invite another parent or caregiver to track {baby.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              The person must have a BabyTrack account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Permission Level</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">
                  <div>
                    <div className="font-medium">Editor</div>
                    <div className="text-xs text-muted-foreground">
                      Can add and edit entries
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div>
                    <div className="font-medium">Viewer</div>
                    <div className="text-xs text-muted-foreground">
                      Can only view entries
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
              {loading ? "Sharing..." : "Share"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

