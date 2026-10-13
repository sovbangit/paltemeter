import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, ImageIcon, RotateCcw, Loader2, Droplet } from "lucide-react";
import { analyzeFood, type FoodResult, type Level } from "@/lib/analyze.functions";
import { fileToDataUrl } from "@/lib/settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlateScan — Calories & health risk from a food photo" },
      { name: "description", content: "Snap your plate to get calories, protein, macros, micros and health risk levels." },
      { property: "og:title", content: "PlateScan — AI food nutrition scanner" },
      { property: "og:description", content: "Calories, macros and condition risk levels from one photo." },
    ],
  }),
  component: Index,
});

const LABELS: Record<string, string> = {
  constipation: "Constipation", diabetes: "Diabetes", high_blood_pressure: "High blood pressure",
  liver: "Liver issues", kidney: "Kidney issues", high_cholesterol: "High cholesterol", obesity: "Obesity",
};
const RISK: Record<Level, string> = {
  low: "bg-risk-low", moderate: "bg-risk-mid", high: "bg-risk-high",
};

function Index() {
  const analyze = useServerFn(analyzeFood);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<FoodResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [picks, setPicks] = useState<Record<number, string>>({});

  async function run(img: string, answers: { q: string; a: string }[] = []) {
    setLoading(true); setError("");
    try {
      const r = await analyze({ data: { image: img, answers } });
      setResult(r); setPicks({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally { setLoading(false); }
  }

  async function onFile(f?: File) {
    if (!f) return;
    const d = await fileToDataUrl(f);
    setImage(d); setResult(null); run(d);
  }

  function reset() { setImage(null); setResult(null); setError(""); }

  return (
    <main className="mx-auto min-h-screen max-w-md pb-28">
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={galRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />

      <header className="flex items-center justify-between px-5 pt-6">
        <h1 className="text-xl font-semibold">Plate<span className="text-primary">Scan</span></h1>
      </header>

      {!image && (
        <section className="px-5 pt-8">
          <div className="bg-hero rounded-3xl p-7 text-primary-foreground">
            <h2 className="text-3xl font-semibold leading-tight">What's on your plate?</h2>
            <p className="mt-2 text-sm opacity-80">A full meal, an apple or a handful of nuts — snap it and get calories, nutrients and health risks.</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={() => camRef.current?.click()} className="flex flex-col items-center gap-3 rounded-3xl bg-primary p-6 text-primary-foreground">
              <Camera className="h-8 w-8" /><span className="font-semibold">Take photo</span>
            </button>
            <button onClick={() => galRef.current?.click()} className="flex flex-col items-center gap-3 rounded-3xl bg-card p-6 shadow-sm">
              <ImageIcon className="h-8 w-8 text-primary" /><span className="font-semibold">Gallery</span>
            </button>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            AI results are approximate and may be wrong. Not medical advice.
          </p>
          <nav className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground underline">
            <Link to="/terms">Terms & Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </nav>
        </section>
      )}

      {image && (
        <section className="px-5 pt-5">
          <div className="relative overflow-hidden rounded-3xl">
            <img src={image} alt="Your food" className="aspect-square w-full object-cover" />
            {loading && (
              <div className="absolute inset-0 bg-foreground/30">
                <div className="scan-line absolute left-0 right-0 h-1 bg-accent shadow-lg" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" /> Scanning ingredients…
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
              {error}
              <button className="ml-2 font-semibold underline" onClick={() => run(image)}>Retry</button>
            </div>
          )}

          {result && <Result r={result} picks={picks} setPicks={setPicks} loading={loading}
            onConfirm={() => run(image, result.questions.map((q, i) => ({ q: q.question, a: picks[i] ?? "Not sure — use your best guess" })))} />}
        </section>
      )}

      {image && (
        <div className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md gap-3 bg-background/90 p-4 backdrop-blur">
          <button onClick={reset} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-card py-4 font-semibold shadow-sm">
            <RotateCcw className="h-5 w-5" /> New scan
          </button>
          <button onClick={() => camRef.current?.click()} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground">
            <Camera className="h-5 w-5" /> Camera
          </button>
        </div>
      )}
    </main>
  );
}

function Result({ r, picks, setPicks, onConfirm, loading }: {
  r: FoodResult; picks: Record<number, string>; setPicks: (p: Record<number, string>) => void; onConfirm: () => void; loading: boolean;
}) {
  const t = r.totals;
  const macros = [
    { k: "Protein", v: t.protein_g }, { k: "Carbs", v: t.carbs_g }, { k: "Fat", v: t.fat_g }, { k: "Fiber", v: t.fiber_g },
  ];
  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-3xl bg-card p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{r.confidence} confidence</p>
        <h2 className="text-xl font-semibold">{r.dish_name}</h2>
        <div className="mt-3 flex items-end gap-1">
          <span className="font-display text-5xl font-semibold text-primary">{Math.round(t.calories)}</span>
          <span className="mb-1.5 text-muted-foreground">kcal</span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {macros.map((m) => (
            <div key={m.k} className="rounded-2xl bg-muted p-3 text-center">
              <div className="font-semibold">{Math.round(m.v)}g</div>
              <div className="text-xs text-muted-foreground">{m.k}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{r.summary}</p>
      </div>

      {r.questions.length > 0 && (
        <div className="rounded-3xl border-2 border-accent bg-card p-5">
          <h3 className="font-semibold">Help me be more accurate</h3>
          {r.questions.map((q, i) => (
            <div key={i} className="mt-3">
              <p className="text-sm font-medium">{q.question}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {q.options.map((o) => (
                  <button key={o} onClick={() => setPicks({ ...picks, [i]: o })}
                    className={`rounded-full px-3 py-1.5 text-sm ${picks[i] === o ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{o}</button>
                ))}
              </div>
            </div>
          ))}
          <button disabled={loading} onClick={onConfirm} className="mt-4 w-full rounded-2xl bg-accent py-3 font-semibold text-accent-foreground disabled:opacity-60">
            {loading ? "Recalculating…" : "Update results"}
          </button>
        </div>
      )}

      <div className="rounded-3xl bg-card p-5 shadow-sm">
        <h3 className="font-semibold">Health risk</h3>
        <div className="mt-3 space-y-3">
          {r.risks.map((x) => (
            <div key={x.condition}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{LABELS[x.condition] ?? x.condition}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize text-primary-foreground ${RISK[x.level]}`}>{x.level}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{x.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-card p-5 shadow-sm">
        <h3 className="font-semibold">Detected ingredients</h3>
        <ul className="mt-2 divide-y">
          {r.items.map((it, i) => (
            <li key={i} className="flex justify-between py-2 text-sm">
              <span><span className="font-medium">{it.name}</span> <span className="text-muted-foreground">· {it.portion}</span></span>
              <span className="text-muted-foreground">{Math.round(it.calories)} kcal · {Math.round(it.protein_g)}g P</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Droplet className="h-4 w-4" /> Oil/fat: {r.cooking_oil}</p>
      </div>

      <div className="rounded-3xl bg-card p-5 shadow-sm">
        <h3 className="font-semibold">More nutrients</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          {[["Sat. fat", `${Math.round(t.saturated_fat_g)} g`], ["Sugar", `${Math.round(t.sugar_g)} g`], ["Sodium", `${Math.round(t.sodium_mg)} mg`], ["Cholesterol", `${Math.round(t.cholesterol_mg)} mg`],
            ...r.micronutrients.map((m) => [m.name, m.amount])].map(([k, v]) => (
            <div key={k} className="flex justify-between rounded-xl bg-muted px-3 py-2"><span>{k}</span><span className="font-medium">{v}</span></div>
          ))}
        </div>
      </div>
      <p className="px-2 text-center text-xs text-muted-foreground">AI estimates can be wrong — not medical advice. For serious conditions, check with a dietitian and a food scale.</p>
    </div>
  );
}
