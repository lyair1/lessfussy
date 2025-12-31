import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a Date object for use with datetime-local input.
 * Uses local timezone (not UTC) to ensure the displayed time matches user expectations.
 */
export function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format a Date object for use with date input.
 * Uses local timezone (not UTC) to ensure the displayed date matches user expectations.
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object for use with time input.
 * Uses local timezone (not UTC) to ensure the displayed time matches user expectations.
 */
export function formatTimeLocal(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Parse a datetime-local input value to a Date object.
 * The input value is in local timezone format (YYYY-MM-DDTHH:MM).
 */
export function parseDateTimeLocal(value: string): Date {
  return new Date(value);
}

/**
 * Parse date and time input values to a Date object.
 * Both values are in local timezone format.
 */
export function parseDateAndTimeLocal(dateValue: string, timeValue: string): Date {
  return new Date(`${dateValue}T${timeValue}`);
}

/**
 * Clamp a date to not be in the future (relative to now).
 * Returns the original date if it's in the past, otherwise returns now.
 */
export function clampToNow(date: Date): Date {
  const now = new Date();
  return date > now ? now : date;
}

/**
 * Check if a date is in the future.
 */
export function isInFuture(date: Date): boolean {
  return date > new Date();
}

export type ActivityType =
  | "feeding"
  | "sleep"
  | "diaper"
  | "pumping"
  | "medicine"
  | "temperature"
  | "activity"
  | "growth"
  | "potty"
  | "solids";

export interface ActiveActivity {
  id: string;
  type: ActivityType;
  startTime: Date;
  description: string;
}

export interface Conflict {
  type: "active_conflict" | "logical_conflict";
  message: string;
  conflictingActivities: ActiveActivity[];
  canOverride: boolean;
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflicts: Conflict[];
}

/**
 * Get a user-friendly description of an activity type
 */
export function getActivityDescription(type: ActivityType): string {
  const descriptions: Record<ActivityType, string> = {
    feeding: "feeding",
    sleep: "sleep",
    diaper: "diaper change",
    pumping: "pumping",
    medicine: "medicine",
    temperature: "temperature check",
    activity: "activity",
    growth: "growth measurement",
    potty: "potty training",
    solids: "solid food",
  };
  return descriptions[type];
}
