"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn, formatDateTimeLocal, clampToNow } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DateTimeInputProps {
  value: Date;
  onChange: (date: Date) => void;
  /** If true, prevents selecting future dates/times (defaults to true) */
  disableFuture?: boolean;
  /** Optional className */
  className?: string;
  /** Optional label */
  label?: string;
}

/**
 * A datetime input that properly handles timezone formatting and optionally
 * prevents future date/time selection.
 */
export function DateTimeInput({
  value,
  onChange,
  disableFuture = true,
  className,
  label,
}: DateTimeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (disableFuture) {
      onChange(clampToNow(newDate));
    } else {
      onChange(newDate);
    }
  };

  return (
    <div className={cn("flex items-center justify-between py-3 border-b border-border", className)}>
      {label && <span className="text-muted-foreground">{label}</span>}
      <Input
        type="datetime-local"
        value={formatDateTimeLocal(value)}
        max={disableFuture ? formatDateTimeLocal(new Date()) : undefined}
        onChange={handleChange}
        className="w-auto bg-transparent border-0 text-right text-accent"
      />
    </div>
  );
}

interface DateTimeButtonProps {
  value: Date;
  onChange: (date: Date) => void;
  /** If true, prevents selecting future dates/times (defaults to true) */
  disableFuture?: boolean;
  /** Optional className for the trigger button */
  className?: string;
  /** Optional placeholder text */
  placeholder?: string;
}

/**
 * A button-style datetime picker that shows a formatted date and opens
 * the native datetime picker on click.
 */
export function DateTimeButton({
  value,
  onChange,
  disableFuture = true,
  className,
  placeholder = "Pick date and time",
}: DateTimeButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (disableFuture) {
      onChange(clampToNow(newDate));
    } else {
      onChange(newDate);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.showPicker()}
        className={cn(
          "justify-start text-left font-normal",
          !value && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? format(value, "MMM d, yyyy h:mm a") : placeholder}
      </Button>
      <Input
        ref={inputRef}
        type="datetime-local"
        value={formatDateTimeLocal(value)}
        max={disableFuture ? formatDateTimeLocal(new Date()) : undefined}
        onChange={handleChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
        tabIndex={-1}
      />
    </div>
  );
}

// Re-export for backwards compatibility
export { DateTimeInput as DateTimePicker };
