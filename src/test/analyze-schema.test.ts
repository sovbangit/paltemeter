import { describe, expect, it } from "vitest";
import { Input } from "@/lib/analyze.functions";

const validInput = {
  image: "data:image/jpeg;base64,/9j/4AAQ",
  answers: [{ q: "Which protein?", a: "Chicken" }],
  config: null,
};

describe("analyzeFood input schema", () => {
  it("accepts a valid payload", () => {
    expect(Input.parse(validInput)).toEqual(validInput);
  });

  it("defaults answers and config when omitted", () => {
    const parsed = Input.parse({ image: "data:image/png;base64,AAA" });
    expect(parsed.answers).toEqual([]);
    expect(parsed.config).toBeNull();
  });

  it("accepts an optional config object", () => {
    const parsed = Input.parse({
      image: "data:image/png;base64,AAA",
      config: { baseUrl: "https://x", apiKey: "k", model: "m" },
    });
    expect(parsed.config).toEqual({ baseUrl: "https://x", apiKey: "k", model: "m" });
  });

  it("rejects non-data-url images", () => {
    expect(() => Input.parse({ image: "https://evil.example/steal.jpg" })).toThrow();
    expect(() => Input.parse({ image: "text/plain" })).toThrow();
    expect(() => Input.parse({ image: "" })).toThrow();
  });

  it("rejects malformed answers", () => {
    expect(() => Input.parse({ ...validInput, answers: [{ wrong: "shape" }] })).toThrow();
  });

  it("rejects missing image", () => {
    expect(() => Input.parse({ answers: [] })).toThrow();
  });
});
