import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, ShieldCheck, ChevronRight } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "About — PlateScan" },
      { name: "description", content: "Learn about PlateScan nutritional analysis." },
      { property: "og:title", content: "About — PlateScan" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  ),
});

function Settings() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-10 pt-6">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Scanner
      </Link>

      <h1 className="text-2xl font-semibold">About PlateScan</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        PlateScan uses advanced vision intelligence to identify ingredients, portion sizes,
        calories, macronutrients, and condition risk indicators directly from your food photos.
      </p>

      <div className="mt-8 space-y-4">
        <div className="animate-rise rounded-3xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </span>
            <h2 className="font-semibold">Automated AI Analysis</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Food scanning is powered directly by high-accuracy clinical nutrition vision models. No
            manual setup or configuration required.
          </p>
        </div>

        <div
          className="animate-rise rounded-3xl bg-card p-5 shadow-card"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </span>
            <h2 className="font-semibold">Privacy & Security</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your photos are processed securely in real time and are not retained or used for public
            training.
          </p>
        </div>

        <div
          className="animate-rise rounded-3xl bg-card p-5 shadow-card"
          style={{ animationDelay: "120ms" }}
        >
          <h2 className="font-semibold">Legal</h2>
          <div className="mt-3 divide-y divide-border/70">
            <Link
              to="/terms"
              className="flex items-center justify-between py-3 text-sm transition-colors hover:text-primary"
            >
              Terms & Conditions <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              to="/privacy"
              className="flex items-center justify-between py-3 text-sm transition-colors hover:text-primary"
            >
              Privacy Policy <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
