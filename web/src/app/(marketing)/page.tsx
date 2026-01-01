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
  Sparkles,
  Users,
  Shield,
  Smartphone,
  Star,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "LessFussy - Simple Baby Tracking App for Modern Parents",
  description:
    "Track your baby's feeding, sleep, diapers, and milestones with ease. LessFussy is the beautiful, intuitive baby tracker that helps parents stay organized and stress-free.",
  keywords: [
    "baby tracker",
    "baby tracking app",
    "newborn tracker",
    "feeding tracker",
    "sleep tracker",
    "diaper tracker",
    "baby log",
    "parenting app",
  ],
  openGraph: {
    title: "LessFussy - Simple Baby Tracking App for Modern Parents",
    description:
      "Track your baby's feeding, sleep, diapers, and milestones with ease. The beautiful, intuitive baby tracker for stress-free parenting.",
    type: "website",
    url: "https://lessfussy.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "LessFussy - Simple Baby Tracking App",
    description: "The beautiful, intuitive baby tracker for stress-free parenting.",
  },
};

const features = [
  {
    icon: Utensils,
    title: "Feeding Tracker",
    description: "Log breastfeeding, bottles, and solids. Track which side, duration, and amounts.",
    color: "text-lime",
  },
  {
    icon: Moon,
    title: "Sleep Tracking",
    description: "Monitor naps and nighttime sleep. See patterns emerge over time.",
    color: "text-purple",
  },
  {
    icon: Droplets,
    title: "Diaper Changes",
    description: "Quick logging for wet and dirty diapers. Never miss a pattern.",
    color: "text-cyan",
  },
  {
    icon: Heart,
    title: "Pumping Sessions",
    description: "Track pumping duration and output. Perfect for working parents.",
    color: "text-pink",
  },
  {
    icon: Baby,
    title: "Growth Tracking",
    description: "Record weight, height, and head circumference. Watch them grow.",
    color: "text-coral",
  },
  {
    icon: Timer,
    title: "Activity Timer",
    description: "Built-in timers for feeding and tummy time. One-tap start.",
    color: "text-yellow",
  },
];

const steps = [
  {
    number: "01",
    title: "You Track",
    description:
      "Quickly log feedings, sleep, diapers, and more with our intuitive interface. Takes just seconds.",
  },
  {
    number: "02",
    title: "We Organize",
    description:
      "LessFussy automatically organizes your data into beautiful, easy-to-read timelines and summaries.",
  },
  {
    number: "03",
    title: "Baby Thrives",
    description:
      "Spot patterns, share with caregivers, and feel confident knowing you have the full picture.",
  },
];

const testimonials = [
  {
    quote:
      "Finally, a baby tracker that doesn't feel like a chore. The dark mode is perfect for those 3am feedings!",
    author: "Sarah M.",
    role: "Mom of twins",
    rating: 5,
  },
  {
    quote:
      "I love being able to share tracking with my partner. We're both on the same page now.",
    author: "James K.",
    role: "First-time dad",
    rating: 5,
  },
  {
    quote:
      "The simplicity is what sold me. No complicated features, just exactly what I need.",
    author: "Emily R.",
    role: "Mom of 3",
    rating: 5,
  },
];

const benefits = [
  {
    icon: Sparkles,
    title: "Beautiful & Simple",
    description: "No clutter, no confusion. Just a clean interface that works.",
  },
  {
    icon: Users,
    title: "Share with Family",
    description: "Invite partners, grandparents, or caregivers to track together.",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description: "Your family's data stays private. We never sell your information.",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    description: "Access from any device. Your data syncs instantly across all platforms.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Simple tracking for happy parents</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Track Your Baby&apos;s Day
              <br />
              <span className="text-primary">Without the Fuss</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Feeding, sleep, diapers, and more — all in one beautiful app. 
              LessFussy helps parents stay organized so you can focus on what matters most.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/sign-up">
                <Button size="lg" className="text-lg px-8 font-semibold w-full sm:w-auto">
                  Start Tracking Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/features">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 w-full sm:w-auto"
                >
                  See All Features
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow text-yellow" />
                  ))}
                </div>
                <span className="ml-1">4.9/5 rating</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <span>Trusted by 10,000+ parents</span>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <span>100% free to start</span>
            </div>
          </div>

          {/* App Preview Placeholder */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
              <div className="bg-card rounded-2xl border border-border shadow-2xl p-4 md:p-8">
                <div className="aspect-[16/9] bg-secondary rounded-xl flex items-center justify-center">
                  <div className="text-center p-8">
                    <Baby className="h-16 w-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">App preview coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start tracking in seconds. No complicated setup required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-border" />
                )}
                <div className="relative bg-card rounded-2xl p-6 md:p-8 border border-border">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Track
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From feedings to sleep to growth — all the tracking tools parents actually use.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300"
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary mb-4 ${feature.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Parents Love LessFussy
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We built LessFussy because we&apos;re parents too. We know you don&apos;t have 
                time for complicated apps — you need something that just works.
              </p>
              <div className="space-y-6">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={benefit.title} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">
                          {benefit.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <div className="relative bg-card rounded-2xl border border-border p-8">
                <div className="space-y-4">
                  {["Track feedings in seconds", "See sleep patterns at a glance", "Share with your partner", "Never miss a pattern"].map(
                    (item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-foreground">{item}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Loved by Parents Everywhere
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of families who track with LessFussy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 border border-border"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow text-yellow" />
                  ))}
                </div>
                <blockquote className="text-foreground mb-4">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Make Parenting a Little Easier?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of parents who use LessFussy to track their baby&apos;s day.
              Start for free — no credit card required.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8 font-semibold">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

