import * as React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy - LessFussy",
  description:
    "LessFussy Cookie Policy. Learn about the cookies we use and how to manage your cookie preferences.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function CookiePolicyPage() {
  return (
    <article className="pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: January 1, 2025
          </p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                What Are Cookies?
              </h2>
              <p className="text-muted-foreground">
                Cookies are small text files that are stored on your device when you visit
                a website. They are widely used to make websites work more efficiently and
                to provide information to website owners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                How We Use Cookies
              </h2>
              <p className="text-muted-foreground mb-4">
                LessFussy uses cookies for the following purposes:
              </p>

              <h3 className="text-xl font-medium text-foreground mb-2">
                Essential Cookies
              </h3>
              <p className="text-muted-foreground mb-4">
                These cookies are necessary for the website to function properly. They
                enable core functionality such as security, account authentication, and
                remembering your login status. You cannot opt out of these cookies.
              </p>
              <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="pb-2 text-foreground">Cookie</th>
                      <th className="pb-2 text-foreground">Purpose</th>
                      <th className="pb-2 text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2">__clerk_*</td>
                      <td className="py-2">Authentication</td>
                      <td className="py-2">Session</td>
                    </tr>
                    <tr>
                      <td className="py-2">lessfussy-theme</td>
                      <td className="py-2">Theme preference</td>
                      <td className="py-2">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-medium text-foreground mb-2">
                Analytics Cookies
              </h3>
              <p className="text-muted-foreground mb-4">
                These cookies help us understand how visitors use our website by collecting
                and reporting information anonymously. This helps us improve our website
                and services.
              </p>
              <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="pb-2 text-foreground">Cookie</th>
                      <th className="pb-2 text-foreground">Purpose</th>
                      <th className="pb-2 text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2">_ga</td>
                      <td className="py-2">Google Analytics</td>
                      <td className="py-2">2 years</td>
                    </tr>
                    <tr>
                      <td className="py-2">_ga_*</td>
                      <td className="py-2">Google Analytics</td>
                      <td className="py-2">2 years</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-medium text-foreground mb-2">
                Preference Cookies
              </h3>
              <p className="text-muted-foreground mb-4">
                These cookies remember your preferences and settings to provide a more
                personalized experience.
              </p>
              <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="pb-2 text-foreground">Cookie</th>
                      <th className="pb-2 text-foreground">Purpose</th>
                      <th className="pb-2 text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr>
                      <td className="py-2">lessfussy-cookie-consent</td>
                      <td className="py-2">Cookie preferences</td>
                      <td className="py-2">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Third-Party Cookies
              </h2>
              <p className="text-muted-foreground mb-4">
                Some cookies are placed by third-party services that appear on our pages:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>
                  <strong className="text-foreground">Clerk</strong> - Provides secure
                  authentication services
                </li>
                <li>
                  <strong className="text-foreground">Google Analytics</strong> - Helps us
                  understand website usage (if analytics cookies are accepted)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Managing Cookies
              </h2>
              <p className="text-muted-foreground mb-4">
                You can manage your cookie preferences in several ways:
              </p>

              <h3 className="text-xl font-medium text-foreground mb-2">
                Our Cookie Banner
              </h3>
              <p className="text-muted-foreground mb-4">
                When you first visit our site, you&apos;ll see a cookie consent banner. You can
                accept all cookies, accept only essential cookies, or customize your
                preferences.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-2">
                Browser Settings
              </h3>
              <p className="text-muted-foreground mb-4">
                Most browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Block all cookies</li>
                <li>Accept all cookies</li>
                <li>Delete existing cookies</li>
                <li>Block third-party cookies</li>
              </ul>
              <p className="text-muted-foreground">
                Note: Blocking essential cookies may prevent you from using certain features
                of our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Do Not Track
              </h2>
              <p className="text-muted-foreground">
                Some browsers have a &quot;Do Not Track&quot; feature that signals to websites that
                you don&apos;t want your online activity tracked. We respect Do Not Track signals
                and will not load analytics cookies when this setting is enabled.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Updates to This Policy
              </h2>
              <p className="text-muted-foreground">
                We may update this Cookie Policy from time to time to reflect changes in
                our practices or for operational, legal, or regulatory reasons. The updated
                policy will be effective when posted, and the &quot;last updated&quot; date will be
                revised accordingly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Contact Us
              </h2>
              <p className="text-muted-foreground">
                If you have questions about our use of cookies, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">Email: privacy@lessfussy.com</p>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}

