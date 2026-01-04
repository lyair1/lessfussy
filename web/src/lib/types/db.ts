export type Baby = {
  id: string;
  name: string;
  birthDate: string | null;
  photoUrl: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  unitSystem: "imperial" | "metric";
  tempUnit: "fahrenheit" | "celsius";
  timeFormat: "12h" | "24h";
  favoriteActivities: string[] | null;
  createdAt: string;
  updatedAt: string;
};

export type Feeding = {
  id: string;
  babyId: string;
  type: "nursing" | "bottle";
  startTime: Date;
  endTime: Date | null;
  side: "left" | "right" | "both" | null;
  leftDuration: number | null;
  rightDuration: number | null;
  pausedDuration: number | null;
  lastPersistedAt: Date | null;
  currentStatus: string | null;
  bottleContent: "breast_milk" | "formula" | null;
  amount: number | null;
  amountUnit: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SleepLog = {
  id: string;
  babyId: string;
  startTime: Date;
  endTime: Date | null;
  startMood: "upset" | "content" | null;
  endMood: "upset" | "content" | null;
  fallAsleepTime: "under_10_min" | "10_to_20_min" | "over_20_min" | null;
  sleepMethod:
    | "on_own_in_bed"
    | "nursing"
    | "worn_or_held"
    | "next_to_carer"
    | "car_seat"
    | "stroller"
    | "other"
    | null;
  wokeUpChild: boolean | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Diaper = {
  id: string;
  babyId: string;
  time: Date;
  type: "pee" | "poo" | "mixed" | "dry";
  notes: string | null;
  createdAt: Date;
};

export type PottyLog = {
  id: string;
  babyId: string;
  time: Date;
  type: "sat_but_dry" | "success" | "accident";
  notes: string | null;
  createdAt: Date;
};

export type Pumping = {
  id: string;
  babyId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  lastPersistedAt: Date | null;
  currentStatus: string | null;
  leftAmount: number | null;
  rightAmount: number | null;
  totalAmount: number | null;
  amountUnit: string | null;
  notes: string | null;
  createdAt: Date;
};

export type Medicine = {
  id: string;
  babyId: string;
  time: Date;
  name: string | null;
  amount: number | null;
  unit: "oz" | "ml" | "drops" | "tsp" | null;
  notes: string | null;
  createdAt: Date;
};

export type Temperature = {
  id: string;
  babyId: string;
  time: Date;
  value: number;
  unit: string;
  notes: string | null;
  createdAt: Date;
};

export type Activity = {
  id: string;
  babyId: string;
  startTime: Date;
  endTime: Date | null;
  type:
    | "bath"
    | "tummy_time"
    | "story_time"
    | "screen_time"
    | "skin_to_skin"
    | "play"
    | "outdoor"
    | "other";
  notes: string | null;
  createdAt: Date;
};

export type GrowthLog = {
  id: string;
  babyId: string;
  date: string;
  time: Date | null;
  weight: number | null;
  weightUnit: string | null;
  height: number | null;
  heightUnit: string | null;
  headCircumference: number | null;
  headUnit: string | null;
  notes: string | null;
  createdAt: Date;
};

export type Solid = {
  id: string;
  babyId: string;
  time: Date;
  foods: string[] | null;
  reaction: "loved_it" | "meh" | "hated_it" | "allergy_or_sensitivity" | null;
  photoUrl: string | null;
  notes: string | null;
  createdAt: Date;
};

export type NewFeeding = Omit<Feeding, "id" | "createdAt" | "updatedAt">;
export type NewSleepLog = Omit<SleepLog, "id" | "createdAt" | "updatedAt">;
export type NewDiaper = Omit<Diaper, "id" | "createdAt">;
export type NewPumping = Omit<Pumping, "id" | "createdAt">;
