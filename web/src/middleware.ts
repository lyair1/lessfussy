import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Public routes - marketing site, blog, legal pages, auth, and webhooks
const publicRoutes = [
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
];

// Protected routes - the actual app
const protectedRoutes = [
  "/baby(.*)",
  "/babies(.*)",
  "/dashboard(.*)",
  "/history(.*)",
  "/settings(.*)",
  "/track(.*)",
];

function matches(pathname: string, patterns: string[]) {
  return patterns.some((pattern) => {
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(pathname);
  });
}

export default async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  if (matches(pathname, protectedRoutes) && !matches(pathname, publicRoutes)) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
