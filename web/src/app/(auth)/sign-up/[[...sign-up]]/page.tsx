import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
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
              <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.15" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="4" />
              {/* Happy closed eyes (sleeping/content) */}
              <path d="M30 42 Q35 48 40 42" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M60 42 Q65 48 70 42" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              {/* Rosy cheeks */}
              <circle cx="25" cy="55" r="6" fill="currentColor" opacity="0.3" />
              <circle cx="75" cy="55" r="6" fill="currentColor" opacity="0.3" />
              {/* Big content smile */}
              <path d="M35 60 Q50 78 65 60" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              {/* Tiny hair curl */}
              <path d="M50 10 Q55 5 52 15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M45 12 Q40 6 44 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h1 className="text-3xl font-bold text-primary">LessFussy</h1>
          </div>
          <p className="text-muted-foreground">
            Create an account to start tracking your baby&apos;s day.
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-primary text-primary-foreground hover:bg-lime-dark",
              card: "bg-card border-border",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton:
                "bg-secondary text-secondary-foreground border-border hover:bg-muted",
              formFieldLabel: "text-foreground",
              formFieldInput: "bg-input border-border text-foreground",
              footerActionLink: "text-accent hover:text-cyan-dark",
            },
          }}
        />
      </div>
    </div>
  );
}

