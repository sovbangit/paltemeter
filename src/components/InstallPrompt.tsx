import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const KEY = "platescan-install-dismissed";

export function InstallPrompt() {
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [evt, setEvt] = useState<BIPEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone || window.self !== window.top) return;
    const dismissed = Number(localStorage.getItem(KEY) || 0);
    if (Date.now() - dismissed < 3 * 864e5) return;

    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
    if (isIOS) {
      const t = setTimeout(() => setMode("ios"), 1500);
      return () => clearTimeout(t);
    }
    const onBip = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setMode("android");
    };
    const onInstalled = () => setMode(null);
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mode) return null;
  const close = () => {
    localStorage.setItem(KEY, String(Date.now()));
    setMode(null);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md p-4">
      <div className="flex items-start gap-3 rounded-3xl bg-card p-4 shadow-lg ring-1 ring-border">
        <img src="/icon-512.png" alt="" className="h-12 w-12 rounded-2xl" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">Install PlateScan</p>
          {mode === "ios" ? (
            <p className="mt-1 text-muted-foreground">
              Tap <Share className="inline h-4 w-4 align-text-bottom" /> Share in Safari, then
              choose <span className="font-medium text-foreground">Add to Home Screen</span>.
            </p>
          ) : (
            <>
              <p className="mt-1 text-muted-foreground">Add it to your home screen for one-tap scanning.</p>
              <button
                onClick={async () => {
                  if (!evt) return;
                  await evt.prompt();
                  await evt.userChoice;
                  setMode(null);
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 font-semibold text-primary-foreground"
              >
                <Download className="h-4 w-4" /> Install app
              </button>
            </>
          )}
        </div>
        <button onClick={close} aria-label="Close" className="rounded-full p-1 text-muted-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
