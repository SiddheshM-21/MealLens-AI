import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  GROQ_API_KEY: z.string().optional(),
  USDA_API_KEY: z.string().optional(),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  GROQ_MODEL: z.string().default("meta-llama/llama-4-scout-17b-16e-instruct")
});

export const env = envSchema.parse(process.env);

export const assertAnalysisConfig = () => {
  if (!env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing. Add it to backend/.env before analyzing meals.");
  }

  if (!env.USDA_API_KEY) {
    throw new Error("USDA_API_KEY is missing. Add it to backend/.env before analyzing meals.");
  }
};
