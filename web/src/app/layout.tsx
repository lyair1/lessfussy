import * as React from "react";
import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "LessFussy - Simple Baby Tracking App for Modern Parents",
    template: "%s | LessFussy",
  },
  description:
    "Track your baby's feeding, sleep, diapers, and milestones with ease. LessFussy is the beautiful, intuitive baby tracker that helps parents stay organized.",
  keywords: [
    "baby tracker",
    "baby tracking app",
    "newborn tracker",
    "feeding tracker",
    "sleep tracker",
    "diaper tracker",
    "baby log",
    "parenting app",
    "baby care",
    "infant tracker",
  ],
  authors: [{ name: "LessFussy" }],
  creator: "LessFussy",
  publisher: "LessFussy",
  metadataBase: new URL("https://lessfussy.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lessfussy.com",
    siteName: "LessFussy",
    title: "LessFussy - Simple Baby Tracking App for Modern Parents",
    description:
      "Track your baby's feeding, sleep, diapers, and milestones with ease. The beautiful, intuitive baby tracker for stress-free parenting.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LessFussy - Baby Tracking App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LessFussy - Simple Baby Tracking App",
    description: "The beautiful, intuitive baby tracker for stress-free parenting.",
    images: ["/og-image.png"],
    creator: "@lessfussy",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LessFussy",
  },
  verification: {
    // Add your verification codes here
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1f2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${nunito.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="lessfussy-theme"
          >
            {children}
            <Toaster position="bottom-left" richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
