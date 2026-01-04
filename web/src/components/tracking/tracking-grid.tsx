"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Baby,
  Moon,
  Droplets,
  Milk,
  Thermometer,
  Pill,
  Activity,
  Scale,
  Cookie,
  Bath,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  cn,
  formatDuration,
  formatVolumeForUnitSystem,
  getRelativeTime,
} from "@/lib/utils";
import { getCurrentUser, toggleFavoriteActivity } from "@/lib/actions/users";
import { toast } from "sonner";
import type {
  Feeding,
  SleepLog,
  Diaper,
  Pumping,
  Medicine,
  Temperature,
  Activity as ActivityType,
  GrowthLog,
  PottyLog,
  Solid,
} from "@/lib/db/schema";

const trackingTypes = [
  {
    id: "feeding",
    label: "Feeding",
    icon: Milk,
    color: "bg-cyan/20 text-cyan hover:bg-cyan/30",
    description: "Nursing or bottle",
  },
  {
    id: "sleep",
    label: "Sleep",
    icon: Moon,
    color: "bg-purple/20 text-purple hover:bg-purple/30",
    description: "Track sleep time",
  },
  {
    id: "diaper",
    label: "Diaper",
    icon: Baby,
    color: "bg-yellow/20 text-yellow hover:bg-yellow/30",
    description: "Wet or dirty",
  },
  {
    id: "pumping",
    label: "Pumping",
    icon: Droplets,
    color: "bg-pink/20 text-pink hover:bg-pink/30",
    description: "Track pumping session",
  },
  {
    id: "medicine",
    label: "Medicine",
    icon: Pill,
    color: "bg-coral/20 text-coral hover:bg-coral/30",
    description: "Log medicine given",
  },
  {
    id: "temperature",
    label: "Temperature",
    icon: Thermometer,
    color: "bg-destructive/20 text-destructive hover:bg-destructive/30",
    description: "Record temperature",
  },
  {
    id: "activity",
    label: "Activity",
    icon: Activity,
    color: "bg-lime/20 text-lime hover:bg-lime/30",
    description: "Bath, tummy time, etc.",
  },
  {
    id: "growth",
    label: "Growth",
    icon: Scale,
    color: "bg-accent/20 text-accent hover:bg-accent/30",
    description: "Weight & height",
  },
  {
    id: "potty",
    label: "Potty",
    icon: Bath,
    color: "bg-muted text-muted-foreground hover:bg-muted/80",
    description: "Potty training",
  },
  {
    id: "solids",
    label: "Solids",
    icon: Cookie,
    color: "bg-chart-3/20 text-chart-3 hover:bg-chart-3/30",
    description: "Solid food intake",
  },
];

interface LastTrackingData {
  feeding: Feeding | undefined;
  sleep: SleepLog | undefined;
  diaper: Diaper | undefined;
  pumping: Pumping | undefined;
  medicine: Medicine | undefined;
  temperature: Temperature | undefined;
  activity: ActivityType | undefined;
  growth: GrowthLog | undefined;
  potty: PottyLog | undefined;
  solids: Solid | undefined;
}

interface TrackingGridProps {
  babyId: string;
  initialFavorites: string[];
  lastTrackingData?: LastTrackingData;
}

