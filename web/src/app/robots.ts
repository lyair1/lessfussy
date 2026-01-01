import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://lessfussy.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/baby/",      // Private baby tracking pages
          "/babies/",    // Baby management
          "/settings/",  // User settings
          "/track/",     // Tracking pages
          "/history/",   // History pages
          "/api/",       // API routes
          "/sign-in/",   // Auth pages (not valuable for SEO)
          "/sign-up/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

