export type AiConfig = { baseUrl: string; apiKey: string; model: string };
const K = "plate-ai-config";
export function loadConfig(): AiConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const c = JSON.parse(localStorage.getItem(K) || "null");
    return c && c.apiKey ? c : null;
  } catch {
    return null;
  }
}
export function saveConfig(c: AiConfig | null) {
  if (c) localStorage.setItem(K, JSON.stringify(c));
  else localStorage.removeItem(K);
}

export async function fileToDataUrl(file: File, max = 1024): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((r, j) => {
    img.onload = r;
    img.onerror = j;
    img.src = url;
  });
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * s);
  c.height = Math.round(img.height * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.85);
}
