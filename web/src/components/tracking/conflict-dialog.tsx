"use client";

import { AlertTriangle, Clock, Info, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Conflict, getActivityDescription } from "@/lib/utils";

interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: Conflict[];
  activityType: string;
  onConfirm: () => void;
  onCancel: () => void;
  onGoToActivity?: (activityType: string) => void;
  loading?: boolean;
}

export function ConflictDialog({
  open,
  onOpenChange,
  conflicts,
  activityType,
  onConfirm,
  onCancel,
  onGoToActivity,
  loading = false,
}: ConflictDialogProps) {
  const hasActiveConflicts = conflicts.some(
    (c) => c.type === "active_conflict"
  );
  const hasLogicalConflicts = conflicts.some(
    (c) => c.type === "logical_conflict"
  );

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Conflict Detected
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {conflicts.map((conflict, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-start gap-2">
                {conflict.type === "active_conflict" ? (
                  <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                ) : (
                  <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-sm">
                  <p className="font-medium">{conflict.message}</p>
                  {conflict.conflictingActivities.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {conflict.conflictingActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <Badge variant="secondary" className="text-xs">
                            {getActivityDescription(activity.type)}
                          </Badge>
                          <Clock className="h-3 w-3" />
                          <span>{activity.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {hasLogicalConflicts && !hasActiveConflicts && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                You can choose to proceed anyway, but this may indicate
                overlapping activities.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {hasActiveConflicts ? (
            <>
              {(() => {
                const conflictingActivity = conflicts.find(
                  (c) => c.type === "active_conflict"
                )?.conflictingActivities[0];
                return conflictingActivity ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (onGoToActivity) {
                        onGoToActivity(conflictingActivity.type);
                      }
                      onOpenChange(false);
                    }}
                    disabled={loading}
                  >
                    Go to {getActivityDescription(conflictingActivity.type)}{" "}
                    session
                  </Button>
                ) : null;
              })()}
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {loading
                  ? "Starting..."
                  : (() => {
                      const conflictingActivity = conflicts.find(
                        (c) => c.type === "active_conflict"
                      )?.conflictingActivities[0];
                      // Special case: sleep conflicting with feeding -> offer to stop feeding and start sleep
                      if (
                        activityType === "sleep" &&
                        conflictingActivity?.type === "feeding"
                      ) {
                        return "Stop nursing and start sleep";
                      }
                      // Special case: feeding conflicting with sleep -> offer to stop sleep and start feeding
                      if (
                        activityType === "feeding" &&
                        conflictingActivity?.type === "sleep"
                      ) {
                        return "Stop sleep and start feeding";
                      }
                      return `Start ${getActivityDescription(
                        activityType as any
                      )} anyway`;
                    })()}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              {hasLogicalConflicts && (
                <Button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {loading ? "Saving..." : "Proceed Anyway"}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
