"use client";

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
  Ruler,
  Apple,
  Toilet,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavoriteActivity } from "@/lib/actions/users";
import { toast } from "sonner";

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
    icon: Ruler,
    color: "bg-accent/20 text-accent hover:bg-accent/30",
    description: "Weight & height",
  },
  {
    id: "potty",
    label: "Potty",
    icon: Toilet,
    color: "bg-muted text-muted-foreground hover:bg-muted/80",
    description: "Potty training",
  },
  {
    id: "solids",
    label: "Solids",
    icon: Apple,
    color: "bg-chart-3/20 text-chart-3 hover:bg-chart-3/30",
    description: "Solid food intake",
  },
];

interface TrackingGridProps {
  babyId: string;
  initialFavorites: string[];
}

export function TrackingGrid({ babyId, initialFavorites }: TrackingGridProps) {
  const [favorites, setFavorites] = useState<string[]>(initialFavorites);
  const [showMore, setShowMore] = useState(false);
  const [isPending, startTransition] = useTransition();

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
  ) => (
    <div key={type.id} className="relative group">
      <Link
        href={`/baby/${babyId}/${type.id}`}
        className={cn(
          "flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl transition-all duration-200",
          "border border-border/50 hover:border-border",
          "hover:scale-[1.02] active:scale-[0.98]",
          type.color
        )}
      >
        <type.icon className="h-8 w-8 sm:h-10 sm:w-10 mb-2" />
        <span className="font-semibold text-sm sm:text-base">{type.label}</span>
        <span className="text-xs text-muted-foreground mt-1 text-center hidden sm:block">
          {type.description}
        </span>
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
        <Star
          className={cn("h-4 w-4", isFavorite && "fill-current")}
        />
      </button>
    </div>
  );

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
