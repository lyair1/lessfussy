import * as React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - LessFussy",
  description:
    "LessFussy Terms of Service. Read our terms and conditions for using the LessFussy baby tracking application.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
  return (
    <article className="pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: January 1, 2025
          </p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground">
                By accessing or using LessFussy (&quot;the Service&quot;), you agree to be bound by
                these Terms of Service. If you do not agree to these terms, please do not
                use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                2. Description of Service
              </h2>
              <p className="text-muted-foreground">
                LessFussy is a baby tracking application that allows parents and caregivers
                to log and monitor their baby&apos;s activities including feeding, sleep,
                diaper changes, and developmental milestones.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                3. Account Registration
              </h2>
              <p className="text-muted-foreground mb-4">
                To use certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                4. User Conduct
              </h2>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Upload malicious code or content</li>
                <li>Impersonate others or misrepresent your affiliation</li>
                <li>Use the Service in a way that infringes others&apos; rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                5. Content and Data
              </h2>
              <p className="text-muted-foreground mb-4">
                <strong className="text-foreground">Your Content:</strong> You retain
                ownership of all data you enter into the Service. By using the Service,
                you grant us a limited license to store, process, and display your content
                as necessary to provide the Service.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Our Content:</strong> The Service,
                including its design, features, and content, is protected by copyright,
                trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                6. Sharing Features
              </h2>
              <p className="text-muted-foreground">
                The Service allows you to share access with other caregivers. You are
                responsible for managing who has access to your baby&apos;s data. We are not
                responsible for actions taken by users you invite.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                7. Medical Disclaimer
              </h2>
              <p className="text-muted-foreground">
                <strong className="text-foreground">
                  LessFussy is not a medical device and does not provide medical advice.
                </strong>{" "}
                The Service is intended for informational and organizational purposes only.
                Always consult a qualified healthcare provider for medical concerns about
                your baby. Do not delay seeking medical advice based on information from
                the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                8. Service Availability
              </h2>
              <p className="text-muted-foreground">
                We strive to provide reliable service but do not guarantee uninterrupted
                access. We may modify, suspend, or discontinue features with or without
                notice. We are not liable for any interruption or loss of access.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                9. Payment Terms
              </h2>
              <p className="text-muted-foreground">
                Certain features may require a paid subscription. Payment terms will be
                clearly disclosed at the time of purchase. Subscriptions renew automatically
                unless cancelled. Refunds are provided in accordance with applicable law
                and our refund policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                10. Limitation of Liability
              </h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, LessFussy and its affiliates shall
                not be liable for any indirect, incidental, special, consequential, or
                punitive damages, including loss of data, arising from your use of the
                Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                11. Disclaimer of Warranties
              </h2>
              <p className="text-muted-foreground">
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of
                any kind, either express or implied, including but not limited to implied
                warranties of merchantability, fitness for a particular purpose, or
                non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                12. Indemnification
              </h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless LessFussy from any claims,
                damages, losses, or expenses arising from your use of the Service or
                violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                13. Termination
              </h2>
              <p className="text-muted-foreground">
                You may terminate your account at any time. We may terminate or suspend
                your access for violation of these Terms or for any other reason at our
                discretion. Upon termination, your right to use the Service ceases immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                14. Changes to Terms
              </h2>
              <p className="text-muted-foreground">
                We may update these Terms from time to time. We will notify you of
                significant changes. Continued use of the Service after changes
                constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                15. Governing Law
              </h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the
                laws of the jurisdiction in which LessFussy operates, without regard
                to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                16. Contact
              </h2>
              <p className="text-muted-foreground">
                For questions about these Terms, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">Email: legal@lessfussy.com</p>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}

