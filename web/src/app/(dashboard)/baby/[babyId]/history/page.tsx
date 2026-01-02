"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format, isToday, isYesterday } from "date-fns";
import {
  Milk,
  Moon,
  Baby,
  Droplets,
  Pill,
  Thermometer,
  Activity,
  Scale,
  Cookie,
  Bath,
  Calendar,
  Clock,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { getTimelineEntries, TimeframeOption } from "@/lib/actions/tracking";
import { getBaby } from "@/lib/actions/babies";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DateRange } from "react-day-picker";

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

  const [timeframe, setTimeframe] = useState<TimeframeOption>("7d");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<
    DateRange | undefined
  >();
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [babyName, setBabyName] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  useEffect(() => {
    async function fetchBaby() {
      if (!babyId) return;
      try {
        const baby = await getBaby(babyId);
        if (baby) {
          setBabyName(baby.name);
        }
      } catch (error) {
        console.error(error);
      }
    }
    fetchBaby();
  }, [babyId]);

  useEffect(() => {
    async function fetchEntries() {
      if (!babyId) return;

      setLoading(true);
      try {
        let effectiveTimeframe: TimeframeOption = timeframe;

        // If custom date range is set, use it
        if (isCustomMode && customDateRange?.from) {
          effectiveTimeframe = {
            start: customDateRange.from,
            end: customDateRange.to || customDateRange.from,
          };
        }

        const data = await getTimelineEntries(babyId, effectiveTimeframe);
        setEntries(data as TimelineEntry[]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchEntries();
  }, [babyId, timeframe, customDateRange, isCustomMode]);

  const formatDateLabel = (d: Date) => {
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "EEEE, MMM d");
  };

  const formatTime = (d: Date) => {
    return format(new Date(d), "h:mm a");
  };

  const getEntryDescription = (entry: TimelineEntry, babyName: string) => {
    const name = babyName || "Baby";

    switch (entry.entryType) {
      case "feeding": {
        if (entry.type === "nursing") {
          // Check if session is still in progress
          const isActive = !entry.endTime && entry.currentStatus;

          let leftSecs = entry.leftDuration || 0;
          let rightSecs = entry.rightDuration || 0;

          // If active, calculate current elapsed time
          if (isActive) {
            const now = new Date();
            const startTime = new Date(entry.startTime || entry.time);
            const lastPersisted = entry.lastPersistedAt
              ? new Date(entry.lastPersistedAt)
              : startTime;

            // Add elapsed time since last persist to the currently active side
            const elapsedSinceLastPersist = Math.floor(
              (now.getTime() - lastPersisted.getTime()) / 1000
            );

            if (entry.currentStatus === "left") {
              leftSecs += elapsedSinceLastPersist;
            } else if (entry.currentStatus === "right") {
              rightSecs += elapsedSinceLastPersist;
            }
            // If paused, don't add any additional time
          }

          const totalSecs = leftSecs + rightSecs;

          if (totalSecs > 0) {
            const totalMins = Math.floor(totalSecs / 60);
            const leftMins = Math.floor(leftSecs / 60);
            const rightMins = Math.floor(rightSecs / 60);

            // Use different text for active vs completed sessions
            const verb = isActive ? "is nursing" : "nursed";

            if (leftMins > 0 && rightMins > 0) {
              return `${name} ${verb} for ${totalMins} minutes (L: ${leftMins}, R: ${rightMins})`;
            }
            return `${name} ${verb} for ${totalMins} minutes`;
          }
          return `${name} is nursing...`;
        } else {
          const amount = entry.amount;
          const unit = entry.amountUnit || "oz";
          const content = entry.bottleContent;
          const milkType =
            content === "breast_milk" ? "breast milk" : "formula";
          return `${name} drank ${amount || 0}${unit} of ${milkType}`;
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
          if (hours > 0) {
            return `${name} was asleep for ${hours}h ${mins}m`;
          }
          return `${name} was asleep for ${mins} minutes`;
        }
        return `${name} is sleeping...`;
      }
      case "diaper": {
        const typeLabels: Record<string, string> = {
          pee: "wet",
          poo: "dirty",
          mixed: "mixed",
          dry: "dry",
        };
        const type = typeLabels[entry.type] || entry.type;
        return `${name} had a ${type} diaper`;
      }
      case "potty": {
        const typeLabels: Record<string, string> = {
          sat_but_dry: `${name} sat but stayed dry`,
          success: `${name} used the potty successfully!`,
          accident: `${name} had an accident`,
        };
        return typeLabels[entry.type] || `${name} used the potty`;
      }
      case "pumping": {
        const total = entry.totalAmount;
        const left = entry.leftAmount;
        const right = entry.rightAmount;
        const unit = entry.amountUnit || "oz";

        if (left && right) {
          return `Pumped ${
            total || left + right
          }${unit} (L: ${left}${unit}, R: ${right}${unit})`;
        } else if (total) {
          return `Pumped ${total}${unit} total`;
        }
        return "Pumping session completed";
      }
      case "medicine": {
        if (entry.name && entry.amount) {
          return `${name} was given ${entry.name} - ${entry.amount} ${entry.unit}`;
        } else if (entry.name) {
          return `${name} was given ${entry.name}`;
        }
        return `${name} was given medicine`;
      }
      case "temperature": {
        return `${name}'s temperature was ${entry.value}°${entry.unit}`;
      }
      case "activity": {
        const typeLabels: Record<string, string> = {
          bath: "had a bath",
          tummy_time: "did tummy time",
          story_time: "did story time",
          screen_time: "had screen time",
          skin_to_skin: "had skin to skin",
          play: "played",
          outdoor: "went outside",
          other: "did an activity",
        };
        const action = typeLabels[entry.type] || "did an activity";
        return `${name} ${action}`;
      }
      case "growth": {
        const parts = [];
        if (entry.weight)
          parts.push(`weighed ${entry.weight} ${entry.weightUnit || "lb"}`);
        if (entry.height)
          parts.push(`measured ${entry.height} ${entry.heightUnit || "in"}`);
        if (entry.headCircumference)
          parts.push(
            `head ${entry.headCircumference} ${entry.headUnit || "in"}`
          );
        if (parts.length > 0) {
          return `${name} ${parts.join(", ")}`;
        }
        return `${name} was measured`;
      }
      case "solids": {
        const foods = entry.foods;
        if (foods && foods.length > 0) {
          return `${name} ate ${foods.join(", ")}`;
        }
        return `${name} ate solid food`;
      }
      default:
        return "";
    }
  };

  // Filter entries by selected types
  const filteredEntries =
    selectedTypes.size === 0
      ? entries
      : entries.filter((e) => selectedTypes.has(e.entryType));

  // Group entries by day
  const entriesByDay = filteredEntries.reduce((acc, entry) => {
    const dayKey = format(new Date(entry.time), "yyyy-MM-dd");
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(entry);
    return acc;
  }, {} as Record<string, TimelineEntry[]>);

  // Calculate summary for all types
  const allTypes = [
    "feeding",
    "sleep",
    "diaper",
    "potty",
    "pumping",
    "medicine",
    "temperature",
    "activity",
    "growth",
    "solids",
  ] as const;
  const summary = allTypes
    .map((type) => ({
      type,
      count: filteredEntries.filter((e) => e.entryType === type).length,
      config: entryTypeConfig[type],
    }))
    .filter((s) => s.count > 0 || s.type === "feeding" || s.type === "sleep");

  // Quick filter types (most common)
  const quickFilterTypes = ["feeding", "sleep", "diaper"];

  const toggleFilter = (type: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedTypes(newSelected);
  };

  const clearAllFilters = () => {
    setSelectedTypes(new Set());
  };

  const handleTimeframeChange = (value: string) => {
    if (value === "custom") {
      setIsCustomMode(true);
      // Don't auto-open, let the button handle it
    } else {
      setIsCustomMode(false);
      setTimeframe(value as TimeframeOption);
      setCustomDateRange(undefined);
      setShowCustomDatePicker(false);
    }
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setCustomDateRange(range);
    // Don't auto-close - let users adjust dates freely
  };

  const getTimeframeLabel = () => {
    if (isCustomMode && customDateRange?.from) {
      const from = format(customDateRange.from, "MMM d");
      const to = customDateRange.to
        ? format(customDateRange.to, "MMM d")
        : from;
      return `${from} - ${to}`;
    }
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats - Moved to top */}
      {filteredEntries.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div
              className={cn(
                "grid gap-6 text-center",
                summary.length <= 2 && "grid-cols-2",
                summary.length === 3 && "grid-cols-3",
                summary.length === 4 && "grid-cols-2 sm:grid-cols-4",
                summary.length === 5 &&
                  "grid-cols-2 sm:grid-cols-3 md:grid-cols-5",
                summary.length >= 6 &&
                  "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
              )}
            >
              {summary.map(({ type, count, config }) => {
                const Icon = config.icon;
                return (
                  <div
                    key={type}
                    className="flex flex-col items-center justify-center space-y-2"
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        config.color
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="text-3xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">
                      {config.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeframe Selection and Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <Select
              value={isCustomMode ? "custom" : (timeframe as string)}
              onValueChange={handleTimeframeChange}
            >
              <SelectTrigger className="w-40">
                <SelectValue>
                  {isCustomMode && customDateRange?.from
                    ? getTimeframeLabel()
                    : isCustomMode
                    ? "Select range"
                    : timeframe === "24h"
                    ? "Last 24h"
                    : timeframe === "1d"
                    ? "Today"
                    : timeframe === "7d"
                    ? "Last 7 days"
                    : timeframe === "30d"
                    ? "Last 30 days"
                    : "Select range"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="1d">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom Range...</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Date Range Picker - Only show when custom is selected */}
            {isCustomMode && (
              <Popover
                open={showCustomDatePicker}
                onOpenChange={setShowCustomDatePicker}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    {customDateRange?.from ? "Change Dates" : "Select Dates"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex flex-col">
                    <CalendarComponent
                      mode="range"
                      selected={customDateRange}
                      onSelect={handleDateRangeSelect}
                      numberOfMonths={2}
                      showOutsideDays={false}
                      classNames={{
                        today:
                          "bg-primary/10 text-primary font-bold border-2 border-primary rounded-md data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:border-primary",
                      }}
                    />
                    <div className="flex items-center justify-between p-3 border-t">
                      <div className="text-sm text-muted-foreground">
                        {customDateRange?.from ? (
                          customDateRange?.to ? (
                            <>
                              Selected: {format(customDateRange.from, "MMM d")}{" "}
                              - {format(customDateRange.to, "MMM d")}
                            </>
                          ) : (
                            <>
                              Start: {format(customDateRange.from, "MMM d")}{" "}
                              (select end date)
                            </>
                          )
                        ) : (
                          "Select start date"
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowCustomDatePicker(false)}
                        disabled={!customDateRange?.from}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="w-40" /> {/* Spacer for balance */}
        </div>

        {/* Filter Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />

            {/* Quick filter chips */}
            {quickFilterTypes.map((type) => {
              const config =
                entryTypeConfig[type as keyof typeof entryTypeConfig];
              const Icon = config.icon;
              const isSelected = selectedTypes.has(type);

              return (
                <Badge
                  key={type}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleFilter(type)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              );
            })}

            {/* More filters button */}
            <Popover open={showMoreFilters} onOpenChange={setShowMoreFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  More filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <div className="flex flex-col max-h-[400px]">
                  <div className="sticky top-0 bg-popover border-b p-3">
                    <h4 className="font-medium text-sm">All Tracking Types</h4>
                  </div>
                  <div className="overflow-y-auto p-2 space-y-1">
                    {allTypes.map((type) => {
                      const config = entryTypeConfig[type];
                      const Icon = config.icon;
                      const isSelected = selectedTypes.has(type);

                      return (
                        <div
                          key={type}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded"
                          onClick={() => toggleFilter(type)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded"
                          />
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                              config.color
                            )}
                          >
                            <Icon className="h-3 w-3" />
                          </div>
                          <Label className="cursor-pointer flex-1">
                            {config.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear filters */}
            {selectedTypes.size > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Timeline with Day Headers */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {selectedTypes.size > 0
                ? "No entries match the selected filters"
                : "No entries for this period"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(entriesByDay).map(([day, dayEntries]) => {
            // Parse the date string correctly in local timezone by appending time
            const dayDate = new Date(day + "T00:00:00");

            return (
              <div key={day} className="space-y-2">
                {/* Day Header */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 border-b">
                  <h3 className="font-semibold text-sm">
                    {formatDateLabel(dayDate)}
                  </h3>
                </div>

                {/* Entries for this day */}
                <div className="space-y-2">
                  {dayEntries.map((entry) => {
                    const config = entryTypeConfig[entry.entryType];
                    const Icon = config.icon;

                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => {
                          // For entries without endTime (in progress), go to "new" view instead of edit
                          if (entry.entryType === "sleep" && !entry.endTime) {
                            router.push(`/baby/${babyId}/sleep/new`);
                          } else if (
                            entry.entryType === "feeding" &&
                            entry.type === "nursing" &&
                            !entry.endTime &&
                            entry.currentStatus
                          ) {
                            // Active nursing session - go to "new" view
                            router.push(`/baby/${babyId}/feeding/new`);
                          } else {
                            router.push(
                              `/baby/${babyId}/${
                                entry.entryType === "potty"
                                  ? "diaper"
                                  : entry.entryType
                              }/${entry.id}`
                            );
                          }
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
                          <p className="text-sm font-medium">
                            {getEntryDescription(entry, babyName)}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(entry.time)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
