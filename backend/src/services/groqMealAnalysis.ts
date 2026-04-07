import OpenAI from "openai";
import { z } from "zod";
import { assertAnalysisConfig, env } from "../config.js";
import type { VisionMealAnalysis } from "../types.js";

const GROQ_OPENAI_BASE_URL = "https://api.groq.com/openai/v1";
const TEXT_ONLY_MODELS = new Set(["llama-3.1-8b-instant"]);
const notesSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(/\n|•|-/)
      .map((note) => note.trim())
      .filter(Boolean);
  }

  return [];
}, z.array(z.string()).default([]));

const mealAnalysisSchema = z.object({
  mealName: z.string(),
  summary: z.string(),
  notes: notesSchema,
  confidence: z.number().min(0).max(1),
  items: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        estimatedGrams: z.number().positive(),
        householdMeasure: z.string(),
        foodSearchQuery: z.string(),
        confidence: z.number().min(0).max(1)
      })
    )
    .min(1)
});

const extractJson = (content: string) => {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The AI response did not include valid JSON.");
  }

  return content.slice(start, end + 1);
};

const assertModelSupportsImages = () => {
  if (TEXT_ONLY_MODELS.has(env.GROQ_MODEL)) {
    throw new Error(
      `The configured Groq model "${env.GROQ_MODEL}" is text-only and cannot analyze uploaded images. Add a vision-capable model on Groq or introduce a separate OCR or vision step before sending text to this model.`
    );
  }
};

export const analyzeMealImage = async (
  mimeType: string,
  base64Image: string
): Promise<VisionMealAnalysis> => {
  assertAnalysisConfig();
  assertModelSupportsImages();

  const groq = new OpenAI({
    apiKey: env.GROQ_API_KEY,
    baseURL: GROQ_OPENAI_BASE_URL
  });

  const response = await groq.chat.completions.create({
    model: env.GROQ_MODEL,
    temperature: 0.2,
    response_format: {
      type: "json_object"
    },
    messages: [
      {
        role: "system",
        content:
          "You are a nutrition vision assistant. Identify the visible foods in the meal photo, estimate edible quantity in grams for each visible item, and return only JSON. Be conservative and explicit about uncertainty."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Analyze this meal image and return JSON with keys mealName, summary, notes, confidence, and items. Each item must include name, description, estimatedGrams, householdMeasure, foodSearchQuery, and confidence. foodSearchQuery should be a clean USDA-style food lookup phrase like grilled chicken breast or steamed white rice. Do not wrap in markdown."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
          }
        ]
      }
    ]
  });

  const rawText = response.choices[0]?.message?.content;

  if (!rawText || typeof rawText !== "string") {
    throw new Error("The Groq response did not include JSON text content.");
  }

  const parsed = JSON.parse(extractJson(rawText));

  return mealAnalysisSchema.parse(parsed);
};
