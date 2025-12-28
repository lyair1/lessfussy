CREATE TYPE "public"."activity_type" AS ENUM('bath', 'tummy_time', 'story_time', 'screen_time', 'skin_to_skin', 'play', 'outdoor', 'other');--> statement-breakpoint
CREATE TYPE "public"."bottle_content" AS ENUM('breast_milk', 'formula');--> statement-breakpoint
CREATE TYPE "public"."diaper_type" AS ENUM('pee', 'poo', 'mixed', 'dry');--> statement-breakpoint
CREATE TYPE "public"."fall_asleep_time" AS ENUM('under_10_min', '10_to_20_min', 'over_20_min');--> statement-breakpoint
CREATE TYPE "public"."feeding_type" AS ENUM('nursing', 'bottle');--> statement-breakpoint
CREATE TYPE "public"."medicine_unit" AS ENUM('oz', 'ml', 'drops', 'tsp');--> statement-breakpoint
CREATE TYPE "public"."mood" AS ENUM('upset', 'content');--> statement-breakpoint
CREATE TYPE "public"."nursing_side" AS ENUM('left', 'right', 'both');--> statement-breakpoint
CREATE TYPE "public"."potty_type" AS ENUM('sat_but_dry', 'success', 'accident');--> statement-breakpoint
CREATE TYPE "public"."share_role" AS ENUM('viewer', 'editor');--> statement-breakpoint
CREATE TYPE "public"."sleep_method" AS ENUM('on_own_in_bed', 'nursing', 'worn_or_held', 'next_to_carer', 'car_seat', 'stroller', 'other');--> statement-breakpoint
CREATE TYPE "public"."solid_reaction" AS ENUM('loved_it', 'meh', 'hated_it', 'allergy_or_sensitivity');--> statement-breakpoint
CREATE TYPE "public"."temp_unit" AS ENUM('fahrenheit', 'celsius');--> statement-breakpoint
CREATE TYPE "public"."time_format" AS ENUM('12h', '24h');--> statement-breakpoint
CREATE TYPE "public"."unit_system" AS ENUM('imperial', 'metric');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"type" "activity_type" NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "babies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"birth_date" date,
	"photo_url" text,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "baby_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "share_role" DEFAULT 'editor' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diapers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"time" timestamp NOT NULL,
	"type" "diaper_type" NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"type" "feeding_type" NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"side" "nursing_side",
	"left_duration" integer,
	"right_duration" integer,
	"paused_duration" integer,
	"last_persisted_at" timestamp,
	"current_status" text,
	"bottle_content" "bottle_content",
	"amount" real,
	"amount_unit" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "growth_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"date" date NOT NULL,
	"time" timestamp,
	"weight" real,
	"weight_unit" text,
	"height" real,
	"height_unit" text,
	"head_circumference" real,
	"head_unit" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"time" timestamp NOT NULL,
	"name" text,
	"amount" real,
	"unit" "medicine_unit",
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "potty_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"time" timestamp NOT NULL,
	"type" "potty_type" NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pumpings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"start_time" timestamp NOT NULL,
	"duration" integer,
	"left_amount" real,
	"right_amount" real,
	"total_amount" real,
	"amount_unit" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sleep_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"start_mood" "mood",
	"end_mood" "mood",
	"fall_asleep_time" "fall_asleep_time",
	"sleep_method" "sleep_method",
	"woke_up_child" boolean,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"time" timestamp NOT NULL,
	"foods" text[],
	"reaction" "solid_reaction",
	"photo_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temperatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"baby_id" uuid NOT NULL,
	"time" timestamp NOT NULL,
	"value" real NOT NULL,
	"unit" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"image_url" text,
	"unit_system" "unit_system" DEFAULT 'imperial' NOT NULL,
	"temp_unit" "temp_unit" DEFAULT 'fahrenheit' NOT NULL,
	"time_format" time_format DEFAULT '12h' NOT NULL,
	"favorite_activities" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "babies" ADD CONSTRAINT "babies_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baby_shares" ADD CONSTRAINT "baby_shares_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baby_shares" ADD CONSTRAINT "baby_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diapers" ADD CONSTRAINT "diapers_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedings" ADD CONSTRAINT "feedings_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_logs" ADD CONSTRAINT "growth_logs_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "potty_logs" ADD CONSTRAINT "potty_logs_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pumpings" ADD CONSTRAINT "pumpings_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sleep_logs" ADD CONSTRAINT "sleep_logs_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solids" ADD CONSTRAINT "solids_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temperatures" ADD CONSTRAINT "temperatures_baby_id_babies_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."babies"("id") ON DELETE cascade ON UPDATE no action;