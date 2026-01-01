import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing - LessFussy Baby Tracker",
  description:
    "LessFussy is free to use for all parents. Track your baby's feeding, sleep, and diapers without any cost. See our pricing for premium features.",
  openGraph: {
    title: "Pricing - LessFussy Baby Tracker",
    description: "LessFussy is free to use for all parents.",
    type: "website",
  },
};

const freeFeatures = [
  "Unlimited baby profiles",
  "Feeding tracking (breast, bottle, solids)",
  "Sleep tracking with timers",
  "Diaper change logging",
  "Pumping session tracking",
  "Growth measurements",
  "Temperature and medicine logs",
  "Activity and milestone tracking",
  "Share with 2 caregivers",
  "7-day history view",
  "Cloud sync across devices",
];

const premiumFeatures = [
  "Everything in Free, plus:",
  "Unlimited caregiver sharing",
  "Full history access",
  "Advanced insights and charts",
  "Export data (CSV, PDF)",
  "Smart pattern detection",
  "Customizable reminders",
  "Priority support",
  "Early access to new features",
];

export default function PricingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Simple, transparent pricing</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Start Free, Upgrade When Ready
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              LessFussy is completely free for most families. Premium is available 
              for power users who want extra features.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-card rounded-2xl border border-border p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Free</h2>
                <p className="text-muted-foreground">
                  Everything you need to track your baby&apos;s day.
                </p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
              <Link href="/sign-up" className="block mb-8">
                <Button className="w-full font-semibold" size="lg">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <ul className="space-y-3">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium Plan */}
            <div className="bg-card rounded-2xl border-2 border-primary p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Premium</h2>
                <p className="text-muted-foreground">
                  For families who want advanced features.
                </p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">$4.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <Button 
                className="w-full font-semibold mb-8" 
                size="lg" 
                variant="outline"
                disabled
              >
                Coming Soon
              </Button>
              <ul className="space-y-3">
                {premiumFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Is LessFussy really free?
                </h3>
                <p className="text-muted-foreground">
                  Yes! The free plan includes all the core tracking features most families need. 
                  We believe every parent deserves access to quality baby tracking tools.
                </p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  What happens to my data if I don&apos;t upgrade?
                </h3>
                <p className="text-muted-foreground">
                  Your data is always safe with us. Free users have access to 7 days of history, 
                  but all data is stored securely. Upgrade anytime to access your full history.
                </p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Can I cancel Premium anytime?
                </h3>
                <p className="text-muted-foreground">
                  Absolutely. Premium is month-to-month with no long-term commitment. 
                  Cancel anytime and you&apos;ll keep premium features until the end of your billing period.
                </p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Is my baby&apos;s data private?
                </h3>
                <p className="text-muted-foreground">
                  Your family&apos;s data is completely private. We never sell your data or show you ads. 
                  See our Privacy Policy for complete details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

