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

    const apiKey =
      process.env["GEMINI_API_KEY"] ||
      process.env["GOOGLE_API_KEY"] ||
      (data.config && data.config.apiKey) ||
      process.env["LOVABLE_API_KEY"];

    if (!apiKey) {
      throw new Error(
        "AI is not configured. Please set the GEMINI_API_KEY environment variable in your deployment environment.",
      );
    }

    const baseUrl = (
      process.env["GEMINI_BASE_URL"] ||
      (data.config && data.config.baseUrl) ||
      "https://generativelanguage.googleapis.com/v1beta/openai"
    ).replace(/\/+$/, "");

    let model =
      process.env["GEMINI_MODEL"] || (data.config && data.config.model) || "gemini-3.8-flash";

    if (!model || model.includes("gemini-2.0-flash")) {
      model = "gemini-3.8-flash";
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: {
          type: "json_schema",
          json_schema: { name: "food", strict: true, schema },
        },
        messages: [
          { role: "system", content: PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: answerText + "\nReturn json adhering strictly to the schema." },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini AI returned ${res.status}: ${errText.slice(0, 200)}`);
    }

    const j = await res.json();
    let content = j.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response received from Gemini AI.");
    }

    // Strip markdown code fences if model wrapped response in ```json ... ```
    if (typeof content === "string") {
      content = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
    }

    return JSON.parse(content) as FoodResult;
  });

export type Level = "low" | "moderate" | "high";
export type FoodResult = {
  dish_name: string;
  confidence: "low" | "medium" | "high";
  questions: { question: string; options: string[] }[];
  items: { name: string; portion: string; calories: number; protein_g: number }[];
  cooking_oil: string;
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    saturated_fat_g: number;
    fiber_g: number;
    sugar_g: number;
    sodium_mg: number;
    cholesterol_mg: number;
  };
  micronutrients: { name: string; amount: string }[];
  risks: { condition: string; level: Level; reason: string }[];
  summary: string;
};
