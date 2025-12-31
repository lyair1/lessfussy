"use client";

import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { useRouter } from "next/navigation";
import { Feeding } from "@/lib/db/schema";

interface LastFeedingProps {
  feeding: Feeding | null;
  babyId: string;
  babyName: string;
}

export function LastFeeding({ feeding, babyId, babyName }: LastFeedingProps) {
  const router = useRouter();

  if (!feeding) {
    return null;
  }

  const handleClick = () => {
    if (isActive) {
      router.push(`/baby/${babyId}/feeding`);
    } else {
      router.push(`/baby/${babyId}/history`);
    }
  };

  const formatFeedingDescription = () => {
    if (feeding.type === "bottle") {
      const amount = feeding.amount;
      const unit = feeding.amountUnit || "oz";
      if (amount) {
        return `${amount}${unit} bottle`;
      }
      return "bottle";
    } else if (feeding.type === "nursing") {
      // Calculate total duration in seconds
      const leftDuration = feeding.leftDuration || 0;
      const rightDuration = feeding.rightDuration || 0;
      const totalDuration = leftDuration + rightDuration;

      // Format duration based on whether it's less than or more than 1 minute
      if (totalDuration < 60) {
        // Less than 1 minute - show seconds
        return `breastfed for ${totalDuration} second${
          totalDuration !== 1 ? "s" : ""
        }`;
      } else {
        // 1 minute or more - show minutes
        const minutes = Math.floor(totalDuration / 60);
        return `breastfed for ${minutes} minute${minutes !== 1 ? "s" : ""}`;
      }
    }

    return "feeding";
  };

  const getFeedingSentence = () => {
    const timeStr = feeding.startTime.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    const feedingTime = feeding.endTime || feeding.startTime;
    const isTodayFeeding = isToday(feedingTime);

    if (isActive) {
      const timeAgo = formatTime();
      if (feeding.type === "bottle") {
        const description = formatFeedingDescription();
        return `${babyName} is currently having ${description} started at ${timeStr} (${timeAgo} ago)`;
      } else {
        return `${babyName} is currently breastfeeding started at ${timeStr} (${timeAgo} ago)`;
      }
    } else {
      if (feeding.type === "bottle") {
        const description = formatFeedingDescription();
        if (isTodayFeeding) {
          const timeAgo = formatDistanceToNow(feedingTime, {
            addSuffix: false,
          });
          return `${babyName} had ${description} ${timeAgo} ago (at ${timeStr} today)`;
        } else {
          const timeAgo = formatTime();
          return `${babyName} had ${description} at ${timeStr} (${timeAgo} ago)`;
        }
      } else {
        const description = formatFeedingDescription();
        if (isTodayFeeding) {
          const timeAgo = formatDistanceToNow(feedingTime, {
            addSuffix: false,
          });
          return `${babyName} ${description} ${timeAgo} ago (at ${timeStr} today)`;
        } else {
          const timeAgo = formatTime();
          return `${babyName} ${description} at ${timeStr} (${timeAgo} ago)`;
        }
      }
    }
  };

  const formatTime = () => {
    const feedingTime = feeding.endTime || feeding.startTime;

    if (isYesterday(feedingTime)) {
      return "yesterday";
    } else {
      return formatDistanceToNow(feedingTime, { addSuffix: true });
    }
  };

  const isActive = !feeding.endTime;

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {isActive ? "Current feeding" : "Last feeding"}
          </p>
          <p className="text-sm">{getFeedingSentence()}</p>
        </div>
      </div>
    </div>
  );
}
