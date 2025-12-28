"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatDateTimeLocal, clampToNow } from "@/lib/utils";

/**
 * Header component for tracking pages with back button and title
 */
interface TrackingHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

export function TrackingHeader({ title, rightElement }: TrackingHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-6">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <X className="h-6 w-6" />
      </Button>
      <h1 className="text-xl font-bold">{title}</h1>
      {rightElement ?? <div className="w-10" />}
    </div>
  );
}

/**
 * Container for tracking page content
 */
interface TrackingContainerProps {
  children: React.ReactNode;
}

export function TrackingContainer({ children }: TrackingContainerProps) {
  return <div className="max-w-lg mx-auto">{children}</div>;
}

/**
 * Content wrapper with consistent spacing
 */
interface TrackingContentProps {
  children: React.ReactNode;
  className?: string;
}

export function TrackingContent({ children, className }: TrackingContentProps) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}

/**
 * DateTime input row for tracking pages
 */
interface DateTimeRowProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  disableFuture?: boolean;
}

export function DateTimeRow({
  label,
  value,
  onChange,
  disableFuture = true,
}: DateTimeRowProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (disableFuture) {
      onChange(clampToNow(newDate));
    } else {
      onChange(newDate);
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border">
      <span className="text-muted-foreground">{label}</span>
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

/**
 * Notes input field for tracking pages
 */
interface NotesInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  id?: string;
}

export function NotesInput({
  value,
  onChange,
  label = "Notes (optional)",
  placeholder = "Add notes...",
  id = "notes",
}: NotesInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-background"
      />
    </div>
  );
}

/**
 * Save button for tracking pages
 */
interface SaveButtonProps {
  onClick: () => void;
  saving: boolean;
  disabled?: boolean;
  label?: string;
  savingLabel?: string;
}

export function SaveButton({
  onClick,
  saving,
  disabled = false,
  label = "Save",
  savingLabel = "Saving...",
}: SaveButtonProps) {
  return (
    <Button
      className="w-full h-14 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
      onClick={onClick}
      disabled={saving || disabled}
    >
      {saving ? savingLabel : label}
    </Button>
  );
}

/**
 * A labeled row with content on the right
 */
interface LabeledRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function LabeledRow({ label, children, className }: LabeledRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3 border-b border-border",
        className
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

/**
 * Hook to get babyId from params and router
 */
export function useTrackingPage() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  const goBack = (babyId: string) => {
    router.push(`/baby/${babyId}`);
  };

  return { router, saving, setSaving, goBack };
}

