"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export function TrackingGrid({ babyId }: TrackingGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {trackingTypes.map((type) => (
        <Link
          key={type.id}
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
      ))}
    </div>
  );
}