export function TrackingGrid({
  babyId,
  initialFavorites,
  lastTrackingData,
}: TrackingGridProps) {
  const [favorites, setFavorites] = useState<string[]>(initialFavorites);
  const [showMore, setShowMore] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [unitSystem, setUnitSystem] = useState<"imperial" | "metric">(
    "imperial"
  );

  React.useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUser();
        if (user?.unitSystem) setUnitSystem(user.unitSystem);
      } catch {
        // ignore
      }
    }
    load();
  }, []);

  const favoriteItems = trackingTypes.filter((type) =>
    favorites.includes(type.id)
  );
  const moreItems = trackingTypes.filter(
    (type) => !favorites.includes(type.id)
  );

  const handleToggleFavorite = (
    e: React.MouseEvent,
    activityId: string,
    activityLabel: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const isFavorite = favorites.includes(activityId);

    // Optimistically update the UI
    if (isFavorite) {
      setFavorites((prev) => prev.filter((id) => id !== activityId));
    } else {
      setFavorites((prev) => [...prev, activityId]);
    }

    startTransition(async () => {
      try {
        await toggleFavoriteActivity(activityId);
        toast.success(
          isFavorite
            ? `${activityLabel} moved to More`
            : `${activityLabel} added to Favorites`
        );
      } catch {
        // Revert on error
        if (isFavorite) {
          setFavorites((prev) => [...prev, activityId]);
        } else {
          setFavorites((prev) => prev.filter((id) => id !== activityId));
        }
        toast.error("Failed to update favorites");
      }
    });
  };

  const renderTrackingCard = (
    type: (typeof trackingTypes)[0],
    isFavorite: boolean
  ) => {
    const lastEntry = lastTrackingData?.[type.id as keyof LastTrackingData];

    // Calculate duration for feeding and sleep
    let durationText = "";
    let lastTimeText = "";
    let isActive = false;

    if (lastEntry) {
      // Get the appropriate timestamp field based on the tracking type
      let timestamp: Date | undefined;
      switch (type.id) {
        case "feeding":
        case "sleep":
        case "activity":
        case "pumping":
          timestamp = (lastEntry as any).startTime;
          break;
        case "diaper":
        case "medicine":
        case "temperature":
        case "potty":
        case "solids":
          timestamp = (lastEntry as any).time;
          break;
        case "growth":
          timestamp = (lastEntry as any).createdAt;
          break;
      }

      if (timestamp) {
        lastTimeText = getRelativeTime(new Date(timestamp));
      }

      // Handle active sessions first
      if (
        type.id === "feeding" &&
        !(lastEntry as any).endTime &&
        (lastEntry as any).type === "nursing"
      ) {
        lastTimeText = "Nursing...";
        isActive = true;
      } else if (type.id === "pumping" && !(lastEntry as any).endTime) {
        lastTimeText = "Pumping...";
        isActive = true;
      } else if (type.id === "sleep" && !(lastEntry as any).endTime) {
        // Active sleep session - calculate duration
        const durationSeconds = Math.floor(
          (new Date().getTime() -
            new Date((lastEntry as any).startTime).getTime()) /
            1000
        );
        lastTimeText = `Sleeping for ${formatDuration(durationSeconds)}`;
        isActive = true;
      }
      // Calculate duration for completed feeding and sleep
      else if (type.id === "feeding" && (lastEntry as any).endTime) {
        // For nursing sessions, use stored duration if available
        if ((lastEntry as any).type === "nursing") {
          const leftDuration = (lastEntry as any).leftDuration || 0;
          const rightDuration = (lastEntry as any).rightDuration || 0;
          const totalDuration = leftDuration + rightDuration;
          if (totalDuration > 0) {
            durationText = formatDuration(totalDuration);
          }
        } else if ((lastEntry as any).type === "bottle") {
          // For bottle feedings, show amount instead of duration
          const amount = (lastEntry as any).amount;
          const unit = (lastEntry as any).amountUnit || "oz";
          if (amount && amount > 0) {
            const formatted = formatVolumeForUnitSystem(
              amount,
              unit,
              unitSystem
            );
            durationText = formatted
              ? `${formatted.amount}${formatted.unit}`
              : `${amount}${unit}`;
          }
        } else if ((lastEntry as any).startTime && (lastEntry as any).endTime) {
          // For other completed feedings, calculate duration from start/end times
          const durationSeconds = Math.floor(
            (new Date((lastEntry as any).endTime).getTime() -
              new Date((lastEntry as any).startTime).getTime()) /
              1000
          );
          if (durationSeconds > 0) {
            durationText = formatDuration(durationSeconds);
          }
        }
      } else if (
        type.id === "sleep" &&
        (lastEntry as any).endTime &&
        (lastEntry as any).startTime
      ) {
        const durationSeconds = Math.floor(
          (new Date((lastEntry as any).endTime).getTime() -
            new Date((lastEntry as any).startTime).getTime()) /
            1000
        );
        if (durationSeconds > 0) {
          durationText = formatDuration(durationSeconds);
        }
      }
    }

    return (
      <div key={type.id} className="relative group">
        <Link
          href={`/baby/${babyId}/${
            type.id === "potty" ? "diaper" : type.id
          }/new`}
          className={cn(
            "flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl transition-all duration-200 h-36 sm:h-40",
            "border border-border/50 hover:border-border",
            "hover:scale-[1.02] active:scale-[0.98]",
            type.color
          )}
        >
          <type.icon
            className={cn(
              "h-8 w-8 sm:h-10 sm:w-10 mb-2",
              isActive && "heartbeat"
            )}
          />
          <span className="font-semibold text-sm sm:text-base">
            {type.label}
          </span>
          <div className="w-full mt-1 hidden sm:block">
            <span className="text-xs text-muted-foreground px-1 block text-center">
              {type.description}
            </span>
          </div>

          {/* Last tracking info */}
          {lastTimeText && (
            <div className="w-full mt-1 sm:mt-2">
              <div className="text-[10px] sm:text-xs text-muted-foreground/80 px-1 text-center">
                <div>
                  {lastTimeText.endsWith("...")
                    ? lastTimeText
                    : `Last: ${lastTimeText}`}
                  {durationText && ` (${durationText})`}
                </div>
              </div>
            </div>
          )}
        </Link>

        {/* Favorite toggle button */}
        <button
          onClick={(e) => handleToggleFavorite(e, type.id, type.label)}
          disabled={isPending}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200",
            "opacity-0 group-hover:opacity-100 focus:opacity-100",
            "hover:scale-110 active:scale-95",
            isFavorite
              ? "bg-yellow/20 text-yellow hover:bg-yellow/30"
              : "bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background"
          )}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Favorites Section */}
      {favoriteItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow fill-yellow" />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Favorites
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {favoriteItems.map((type) => renderTrackingCard(type, true))}
          </div>
        </div>
      )}

      {/* More Section */}
      {moreItems.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group w-full"
          >
            <h2 className="text-sm font-medium uppercase tracking-wide">
              More
            </h2>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
              {moreItems.length}
            </span>
            {showMore ? (
              <ChevronUp className="h-4 w-4 ml-auto transition-transform" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-auto transition-transform" />
            )}
          </button>

          <div
            className={cn(
              "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4",
              "transition-all duration-300 ease-in-out",
              showMore
                ? "opacity-100 max-h-[1000px]"
                : "opacity-0 max-h-0 overflow-hidden pointer-events-none"
            )}
          >
            {moreItems.map((type) => renderTrackingCard(type, false))}
          </div>
        </div>
      )}

      {/* Show all if no favorites */}
      {favoriteItems.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {trackingTypes.map((type) =>
            renderTrackingCard(type, favorites.includes(type.id))
          )}
        </div>
      )}
    </div>
  );
}
