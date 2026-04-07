export type VisionMealItem = {
  name: string;
  description: string;
  estimatedGrams: number;
  householdMeasure: string;
  foodSearchQuery: string;
  confidence: number;
};

export type VisionMealAnalysis = {
  mealName: string;
  summary: string;
  notes: string[];
  confidence: number;
  items: VisionMealItem[];
};

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

export type EnrichedMealItem = VisionMealItem & {
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
  items: EnrichedMealItem[];
};
