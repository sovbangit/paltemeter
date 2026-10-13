import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  image: z.string().startsWith("data:image/"),
  answers: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  config: z
    .object({ baseUrl: z.string(), apiKey: z.string(), model: z.string() })
    .nullable()
    .default(null),
});

const CONDITIONS = [
  "constipation",
  "diabetes",
  "high_blood_pressure",
  "liver",
  "kidney",
  "high_cholesterol",
  "obesity",
];

const num = { type: "number" };
const str = { type: "string" };
const obj = (props: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  properties: props,
  required: Object.keys(props),
});

const schema = obj({
  dish_name: str,
  confidence: { type: "string", enum: ["low", "medium", "high"] },
  questions: {
    type: "array",
    items: obj({ question: str, options: { type: "array", items: str } }),
  },
  items: {
    type: "array",
    items: obj({ name: str, portion: str, calories: num, protein_g: num }),
  },
  cooking_oil: str,
  totals: obj({
    calories: num,
    protein_g: num,
    carbs_g: num,
    fat_g: num,
    saturated_fat_g: num,
    fiber_g: num,
    sugar_g: num,
    sodium_mg: num,
    cholesterol_mg: num,
  }),
  micronutrients: { type: "array", items: obj({ name: str, amount: str }) },
  risks: {
    type: "array",
    items: obj({
      condition: { type: "string", enum: CONDITIONS },
      level: { type: "string", enum: ["low", "moderate", "high"] },
      reason: str,
    }),
  },
  summary: str,
});

const PROMPT = `You are a clinical nutritionist analysing a food photo. Identify every visible ingredient: main foods, protein source, nuts, seeds, sauces, garnish and the likely cooking oil/fat. Estimate portion sizes from visual cues (plate ~26 cm, spoon, hand, nut size). Look hard for hidden fat: glossy sheen, oil pooling at plate edges, oily or creamy curries/gravies, fried coatings, butter, ghee and dressings — these often add 100-400 kcal, so never ignore them. For mixed nuts and seeds, identify each kind (almond, cashew, walnut, peanut, pistachio, hazelnut, raisin etc.), roughly count pieces and estimate grams per kind.
If you are genuinely unsure about something that changes the numbers a lot (e.g. which protein, which oil, portion size), add up to 3 short multiple-choice questions in "questions" — but STILL give your best-guess analysis. If user answers are provided, use them and return an empty questions array.
Compute total calories, protein, carbs, fat, saturated fat, fiber, sugar, sodium, cholesterol and key micronutrients (vitamins/minerals with amounts).
Rate the risk (low/moderate/high) of eating this meal for each condition: constipation, diabetes, high_blood_pressure, liver, kidney, high_cholesterol, obesity, with a one-sentence reason. Return all 7.
Respond only in JSON matching the schema.`;

export const analyzeFood = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const answerText = data.answers.length
      ? "User answers:\n" + data.answers.map((x) => `- ${x.q}: ${x.a}`).join("\n")
      : "No user answers yet.";

    if (data.config && data.config.apiKey) {
      const base = data.config.baseUrl.replace(/\/+$/, "");
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.config.apiKey}`,
        },
        body: JSON.stringify({
          model: data.config.model || "gpt-4o",
          response_format: { type: "json_schema", json_schema: { name: "food", strict: true, schema } },
          messages: [
            { role: "system", content: PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: answerText + "\nReturn json." },
                { type: "image_url", image_url: { url: data.image } },
              ],
            },
          ],
        }),
      });
      if (!res.ok) throw new Error(`Your AI provider returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const j = await res.json();
      return JSON.parse(j.choices[0].message.content) as FoodResult;
    }

    const key = process.env['LOVABLE_API_KEY'];
    if (!key) throw new Error("Demo AI is not configured. Add your own key in Settings.");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: PROMPT,
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: "food", strict: true, schema } },
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: answerText },
              { type: "input_image", image_url: data.image },
            ],
          },
        ],
      }),
    });
    if (!res.ok || !res.body) {
      const t = await res.text();
      if (res.status === 402) throw new Error("Demo AI credits ran out. Add your own key in Settings.");
      if (res.status === 429) throw new Error("Too many requests — please wait a moment and try again.");
      throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const p = line.slice(5).trim();
        if (!p || p === "[DONE]") continue;
        try {
          const ev = JSON.parse(p);
          if (ev.type === "response.output_text.delta") out += ev.delta;
          if (ev.type === "error" || ev.type === "response.failed")
            throw new Error(ev.error?.message ?? "AI request failed");
        } catch (e) {
          if (e instanceof Error && e.message !== "Unexpected end of JSON input" && !(e instanceof SyntaxError)) throw e;
        }
      }
    }
    if (!out) throw new Error("The AI could not analyse this photo. Try another picture.");
    return JSON.parse(out) as FoodResult;
  });

export type Level = "low" | "moderate" | "high";
export type FoodResult = {
  dish_name: string;
  confidence: "low" | "medium" | "high";
  questions: { question: string; options: string[] }[];
  items: { name: string; portion: string; calories: number; protein_g: number }[];
  cooking_oil: string;
  totals: {
    calories: number; protein_g: number; carbs_g: number; fat_g: number; saturated_fat_g: number;
    fiber_g: number; sugar_g: number; sodium_mg: number; cholesterol_mg: number;
  };
  micronutrients: { name: string; amount: string }[];
  risks: { condition: string; level: Level; reason: string }[];
  summary: string;
};
