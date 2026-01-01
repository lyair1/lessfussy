import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes - marketing site, blog, legal pages, auth, and webhooks
const isPublicRoute = createRouteMatcher([
  "/",
  "/features",
  "/pricing",
  "/about",
  "/blog(.*)",
  "/privacy",
  "/terms",
  "/cookies",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

// Protected routes - the actual app
const isProtectedRoute = createRouteMatcher([
  "/baby(.*)",
  "/babies(.*)",
  "/history(.*)",
  "/settings(.*)",
  "/track(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Protect app routes
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};


