import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { Loader2, ScanLine, ShieldCheck, Info } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { reason?: string };
  const [pending, setPending] = useState(false);
  const scanLimitReached = search.reason === "scan-limit";

  useEffect(() => {
    if (user && !loading) {
      navigate({ to: "/" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="animate-rise w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary shadow-pop">
            <ScanLine className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight">
            Plate<span className="text-primary">Scan</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Sign in to track your nutrition and health insights
          </p>
        </div>

        {scanLimitReached && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-2xl bg-accent/15 p-4 text-sm text-foreground"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
            <p>
              You used all 10 scans for this session. Sign in again to get a fresh set of 10 scans.
            </p>
          </div>
        )}

        <div className="rounded-3xl bg-card p-8 shadow-card">
          <button
            onClick={() => {
              setPending(true);
              void signIn();
            }}
            disabled={loading || pending}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 font-semibold text-primary-foreground shadow-card transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{pending ? "Redirecting to Google…" : "Continue with Google"}</span>
          </button>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            By signing in, you agree to our{" "}
            <a href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </a>
          </p>
        </div>

        <div className="flex items-start justify-center gap-2.5 rounded-2xl bg-muted/50 p-4 text-center text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-left">
            <span className="font-medium text-foreground">Your data is secure.</span> We use
            industry-standard encryption and never share your information.
          </p>
        </div>
      </div>
    </main>
  );
}
