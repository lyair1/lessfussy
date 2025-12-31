"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format, addDays, subDays, isToday, isYesterday } from "date-fns";
import { ChevronLeft, ChevronRight, Milk, Moon, Baby, Droplets, Pill, Thermometer, Activity, Scale, Cookie, Bath, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { getTimelineEntries, TimeframeOption } from "@/lib/actions/tracking";
import { cn } from "@/lib/utils";

const entryTypeConfig = {
  feeding: {
    icon: Milk,
    label: "Feeding",
    color: "bg-cyan/20 text-cyan",
  },
  sleep: {
    icon: Moon,
    label: "Sleep",
    color: "bg-purple/20 text-purple",
  },
  diaper: {
    icon: Baby,
    label: "Diaper",
    color: "bg-yellow/20 text-yellow",
  },
  potty: {
    icon: Bath,
    label: "Potty",
    color: "bg-muted text-muted-foreground",
  },
  pumping: {
    icon: Droplets,
    label: "Pumping",
    color: "bg-pink/20 text-pink",
  },
  medicine: {
    icon: Pill,
    label: "Medicine",
    color: "bg-coral/20 text-coral",
  },
  temperature: {
    icon: Thermometer,
    label: "Temperature",
    color: "bg-destructive/20 text-destructive",
  },
  activity: {
    icon: Activity,
    label: "Activity",
    color: "bg-lime/20 text-lime",
  },
  growth: {
    icon: Scale,
    label: "Growth",
    color: "bg-accent/20 text-accent",
  },
  solids: {
    icon: Cookie,
    label: "Solids",
    color: "bg-chart-3/20 text-chart-3",
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TimelineEntry = Record<string, any> & {
  id: string;
  entryType: keyof typeof entryTypeConfig;
  time: Date;
};

export default function HistoryPage() {
  const router = useRouter();
  const params = useParams();
  const babyId = params.babyId as string;

  const [timeframe, setTimeframe] = useState<TimeframeOption>('7d');
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    async function fetchEntries() {
      if (!babyId) return;

      setLoading(true);
      try {
        const data = await getTimelineEntries(babyId, timeframe);
        setEntries(data as TimelineEntry[]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchEntries();
  }, [babyId, timeframe]);

  const formatDateLabel = (d: Date) => {
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "EEEE, MMM d");
  };

  const formatTime = (d: Date) => {
    return format(new Date(d), "h:mm a");
  };

  const getEntryDescription = (entry: TimelineEntry) => {
    switch (entry.entryType) {
      case "feeding": {
        if (entry.type === "nursing") {
          // Use stored durations directly
          const leftSecs = entry.leftDuration || 0;
          const rightSecs = entry.rightDuration || 0;
          const totalSecs = leftSecs + rightSecs;
          
          if (totalSecs > 0) {
            const totalMins = Math.floor(totalSecs / 60);
            const leftMins = Math.floor(leftSecs / 60);
            const rightMins = Math.floor(rightSecs / 60);
            if (leftMins > 0 && rightMins > 0) {
              return `Nursing - ${totalMins} min (L: ${leftMins}, R: ${rightMins})`;
            }
            return `Nursing - ${totalMins} min`;
          }
          return "Nursing - in progress...";
        } else {
          const amount = entry.amount;
          const unit = entry.amountUnit || "oz";
          const content = entry.bottleContent;
          return `Bottle - ${amount || 0} ${unit} ${content === "breast_milk" ? "breast milk" : "formula"}`;
        }
      }
      case "sleep": {
        const start = new Date(entry.startTime || entry.time);
        const end = entry.endTime;
        if (end) {
          const duration = Math.floor(
            (new Date(end).getTime() - start.getTime()) / 60000
          );
          const hours = Math.floor(duration / 60);
          const mins = duration % 60;
          return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
        }
        return "In progress...";
      }
      case "diaper": {
        const typeLabels: Record<string, string> = {
          pee: "Wet",
          poo: "Dirty",
          mixed: "Mixed",
          dry: "Dry",
        };
        return typeLabels[entry.type] || entry.type;
      }
      case "potty": {
        const typeLabels: Record<string, string> = {
          sat_but_dry: "Sat but dry",
          success: "Success!",
          accident: "Accident",
        };
        return typeLabels[entry.type] || entry.type;
      }
      case "pumping": {
        const total = entry.totalAmount;
        const unit = entry.amountUnit || "oz";
        return `${total || 0} ${unit}`;
      }
      case "medicine": {
        if (entry.name && entry.amount) {
          return `${entry.name} - ${entry.amount} ${entry.unit}`;
        }
        return entry.name || "Medicine given";
      }
      case "temperature": {
        return `${entry.value}°${entry.unit}`;
      }
      case "activity": {
        const typeLabels: Record<string, string> = {
          bath: "Bath",
          tummy_time: "Tummy time",
          story_time: "Story time",
          screen_time: "Screen time",
          skin_to_skin: "Skin to skin",
          play: "Play",
          outdoor: "Outdoor",
          other: "Other",
        };
        return typeLabels[entry.type] || entry.type;
      }
      case "growth": {
        const parts = [];
        if (entry.weight) parts.push(`Weight: ${entry.weight}`);
        if (entry.height) parts.push(`Height: ${entry.height}`);
        if (entry.headCircumference) parts.push(`Head: ${entry.headCircumference}`);
        return parts.join(", ") || "Measurements recorded";
      }
      case "solids": {
        const foods = entry.foods;
        if (foods && foods.length > 0) {
          return foods.join(", ");
        }
        return "Solid food";
      }
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Timeframe Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <Select value={timeframe as string} onValueChange={(value) => setTimeframe(value as TimeframeOption)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="1d">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <h2 className="text-lg font-semibold">Activity History</h2>
        <div className="w-32" /> {/* Spacer for balance */}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No entries for this day</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const config = entryTypeConfig[entry.entryType];
            const Icon = config.icon;

            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => {
                  // Navigate to the edit URL for this entry
                  router.push(`/baby/${babyId}/${entry.entryType === 'potty' ? 'diaper' : entry.entryType}/${entry.id}`);
                }}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    config.color
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getEntryDescription(entry)}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">
                  {formatTime(entry.time)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {entries.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Today&apos;s Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-cyan">
                  {entries.filter((e) => e.entryType === "feeding").length}
                </p>
                <p className="text-xs text-muted-foreground">Feedings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple">
                  {entries.filter((e) => e.entryType === "sleep").length}
                </p>
                <p className="text-xs text-muted-foreground">Sleeps</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow">
                  {entries.filter((e) => e.entryType === "diaper").length}
                </p>
                <p className="text-xs text-muted-foreground">Diapers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

