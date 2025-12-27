import {
  pgTable,
  text,
  timestamp,
  uuid,
  date,
  real,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const unitSystemEnum = pgEnum("unit_system", ["imperial", "metric"]);
export const tempUnitEnum = pgEnum("temp_unit", ["fahrenheit", "celsius"]);
export const timeFormatEnum = pgEnum("time_format", ["12h", "24h"]);
export const shareRoleEnum = pgEnum("share_role", ["viewer", "editor"]);
export const feedingTypeEnum = pgEnum("feeding_type", ["nursing", "bottle"]);
export const bottleContentEnum = pgEnum("bottle_content", ["breast_milk", "formula"]);
export const nursingSideEnum = pgEnum("nursing_side", ["left", "right", "both"]);
export const diaperTypeEnum = pgEnum("diaper_type", ["pee", "poo", "mixed", "dry"]);
export const pottyTypeEnum = pgEnum("potty_type", ["sat_but_dry", "success", "accident"]);
export const moodEnum = pgEnum("mood", ["upset", "content"]);
export const sleepMethodEnum = pgEnum("sleep_method", [
  "on_own_in_bed",
  "nursing",
  "worn_or_held",
  "next_to_carer",
  "car_seat",
  "stroller",
  "other",
]);
export const fallAsleepTimeEnum = pgEnum("fall_asleep_time", [
  "under_10_min",
  "10_to_20_min",
  "over_20_min",
]);
export const activityTypeEnum = pgEnum("activity_type", [
  "bath",
  "tummy_time",
  "story_time",
  "screen_time",
  "skin_to_skin",
  "play",
  "outdoor",
  "other",
]);
export const medicineUnitEnum = pgEnum("medicine_unit", ["oz", "ml", "drops", "tsp"]);
export const solidReactionEnum = pgEnum("solid_reaction", [
  "loved_it",
  "meh",
  "hated_it",
  "allergy_or_sensitivity",
]);

// Users table - synced from Clerk
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  unitSystem: unitSystemEnum("unit_system").default("imperial").notNull(),
  tempUnit: tempUnitEnum("temp_unit").default("fahrenheit").notNull(),
  timeFormat: timeFormatEnum("time_format").default("12h").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Babies table
export const babies = pgTable("babies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  birthDate: date("birth_date"),
  photoUrl: text("photo_url"),
  ownerId: text("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Baby shares - for sharing babies between parents
export const babyShares = pgTable("baby_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  role: shareRoleEnum("role").default("editor").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Feedings table (both nursing and bottle)
export const feedings = pgTable("feedings", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  type: feedingTypeEnum("type").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  // For nursing
  side: nursingSideEnum("side"),
  leftDuration: integer("left_duration"), // seconds
  rightDuration: integer("right_duration"), // seconds
  // For bottle
  bottleContent: bottleContentEnum("bottle_content"),
  amount: real("amount"), // in oz or ml based on user preference
  amountUnit: text("amount_unit"), // "oz" or "ml"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sleep logs
export const sleepLogs = pgTable("sleep_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  startMood: moodEnum("start_mood"),
  endMood: moodEnum("end_mood"),
  fallAsleepTime: fallAsleepTimeEnum("fall_asleep_time"),
  sleepMethod: sleepMethodEnum("sleep_method"),
  wokeUpChild: boolean("woke_up_child"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Diapers
export const diapers = pgTable("diapers", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  time: timestamp("time").notNull(),
  type: diaperTypeEnum("type").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Potty logs
export const pottyLogs = pgTable("potty_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  time: timestamp("time").notNull(),
  type: pottyTypeEnum("type").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pumping logs
export const pumpings = pgTable("pumpings", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  startTime: timestamp("start_time").notNull(),
  duration: integer("duration"), // seconds
  leftAmount: real("left_amount"),
  rightAmount: real("right_amount"),
  totalAmount: real("total_amount"),
  amountUnit: text("amount_unit"), // "oz" or "ml"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Medicine logs
export const medicines = pgTable("medicines", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  time: timestamp("time").notNull(),
  name: text("name"),
  amount: real("amount"),
  unit: medicineUnitEnum("unit"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Temperature logs
export const temperatures = pgTable("temperatures", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  time: timestamp("time").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(), // "F" or "C"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity logs
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  type: activityTypeEnum("type").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Growth logs
export const growthLogs = pgTable("growth_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").notNull(),
  time: timestamp("time"),
  weight: real("weight"),
  weightUnit: text("weight_unit"), // "lb" or "kg"
  height: real("height"),
  heightUnit: text("height_unit"), // "in" or "cm"
  headCircumference: real("head_circumference"),
  headUnit: text("head_unit"), // "in" or "cm"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Solids (solid food) logs
export const solids = pgTable("solids", {
  id: uuid("id").primaryKey().defaultRandom(),
  babyId: uuid("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  time: timestamp("time").notNull(),
  foods: text("foods").array(), // Array of food names
  reaction: solidReactionEnum("reaction"),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  babies: many(babies),
  babyShares: many(babyShares),
}));

export const babiesRelations = relations(babies, ({ one, many }) => ({
  owner: one(users, {
    fields: [babies.ownerId],
    references: [users.id],
  }),
  shares: many(babyShares),
  feedings: many(feedings),
  sleepLogs: many(sleepLogs),
  diapers: many(diapers),
  pottyLogs: many(pottyLogs),
  pumpings: many(pumpings),
  medicines: many(medicines),
  temperatures: many(temperatures),
  activities: many(activities),
  growthLogs: many(growthLogs),
  solids: many(solids),
}));

export const babySharesRelations = relations(babyShares, ({ one }) => ({
  baby: one(babies, {
    fields: [babyShares.babyId],
    references: [babies.id],
  }),
  user: one(users, {
    fields: [babyShares.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Baby = typeof babies.$inferSelect;
export type NewBaby = typeof babies.$inferInsert;
export type BabyShare = typeof babyShares.$inferSelect;
export type Feeding = typeof feedings.$inferSelect;
export type NewFeeding = typeof feedings.$inferInsert;
export type SleepLog = typeof sleepLogs.$inferSelect;
export type NewSleepLog = typeof sleepLogs.$inferInsert;
export type Diaper = typeof diapers.$inferSelect;
export type NewDiaper = typeof diapers.$inferInsert;
export type PottyLog = typeof pottyLogs.$inferSelect;
export type Pumping = typeof pumpings.$inferSelect;
export type NewPumping = typeof pumpings.$inferInsert;
export type Medicine = typeof medicines.$inferSelect;
export type Temperature = typeof temperatures.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type GrowthLog = typeof growthLogs.$inferSelect;
export type Solid = typeof solids.$inferSelect;

