import { beforeEach, describe, expect, it, vi } from "vitest";
import { fileToDataUrl, loadConfig, saveConfig } from "@/lib/settings";

const KEY = "plate-ai-config";

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("loadConfig", () => {
  it("returns null when nothing is stored", () => {
    expect(loadConfig()).toBeNull();
  });

  it("returns the stored config when it has an apiKey", () => {
    localStorage.setItem(KEY, JSON.stringify({ baseUrl: "https://x", apiKey: "k", model: "m" }));
    expect(loadConfig()).toEqual({ baseUrl: "https://x", apiKey: "k", model: "m" });
  });

  it("returns null when apiKey is empty", () => {
    localStorage.setItem(KEY, JSON.stringify({ baseUrl: "https://x", apiKey: "", model: "m" }));
    expect(loadConfig()).toBeNull();
  });

  it("returns null for corrupted JSON instead of throwing", () => {
    localStorage.setItem(KEY, "{not valid json");
    expect(loadConfig()).toBeNull();
  });
});

describe("saveConfig", () => {
  it("persists a config", () => {
    saveConfig({ baseUrl: "https://x", apiKey: "k", model: "m" });
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({
      baseUrl: "https://x",
      apiKey: "k",
      model: "m",
    });
  });

  it("removes the config when saving null", () => {
    saveConfig({ baseUrl: "https://x", apiKey: "k", model: "m" });
    saveConfig(null);
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe("fileToDataUrl", () => {
  it("scales the image and returns a jpeg data url", async () => {
    class FakeImage {
      width = 2048;
      height = 1024;
      onload: () => void = () => {};
      set src(_: string) {
        Promise.resolve().then(() => this.onload());
      }
    }
    const drawImage = vi.fn();
    const toDataURL = vi.fn(() => "data:image/jpeg;base64,AAA");
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage })),
      toDataURL,
    };
    vi.stubGlobal("Image", FakeImage);
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() });
    const createSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation(((tag: string) =>
        tag === "canvas" ? canvas : document.createElement(tag)) as typeof document.createElement);

    const file = new File(["bytes"], "food.jpg", { type: "image/jpeg" });
    const result = await fileToDataUrl(file);

    expect(result).toBe("data:image/jpeg;base64,AAA");
    // 2048 wide, max 1024 -> scaled by 0.5
    expect(canvas.width).toBe(1024);
    expect(canvas.height).toBe(512);
    expect(drawImage).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledWith("canvas");
  });

  it("keeps original size when smaller than max", async () => {
    class FakeImage {
      width = 800;
      height = 600;
      onload: () => void = () => {};
      set src(_: string) {
        Promise.resolve().then(() => this.onload());
      }
    }
    const drawImage = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage })),
      toDataURL: vi.fn(() => "data:image/jpeg;base64,BBB"),
    };
    vi.stubGlobal("Image", FakeImage);
    vi.stubGlobal("URL", { createObjectURL: vi.fn(), revokeObjectURL: vi.fn() });
    vi.spyOn(document, "createElement").mockImplementation(((tag: string) =>
      tag === "canvas" ? canvas : document.createElement(tag)) as typeof document.createElement);

    const file = new File(["bytes"], "food.jpg", { type: "image/jpeg" });
    await fileToDataUrl(file);

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    expect(drawImage).toHaveBeenCalled();
  });
});
