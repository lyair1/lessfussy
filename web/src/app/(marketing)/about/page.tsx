import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us - LessFussy Baby Tracker",
  description:
    "LessFussy was built by parents, for parents. Learn about our mission to make baby tracking simple and stress-free for families everywhere.",
  openGraph: {
    title: "About Us - LessFussy Baby Tracker",
    description:
      "LessFussy was built by parents, for parents. Learn about our mission.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
              <Heart className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Built by Parents, for Parents
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              We created LessFussy because we needed it ourselves. No complicated features, 
              no overwhelming options — just simple, beautiful baby tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-muted-foreground mb-6">
                When our first child was born, we tried every baby tracking app we could find. 
                They were either too complicated, too ugly, or too expensive. Some had so many 
                features we never needed that finding the basics became a chore.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                We wanted something simple. Something that looked good at 3am when we&apos;re 
                half-asleep trying to log a feeding. Something that just worked.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                So we built LessFussy — a baby tracker that focuses on what matters. 
                Quick logging, beautiful design, and the features parents actually use. 
                Nothing more, nothing less.
              </p>
              <p className="text-lg text-muted-foreground">
                Today, thousands of families use LessFussy to track their little ones. 
                We&apos;re proud to be part of their parenting journey, and we&apos;re committed 
                to keeping LessFussy simple, beautiful, and accessible to all families.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
              What We Believe
            </h2>
            <div className="grid gap-8">
              <div className="bg-card rounded-2xl p-8 border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Simplicity Over Features
                </h3>
                <p className="text-muted-foreground">
                  We&apos;d rather do a few things really well than everything poorly. 
                  Every feature we add must serve a real need without adding complexity.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-8 border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Privacy First
                </h3>
                <p className="text-muted-foreground">
                  Your baby&apos;s data is yours alone. We will never sell your data, 
                  show you ads, or share your information with third parties.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-8 border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Accessible to Everyone
                </h3>
                <p className="text-muted-foreground">
                  Every family deserves access to quality baby tracking tools. 
                  That&apos;s why our core features will always be free.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-8 border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Design Matters
                </h3>
                <p className="text-muted-foreground">
                  Parenting is hard enough. Your tools should be beautiful and 
                  pleasant to use, even at 3am.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Join the LessFussy Family
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start tracking your baby&apos;s day with the app built by parents who get it.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="font-semibold">
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

