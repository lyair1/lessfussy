import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Baby,
  Moon,
  Utensils,
  Droplets,
  Heart,
  Timer,
  Thermometer,
  Pill,
  Activity,
  Users,
  Bell,
  BarChart3,
  Cloud,
  Smartphone,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features - LessFussy Baby Tracker App",
  description:
    "Discover all the features LessFussy offers: feeding tracking, sleep logs, diaper changes, pumping sessions, growth charts, and more. Everything parents need in one app.",
  openGraph: {
    title: "Features - LessFussy Baby Tracker App",
    description:
      "Discover all the features LessFussy offers for tracking your baby's day.",
    type: "website",
  },
};

const mainFeatures = [
  {
    icon: Utensils,
    title: "Feeding Tracker",
    description:
      "Track breastfeeding sessions with side switching, bottle feeds with amounts, and solid food introductions. Built-in timer makes logging effortless.",
    color: "text-lime",
    highlights: [
      "Breastfeeding with side tracking",
      "Bottle feeding with ml/oz amounts",
      "Solid food logging",
      "One-tap feeding timer",
    ],
  },
  {
    icon: Moon,
    title: "Sleep Tracking",
    description:
      "Monitor naps and nighttime sleep to understand your baby's patterns. See trends over time and get insights on sleep quality.",
    color: "text-purple",
    highlights: [
      "Nap and nighttime tracking",
      "Sleep duration summaries",
      "Pattern visualization",
      "Wake window tracking",
    ],
  },
  {
    icon: Droplets,
    title: "Diaper Changes",
    description:
      "Quick logging for wet and dirty diapers. Track patterns to ensure your baby is staying hydrated and healthy.",
    color: "text-cyan",
    highlights: [
      "Wet/dirty/mixed categories",
      "Daily diaper counts",
      "Pattern tracking",
      "Health monitoring",
    ],
  },
  {
    icon: Heart,
    title: "Pumping Sessions",
    description:
      "Perfect for pumping parents. Track duration, output, and build your milk stash inventory.",
    color: "text-pink",
    highlights: [
      "Session duration timer",
      "Output tracking (ml/oz)",
      "Left/right side logging",
      "Supply monitoring",
    ],
  },
  {
    icon: Baby,
    title: "Growth Tracking",
    description:
      "Record weight, height, and head circumference measurements. Watch your baby grow over time.",
    color: "text-coral",
    highlights: [
      "Weight tracking",
      "Height/length logging",
      "Head circumference",
      "Growth charts",
    ],
  },
  {
    icon: Thermometer,
    title: "Temperature Log",
    description:
      "Keep track of temperature readings when baby isn't feeling well. Have the data ready for doctor visits.",
    color: "text-yellow",
    highlights: [
      "Temperature logging",
      "Fever tracking",
      "Medical visit prep",
      "Historical records",
    ],
  },
  {
    icon: Pill,
    title: "Medicine Tracker",
    description:
      "Never miss a dose. Track medications with timing, dosage, and reminders.",
    color: "text-cyan",
    highlights: [
      "Medication logging",
      "Dosage tracking",
      "Time-based records",
      "Multiple medications",
    ],
  },
  {
    icon: Activity,
    title: "Activity & Milestones",
    description:
      "Log tummy time, playtime, and developmental milestones. Celebrate every achievement.",
    color: "text-lime",
    highlights: [
      "Tummy time tracking",
      "Milestone logging",
      "Activity notes",
      "Development tracking",
    ],
  },
];

const additionalFeatures = [
  {
    icon: Users,
    title: "Family Sharing",
    description: "Invite partners, grandparents, or caregivers to track together in real-time.",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description: "Your data syncs instantly across all devices. Never lose a single entry.",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    description: "Use on any device - phone, tablet, or computer. No app download required.",
  },
  {
    icon: BarChart3,
    title: "Insights & Trends",
    description: "See patterns in your baby's routine with beautiful, easy-to-read charts.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Get gentle reminders for feedings, medications, and other scheduled activities.",
  },
  {
    icon: Timer,
    title: "Built-in Timers",
    description: "One-tap timers for feeding, tummy time, and any activity that needs tracking.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Everything You Need to Track Your Baby&apos;s Day
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              From feedings to sleep to milestones — LessFussy has all the tools
              parents actually use, without the complexity you don&apos;t need.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="font-semibold">
                Start Tracking Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-16">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;
              return (
                <div
                  key={feature.title}
                  className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                    isEven ? "" : "lg:flex-row-reverse"
                  }`}
                >
                  <div className={isEven ? "" : "lg:order-2"}>
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-4 ${feature.color}`}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      {feature.title}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="text-foreground">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={isEven ? "lg:order-2" : ""}>
                    <div className="bg-card rounded-2xl border border-border p-8 aspect-video flex items-center justify-center">
                      <Icon className={`h-24 w-24 ${feature.color} opacity-50`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Plus So Much More
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              LessFussy is packed with features designed to make parenting easier.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {additionalFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-card rounded-xl p-6 border border-border"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of parents who track with LessFussy. It&apos;s free to start.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="font-semibold">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

