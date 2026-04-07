import { assertAnalysisConfig, env } from "../config.js";
import { emptyMicros, emptyTotals, roundMicros, roundTotals } from "../lib/nutrients.js";
import type {
  EnrichedMealItem,
  MicronutrientHighlights,
  NutrientTotals,
  VisionMealItem
} from "../types.js";

const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

type USDAFoodSearchResponse = {
  foods?: Array<{
    fdcId: number;
    description: string;
    dataType: string;
    foodNutrients?: Array<{
      nutrientName: string;
      value?: number;
      amount?: number;
      unitName: string;
    }>;
  }>;
};

const nutrientAliases: Record<keyof NutrientTotals | keyof MicronutrientHighlights, string[]> = {
  calories: ["Energy", "Energy (Atwater General Factors)"],
  protein: ["Protein"],
  carbs: ["Carbohydrate, by difference"],
  fat: ["Total lipid (fat)"],
  fiber: ["Fiber, total dietary"],
  sugar: ["Sugars, total including NLEA"],
  sodium: ["Sodium, Na"],
  vitaminA: ["Vitamin A, RAE", "Vitamin A, IU"],
  vitaminC: ["Vitamin C, total ascorbic acid"],
  vitaminD: ["Vitamin D (D2 + D3)", "Vitamin D"],
  vitaminB12: ["Vitamin B-12"],
  calcium: ["Calcium, Ca"],
  iron: ["Iron, Fe"],
  potassium: ["Potassium, K"]
};

const nutrientValue = (
  nutrients: Array<{ nutrientName: string; value?: number; amount?: number }>,
  aliases: string[]
) => {
  const match = nutrients.find((nutrient) => aliases.includes(nutrient.nutrientName));
  return match?.value ?? match?.amount ?? 0;
};

const normalizeToGrams = (
  valuePer100g: number,
  estimatedGrams: number
) => (valuePer100g * estimatedGrams) / 100;

const scoreFood = (query: string, description: string) => {
  const q = query.toLowerCase();
  const d = description.toLowerCase();

  if (d === q) return 100;
  if (d.startsWith(q)) return 80;
  if (d.includes(q)) return 65;

  const queryWords = q.split(/\s+/);
  const hitCount = queryWords.filter((word) => d.includes(word)).length;
  return hitCount * 10;
};

const searchFood = async (query: string) => {
  const response = await fetch(`${USDA_BASE_URL}/foods/search?api_key=${env.USDA_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      pageSize: 5,
      dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"]
    })
  });

  if (!response.ok) {
    throw new Error(`USDA search failed with status ${response.status}`);
  }

  const json = (await response.json()) as USDAFoodSearchResponse;
  return json.foods ?? [];
};

export const enrichMealItem = async (item: VisionMealItem): Promise<EnrichedMealItem> => {
  assertAnalysisConfig();

  const foods = await searchFood(item.foodSearchQuery);

  if (foods.length === 0) {
    return {
      ...item,
      matchedFoodDescription: "No USDA match found",
      dataType: "Unavailable",
      source: "Vision estimate only",
      totals: emptyTotals(),
      micros: emptyMicros()
    };
  }

  const best = [...foods].sort(
    (a, b) => scoreFood(item.foodSearchQuery, b.description) - scoreFood(item.foodSearchQuery, a.description)
  )[0];

  const nutrients = best.foodNutrients ?? [];

  const totals: NutrientTotals = roundTotals({
    calories: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.calories), item.estimatedGrams),
    protein: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.protein), item.estimatedGrams),
    carbs: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.carbs), item.estimatedGrams),
    fat: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.fat), item.estimatedGrams),
    fiber: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.fiber), item.estimatedGrams),
    sugar: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.sugar), item.estimatedGrams),
    sodium: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.sodium), item.estimatedGrams)
  });

  const micros: MicronutrientHighlights = roundMicros({
    vitaminA: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.vitaminA), item.estimatedGrams),
    vitaminC: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.vitaminC), item.estimatedGrams),
    vitaminD: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.vitaminD), item.estimatedGrams),
    vitaminB12: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.vitaminB12), item.estimatedGrams),
    calcium: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.calcium), item.estimatedGrams),
    iron: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.iron), item.estimatedGrams),
    potassium: normalizeToGrams(nutrientValue(nutrients, nutrientAliases.potassium), item.estimatedGrams)
  });

  return {
    ...item,
    matchedFoodDescription: best.description,
    dataType: best.dataType,
    source: "USDA FoodData Central",
    totals,
    micros
  };
};
