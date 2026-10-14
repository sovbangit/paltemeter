import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Camera,
  ImageIcon,
  RotateCcw,
  Loader2,
  LogOut,
  Settings,
  Flame,
  Drumstick,
  Wheat,
  HeartPulse,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  TriangleAlert,
  ScanLine,
  Leaf,
  MessageCircleQuestion,
  RefreshCw,
  Droplet,
} from "lucide-react";
import { analyzeFood, type FoodResult, type Level } from "@/lib/analyze.functions";
import { fileToDataUrl } from "@/lib/settings";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MAX_SCANS_PER_SESSION, useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlateScan — Calories & health risk from a food photo" },
      {
        name: "description",
        content: "Snap your plate to get calories, protein, macros, micros and health risk levels.",
      },
      { property: "og:title", content: "PlateScan — AI food nutrition scanner" },
      {
        property: "og:description",
        content: "Calories, macros and condition risk levels from one photo.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <Index />
    </ProtectedRoute>
  ),
});

const LABELS: Record<string, string> = {
  constipation: "Constipation",
  diabetes: "Diabetes",
  high_blood_pressure: "High blood pressure",
  liver: "Liver issues",
  kidney: "Kidney issues",
  high_cholesterol: "High cholesterol",
  obesity: "Obesity",
};

const RISK_META: Record<Level, { icon: typeof ShieldCheck; classes: string }> = {
  low: { icon: ShieldCheck, classes: "bg-risk-low text-white" },
  moderate: { icon: ShieldAlert, classes: "bg-risk-mid text-white" },
  high: { icon: TriangleAlert, classes: "bg-risk-high text-white" },
};

const SCAN_STAGES = [
  "Identifying ingredients…",
  "Estimating portions…",
  "Calculating macros…",
  "Assessing health risks…",
];

const MACRO_STYLES = {
  protein: { bar: "bg-[oklch(0.62_0.14_150)]", dot: "bg-[oklch(0.62_0.14_150)]" },
  carbs: { bar: "bg-[oklch(0.75_0.15_75)]", dot: "bg-[oklch(0.75_0.15_75)]" },
  fat: { bar: "bg-[oklch(0.6_0.2_28)]", dot: "bg-[oklch(0.6_0.2_28)]" },
} as const;

