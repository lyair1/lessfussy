-- Add fields for active pumping session tracking
ALTER TABLE "pumpings" ADD COLUMN "end_time" timestamp;--> statement-breakpoint
ALTER TABLE "pumpings" ADD COLUMN "last_persisted_at" timestamp;--> statement-breakpoint
ALTER TABLE "pumpings" ADD COLUMN "current_status" text;


