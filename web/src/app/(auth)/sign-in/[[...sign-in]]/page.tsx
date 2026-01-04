import Link from "next/link";
import { signInWithPassword, sendMagicLink } from "@/lib/actions/auth";

export default function SignInPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const redirectTo =
    typeof searchParams.redirect === "string" ? searchParams.redirect : "";
  const error =
    typeof searchParams.error === "string" ? searchParams.error : "";
  const magicSent = searchParams.magic === "sent";
  const signupCheckEmail = searchParams.signup === "check-email";
  const signupEmail =
    typeof searchParams.email === "string" ? searchParams.email : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg
              width="48"
              height="48"
              viewBox="0 0 100 100"
              className="text-primary"
              aria-hidden="true"
            >
              {/* Baby face */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="currentColor"
                opacity="0.15"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              {/* Happy closed eyes (sleeping/content) */}
              <path
                d="M30 42 Q35 48 40 42"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M60 42 Q65 48 70 42"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Rosy cheeks */}
              <circle cx="25" cy="55" r="6" fill="currentColor" opacity="0.3" />
              <circle cx="75" cy="55" r="6" fill="currentColor" opacity="0.3" />
              {/* Big content smile */}
              <path
                d="M35 60 Q50 78 65 60"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Tiny hair curl */}
              <path
                d="M50 10 Q55 5 52 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M45 12 Q40 6 44 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <h1 className="text-3xl font-bold text-primary">LessFussy</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back! Sign in to continue tracking.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          {error ? (
            <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {signupCheckEmail ? (
            <div className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
              Check your email{signupEmail ? ` (${signupEmail})` : ""} for a
              confirmation link.
            </div>
          ) : null}

          {magicSent ? (
            <div className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
              Magic link sent. Check your email.
            </div>
          ) : null}

          <form action={signInWithPassword} className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-3 py-2 text-primary-foreground hover:bg-lime-dark"
            >
              Sign in
            </button>
          </form>

          <div className="my-6 h-px bg-border" />

          <form action={sendMagicLink} className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="magic_email"
              >
                Email for magic link
              </label>
              <input
                id="magic_email"
                name="email"
                type="email"
                required
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-secondary px-3 py-2 text-secondary-foreground hover:bg-muted"
            >
              Send magic link
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={
              redirectTo
                ? `/sign-up?redirect=${encodeURIComponent(redirectTo)}`
                : "/sign-up"
            }
            className="text-primary underline underline-offset-4"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
