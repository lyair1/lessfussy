import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">BabyTrack</h1>
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

