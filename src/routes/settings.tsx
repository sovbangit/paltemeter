import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { loadConfig, saveConfig } from "@/lib/settings";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "AI Settings — PlateScan" },
      { name: "description", content: "Connect your own OpenAI-compatible AI provider to PlateScan." },
      { property: "og:title", content: "AI Settings — PlateScan" },
      { property: "og:description", content: "Bring your own OpenAI-compatible URL and API key." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const c = loadConfig();
    if (c) { setBaseUrl(c.baseUrl); setApiKey(c.apiKey); setModel(c.model); }
  }, []);

  const field = "w-full rounded-xl border bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring";
  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-10 pt-6">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-2xl font-semibold">AI provider</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Use any OpenAI-compatible service with a vision model. Leave the key empty to use the built-in demo AI.
      </p>
      <div className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Base URL
          <input className={field + " mt-1"} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">API key
          <input className={field + " mt-1"} type="password" value={apiKey} placeholder="sk-..." onChange={(e) => setApiKey(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">Model
          <input className={field + " mt-1"} value={model} onChange={(e) => setModel(e.target.value)} />
        </label>
      </div>
      <button
        className="mt-6 w-full rounded-2xl bg-primary py-4 font-semibold text-primary-foreground"
        onClick={() => { saveConfig(apiKey ? { baseUrl, apiKey, model } : null); setSaved(apiKey ? "Saved. Your key stays on this device." : "Using demo AI."); }}
      >Save</button>
      <button
        className="mt-3 w-full rounded-2xl bg-muted py-3 text-sm font-medium"
        onClick={() => { saveConfig(null); setApiKey(""); setSaved("Switched to demo AI."); }}
      >Use demo AI instead</button>
      {saved && <p className="mt-4 text-center text-sm text-primary">{saved}</p>}
    </main>
  );
}
