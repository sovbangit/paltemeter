import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";
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
      <p className="mt-2 text-sm text-muted-foreground">
        PlateScan uses advanced vision intelligence to identify ingredients, portion sizes,
        calories, macronutrients, and condition risk indicators directly from your food photos.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="font-semibold">Automated AI Analysis</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Food scanning is powered directly by high-accuracy clinical nutrition vision models. No
            manual setup or configuration required.
          </p>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="font-semibold">Privacy & Security</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your photos are processed securely in real time and are not retained or used for public
            training.
          </p>
        </div>
      </div>
    </main>
  );
}
