import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-16 pt-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">Last updated: October 2026</p>
      <div className="mt-6 space-y-5 text-sm leading-relaxed [&_h2]:mb-1 [&_h2]:font-semibold [&_h2]:text-base">
        {children}
      </div>
    </main>
  );
}