function Index() {
  const analyze = useServerFn(analyzeFood);
  const { user, signOut, scansUsed, recordScan } = useAuth();
  const navigate = useNavigate();
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<FoodResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [picks, setPicks] = useState<Record<number, string>>({});
  const scansLeft = Math.max(0, MAX_SCANS_PER_SESSION - scansUsed);

  useEffect(() => {
    if (!loading) {
      setStage(0);
      return;
    }
    const id = setInterval(() => setStage((s) => Math.min(s + 1, SCAN_STAGES.length - 1)), 2600);
    return () => clearInterval(id);
  }, [loading]);

  async function run(img: string, answers: { q: string; a: string }[] = []) {
    // Session allowance exhausted: force a fresh login before any further scans.
    if (scansUsed >= MAX_SCANS_PER_SESSION) {
      signOut();
      navigate({ to: "/login", search: { reason: "scan-limit" } });
      return;
    }
    recordScan();
    setLoading(true);
    setError("");
    try {
      const r = await analyze({ data: { image: img, answers } });
      setResult(r);
      setPicks({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onFile(f?: File) {
    if (!f) return;
    const d = await fileToDataUrl(f);
    setImage(d);
    setResult(null);
    run(d);
  }

  function reset() {
    setImage(null);
    setResult(null);
    setError("");
    setPicks({});
  }

  return (
    <main className="mx-auto min-h-screen max-w-md pb-32" aria-busy={loading}>
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <input
        ref={galRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <header className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-card">
            <ScanLine className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Plate<span className="text-primary">Scan</span>
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            to="/settings"
            aria-label="About PlateScan"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
          </Link>
          {user?.picture && (
            <img
              src={user.picture}
              alt={user.name}
              className="h-9 w-9 rounded-full shadow-card ring-2 ring-background"
            />
          )}
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {!image && (
        <section className="animate-rise px-5 pt-8">
          <div className="bg-hero rounded-3xl p-7 text-primary-foreground shadow-pop">
            <h2 className="text-3xl font-semibold leading-tight">What's on your plate?</h2>
            <p className="mt-2 text-sm opacity-80">
              A full meal, an apple or a handful of nuts — snap it and get calories, nutrients and
              health risks.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
                <Flame className="h-3.5 w-3.5" /> Calories
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
                <Drumstick className="h-3.5 w-3.5" /> Macros & micros
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
                <HeartPulse className="h-3.5 w-3.5" /> Health risks
              </span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {scansLeft} of {MAX_SCANS_PER_SESSION} scans left this session
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => camRef.current?.click()}
              className="flex flex-col items-center gap-3 rounded-3xl bg-primary p-6 text-primary-foreground shadow-card transition-all hover:bg-primary/90 hover:shadow-pop active:scale-[0.97]"
            >
              <Camera className="h-8 w-8" />
              <span className="font-semibold">Take photo</span>
            </button>
            <button
              onClick={() => galRef.current?.click()}
              className="flex flex-col items-center gap-3 rounded-3xl bg-card p-6 shadow-card transition-all hover:shadow-pop active:scale-[0.97]"
            >
              <ImageIcon className="h-8 w-8 text-primary" />
              <span className="font-semibold">Gallery</span>
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
        <section className="animate-rise px-5 pt-5">
          <div className="relative overflow-hidden rounded-3xl shadow-card">
            <img
              src={image}
              alt="Your food"
              className={`aspect-square w-full object-cover transition-[filter] duration-300 ${loading ? "blur-[2px] brightness-90" : ""}`}
            />
            {loading && (
              <div className="absolute inset-0 bg-foreground/30" aria-live="polite">
                <div className="scan-line absolute left-0 right-0 h-1 bg-accent" />
                <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-card/95 px-4 py-3 shadow-pop backdrop-blur">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>{SCAN_STAGES[stage]}</span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {SCAN_STAGES.map((s, i) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= stage ? "bg-primary" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            {scansLeft} of {MAX_SCANS_PER_SESSION} scans left this session
          </p>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-2xl bg-destructive/10 p-4"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-destructive">Analysis failed</p>
                <p className="mt-0.5 text-destructive/80">{error}</p>
              </div>
              <button
                onClick={() => run(image)}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {result && (
            <Result
              r={result}
              picks={picks}
              setPicks={setPicks}
              loading={loading}
              scansLeft={scansLeft}
              onConfirm={() =>
                run(
                  image,
                  result.questions.map((q, i) => ({
                    q: q.question,
                    a: picks[i] ?? "Not sure — use your best guess",
                  })),
                )
              }
            />
          )}
        </section>
      )}

      {image && (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border/60 bg-background/85 pb-safe backdrop-blur-md">
          <div className="flex gap-3 p-4">
            <button
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-card py-4 font-semibold shadow-card transition-all hover:shadow-pop active:scale-[0.97]"
            >
              <RotateCcw className="h-5 w-5" /> New scan
            </button>
            <button
              onClick={() => camRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground shadow-card transition-all hover:bg-primary/90 active:scale-[0.97]"
            >
              <Camera className="h-5 w-5" /> Camera
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Result({
  r,
  picks,
  setPicks,
  onConfirm,
  loading,
  scansLeft,
}: {
  r: FoodResult;
  picks: Record<number, string>;
  setPicks: (p: Record<number, string>) => void;
  onConfirm: () => void;
  loading: boolean;
  scansLeft: number;
}) {
  const t = r.totals;

  const kcalByMacro = {
    protein: t.protein_g * 4,
    carbs: t.carbs_g * 4,
    fat: t.fat_g * 9,
  };
  const kcalTotal = Math.max(kcalByMacro.protein + kcalByMacro.carbs + kcalByMacro.fat, 1);
  const shares = {
    protein: Math.round((kcalByMacro.protein / kcalTotal) * 100),
    carbs: Math.round((kcalByMacro.carbs / kcalTotal) * 100),
    fat: Math.round((kcalByMacro.fat / kcalTotal) * 100),
  };

  const confidenceBadge =
    r.confidence === "high"
      ? "bg-risk-low text-white"
      : r.confidence === "medium"
        ? "bg-risk-mid text-white"
        : "bg-risk-high text-white";

  const macros = [
    { k: "Protein", v: t.protein_g },
    { k: "Carbs", v: t.carbs_g },
    { k: "Fat", v: t.fat_g },
    { k: "Fiber", v: t.fiber_g },
  ];

  const answered = Object.keys(picks).length;

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-3xl bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Detected dish
            </p>
            <h2 className="text-xl font-semibold">{r.dish_name}</h2>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${confidenceBadge}`}
          >
            {r.confidence} confidence
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div className="flex items-end gap-1">
            <span className="font-display text-5xl font-semibold text-primary">
              {Math.round(t.calories)}
            </span>
            <span className="mb-1.5 text-sm text-muted-foreground">kcal</span>
          </div>
        </div>

        <div
          className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`Protein ${shares.protein}%, carbs ${shares.carbs}%, fat ${shares.fat}% of calories`}
        >
          <div className={MACRO_STYLES.protein.bar} style={{ width: `${shares.protein}%` }} />
          <div className={MACRO_STYLES.carbs.bar} style={{ width: `${shares.carbs}%` }} />
          <div className={MACRO_STYLES.fat.bar} style={{ width: `${shares.fat}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${MACRO_STYLES.protein.dot}`} /> Protein{" "}
            {shares.protein}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${MACRO_STYLES.carbs.dot}`} /> Carbs{" "}
            {shares.carbs}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${MACRO_STYLES.fat.dot}`} /> Fat {shares.fat}%
          </span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {macros.map((m) => (
            <div key={m.k} className="rounded-2xl bg-muted p-3 text-center">
              <div className="font-semibold">{Math.round(m.v)}g</div>
              <div className="text-xs text-muted-foreground">{m.k}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{r.summary}</p>
      </div>

      {r.questions.length > 0 && (
        <div className="animate-rise rounded-3xl border-2 border-accent/70 bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold">
              <MessageCircleQuestion className="h-5 w-5 text-primary" />
              Help me be more accurate
            </h3>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {answered}/{r.questions.length} answered
            </span>
          </div>
          {r.questions.map((q, i) => (
            <fieldset key={i} className="mt-4">
              <legend className="text-sm font-medium">{q.question}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {q.options.map((o) => (
                  <button
                    key={o}
                    onClick={() => setPicks({ ...picks, [i]: o })}
                    aria-pressed={picks[i] === o}
                    className={`rounded-full px-3.5 py-1.5 text-sm transition-all active:scale-95 ${
                      picks[i] === o
                        ? "bg-primary font-medium text-primary-foreground shadow-card"
                        : "bg-muted text-foreground/80 hover:bg-muted/70"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <button
            disabled={loading || scansLeft === 0}
            onClick={onConfirm}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 font-semibold text-accent-foreground shadow-card transition-all hover:bg-accent/90 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Recalculating…
              </>
            ) : scansLeft === 0 ? (
              "No scans left — sign in again"
            ) : (
              "Update results"
            )}
          </button>
        </div>
      )}

      <div className="rounded-3xl bg-card p-5 shadow-card">
        <h3 className="flex items-center gap-2 font-semibold">
          <HeartPulse className="h-5 w-5 text-primary" />
          Health risk
        </h3>
        <div className="mt-3 space-y-3">
          {r.risks.map((x) => {
            const meta = RISK_META[x.level];
            const Icon = meta.icon;
            return (
              <div key={x.condition} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.classes}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{LABELS[x.condition] ?? x.condition}</span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${meta.classes}`}
                    >
                      {x.level}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{x.reason}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl bg-card p-5 shadow-card">
        <h3 className="flex items-center gap-2 font-semibold">
          <Leaf className="h-5 w-5 text-primary" />
          Detected ingredients
        </h3>
        <ul className="mt-2 divide-y divide-border/70">
          {r.items.map((it, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
              <span>
                <span className="font-medium">{it.name}</span>{" "}
                <span className="text-muted-foreground">· {it.portion}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {Math.round(it.calories)} kcal · {Math.round(it.protein_g)}g P
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Droplet className="h-4 w-4" /> Oil/fat: {r.cooking_oil}
        </p>
      </div>

      <div className="rounded-3xl bg-card p-5 shadow-card">
        <h3 className="font-semibold">More nutrients</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {[
            ["Sat. fat", `${Math.round(t.saturated_fat_g)} g`],
            ["Sugar", `${Math.round(t.sugar_g)} g`],
            ["Sodium", `${Math.round(t.sodium_mg)} mg`],
            ["Cholesterol", `${Math.round(t.cholesterol_mg)} mg`],
            ...r.micronutrients.map((m) => [m.name, m.amount]),
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5"
            >
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="px-2 pb-4 text-center text-xs leading-relaxed text-muted-foreground">
        AI estimates can be wrong — not medical advice. For serious conditions, check with a
        dietitian and a food scale.
      </p>
    </div>
  );
}
