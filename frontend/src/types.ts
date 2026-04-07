export type NutrientTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
};

export type MicronutrientHighlights = {
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  vitaminB12: number;
  calcium: number;
  iron: number;
  potassium: number;
};

export type MealItem = {
  name: string;
  description: string;
  estimatedGrams: number;
  householdMeasure: string;
  foodSearchQuery: string;
  confidence: number;
  matchedFoodDescription: string;
  dataType: string;
  source: string;
  totals: NutrientTotals;
  micros: MicronutrientHighlights;
};

export type MealAnalysisResponse = {
  mealName: string;
  summary: string;
  confidence: number;
  notes: string[];
  totals: NutrientTotals;
  micros: MicronutrientHighlights;
  items: MealItem[];
};
