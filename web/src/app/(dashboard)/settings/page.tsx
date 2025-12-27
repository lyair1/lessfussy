"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Settings, Ruler, Thermometer, Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser, updateUserSettings } from "@/lib/actions/users";
import { cn } from "@/lib/utils";

type UnitSystem = "imperial" | "metric";
type TempUnit = "fahrenheit" | "celsius";
type TimeFormat = "12h" | "24h";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
  const [tempUnit, setTempUnit] = useState<TempUnit>("fahrenheit");
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("12h");

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState({
    unitSystem: "imperial" as UnitSystem,
    tempUnit: "fahrenheit" as TempUnit,
    timeFormat: "12h" as TimeFormat,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUnitSystem(user.unitSystem);
          setTempUnit(user.tempUnit);
          setTimeFormat(user.timeFormat);
          setOriginalSettings({
            unitSystem: user.unitSystem,
            tempUnit: user.tempUnit,
            timeFormat: user.timeFormat,
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    const changed =
      unitSystem !== originalSettings.unitSystem ||
      tempUnit !== originalSettings.tempUnit ||
      timeFormat !== originalSettings.timeFormat;
    setHasChanges(changed);
  }, [unitSystem, tempUnit, timeFormat, originalSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserSettings({
        unitSystem,
        tempUnit,
        timeFormat,
      });
      setOriginalSettings({ unitSystem, tempUnit, timeFormat });
      setHasChanges(false);
      toast.success("Settings saved!");
      router.refresh();
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Customize your tracking preferences
        </p>
      </div>

      {/* Units Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-accent" />
            Measurement Units
          </CardTitle>
          <CardDescription>
            Choose your preferred unit system for measurements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unit System */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Unit System</Label>
              <p className="text-sm text-muted-foreground">
                {unitSystem === "imperial"
                  ? "oz, lb, in"
                  : "ml, kg, cm"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={unitSystem === "imperial" ? "default" : "outline"}
                size="sm"
                onClick={() => setUnitSystem("imperial")}
                className={cn(
                  unitSystem === "imperial" && "bg-accent text-accent-foreground"
                )}
              >
                Imperial
              </Button>
              <Button
                variant={unitSystem === "metric" ? "default" : "outline"}
                size="sm"
                onClick={() => setUnitSystem("metric")}
                className={cn(
                  unitSystem === "metric" && "bg-accent text-accent-foreground"
                )}
              >
                Metric
              </Button>
            </div>
          </div>

          <Separator />

          {/* Temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Thermometer className="h-5 w-5 text-destructive" />
              <div>
                <Label className="text-base">Temperature</Label>
                <p className="text-sm text-muted-foreground">
                  {tempUnit === "fahrenheit" ? "Fahrenheit (°F)" : "Celsius (°C)"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={tempUnit === "fahrenheit" ? "default" : "outline"}
                size="sm"
                onClick={() => setTempUnit("fahrenheit")}
                className={cn(
                  tempUnit === "fahrenheit" && "bg-cyan text-cyan-foreground"
                )}
              >
                °F
              </Button>
              <Button
                variant={tempUnit === "celsius" ? "default" : "outline"}
                size="sm"
                onClick={() => setTempUnit("celsius")}
                className={cn(
                  tempUnit === "celsius" && "bg-cyan text-cyan-foreground"
                )}
              >
                °C
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Format Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple" />
            Time Format
          </CardTitle>
          <CardDescription>
            Choose how times are displayed throughout the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Time Display</Label>
              <p className="text-sm text-muted-foreground">
                {timeFormat === "12h" ? "12-hour (2:30 PM)" : "24-hour (14:30)"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={timeFormat === "12h" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeFormat("12h")}
                className={cn(
                  timeFormat === "12h" && "bg-purple text-white"
                )}
              >
                12h
              </Button>
              <Button
                variant={timeFormat === "24h" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeFormat("24h")}
                className={cn(
                  timeFormat === "24h" && "bg-purple text-white"
                )}
              >
                24h
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-20 md:bottom-6 left-0 right-0 px-4">
          <div className="max-w-2xl mx-auto">
            <Button
              className="w-full h-12 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-5 w-5" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

