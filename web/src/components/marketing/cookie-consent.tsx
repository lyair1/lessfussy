"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "lessfussy-cookie-consent";

type ConsentType = "all" | "essential" | null;

export function CookieConsent() {
  const [showBanner, setShowBanner] = React.useState(false);
  const [showPreferences, setShowPreferences] = React.useState(false);

  React.useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (type: ConsentType) => {
    if (type) {
      localStorage.setItem(COOKIE_CONSENT_KEY, type);
      // Here you would initialize analytics based on consent
      if (type === "all") {
        // Initialize all tracking (Google Analytics, etc.)
        initializeAnalytics();
      }
    }
    setShowBanner(false);
    setShowPreferences(false);
  };

  const initializeAnalytics = () => {
    // This is where you'd initialize Google Analytics or other tracking
    // For example:
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('consent', 'update', {
    //     analytics_storage: 'granted',
    //     ad_storage: 'granted',
    //   });
    // }
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Main Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
      >
        <div className="container mx-auto max-w-4xl">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2
                  id="cookie-consent-title"
                  className="text-lg font-semibold text-foreground mb-2"
                >
                  We Value Your Privacy
                </h2>
                <p
                  id="cookie-consent-description"
                  className="text-sm text-muted-foreground mb-4"
                >
                  We use cookies to enhance your browsing experience, analyze site traffic,
                  and personalize content. By clicking &quot;Accept All&quot;, you consent to our use
                  of cookies. Read our{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/cookies" className="text-primary hover:underline">
                    Cookie Policy
                  </Link>{" "}
                  for more information.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleConsent("all")}
                    className="font-semibold"
                  >
                    Accept All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleConsent("essential")}
                  >
                    Essential Only
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowPreferences(true)}
                  >
                    Manage Preferences
                  </Button>
                </div>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Close cookie banner"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-labelledby="preferences-title"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2
                  id="preferences-title"
                  className="text-xl font-semibold text-foreground"
                >
                  Cookie Preferences
                </h2>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-muted-foreground hover:text-foreground p-1"
                  aria-label="Close preferences"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Essential Cookies */}
                <div className="pb-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-foreground">Essential Cookies</h3>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                      Always Active
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    These cookies are necessary for the website to function and cannot be
                    switched off. They are usually set in response to actions you take,
                    such as setting your privacy preferences or logging in.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="pb-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-foreground">Analytics Cookies</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked
                        id="analytics-cookies"
                      />
                      <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    These cookies help us understand how visitors interact with our website
                    by collecting and reporting information anonymously. This helps us improve
                    our website.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-foreground">Marketing Cookies</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        id="marketing-cookies"
                      />
                      <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    These cookies may be set through our site by our advertising partners.
                    They may be used to build a profile of your interests and show you
                    relevant ads on other sites.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={() => handleConsent("all")} className="flex-1">
                  Accept All
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleConsent("essential")}
                  className="flex-1"
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

