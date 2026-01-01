import * as React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - LessFussy",
  description:
    "LessFussy Privacy Policy. Learn how we collect, use, and protect your personal information and your baby's data.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <article className="pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: January 1, 2025
          </p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Introduction
              </h2>
              <p className="text-muted-foreground">
                LessFussy (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to
                protecting your personal data. This privacy policy explains how we collect,
                use, and safeguard your information when you use our baby tracking application.
              </p>
              <p className="text-muted-foreground">
                We understand that tracking your baby&apos;s activities involves sensitive family
                information. We take this responsibility seriously and have designed our
                practices to protect your family&apos;s privacy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Information We Collect
              </h2>
              <h3 className="text-xl font-medium text-foreground mb-2">
                Information You Provide
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Account information (email address, name)</li>
                <li>Baby profile information (name, birth date)</li>
                <li>Tracking data (feedings, sleep, diapers, etc.)</li>
                <li>Notes and observations you add</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-2 mt-4">
                Information Collected Automatically
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Device information (device type, operating system)</li>
                <li>Usage data (features used, session duration)</li>
                <li>Log data (IP address, browser type, access times)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                How We Use Your Information
              </h2>
              <p className="text-muted-foreground mb-4">
                We use your information to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide and maintain our baby tracking service</li>
                <li>Sync your data across devices</li>
                <li>Enable sharing with caregivers you invite</li>
                <li>Send important service notifications</li>
                <li>Improve our app based on usage patterns</li>
                <li>Provide customer support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Data Sharing
              </h2>
              <p className="text-muted-foreground mb-4">
                <strong className="text-foreground">
                  We do not sell your personal data or your baby&apos;s data to third parties.
                </strong>
              </p>
              <p className="text-muted-foreground mb-4">
                We may share data only in these circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>With caregivers you explicitly invite to share access</li>
                <li>With service providers who help us operate (hosting, authentication)</li>
                <li>When required by law or to protect rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Data Security
              </h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Encryption in transit (HTTPS/TLS)</li>
                <li>Encryption at rest for stored data</li>
                <li>Secure authentication through Clerk</li>
                <li>Regular security audits</li>
                <li>Limited employee access to data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Data Retention
              </h2>
              <p className="text-muted-foreground">
                We retain your data for as long as your account is active. You can request
                deletion of your data at any time. Upon account deletion, we will remove
                your personal data within 30 days, except where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Your Rights
              </h2>
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data</li>
                <li>Export your data</li>
                <li>Object to certain processing</li>
                <li>Withdraw consent</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, contact us at privacy@lessfussy.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Children&apos;s Privacy
              </h2>
              <p className="text-muted-foreground">
                LessFussy is designed for parents and caregivers to track infant care.
                We do not knowingly collect data from children under 13. The baby data
                entered is controlled by the parent/guardian account holder.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                International Transfers
              </h2>
              <p className="text-muted-foreground">
                Your data may be processed in countries other than your own. We ensure
                appropriate safeguards are in place when transferring data internationally.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Changes to This Policy
              </h2>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. We will notify you
                of any significant changes by email or through the app. The updated policy
                will be effective when posted.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Contact Us
              </h2>
              <p className="text-muted-foreground">
                If you have questions about this privacy policy or our data practices,
                please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: privacy@lessfussy.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}

