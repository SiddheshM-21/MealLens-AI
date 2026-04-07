import type { MicronutrientHighlights, NutrientTotals } from "../types.js";

export const emptyTotals = (): NutrientTotals => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0
});

export const emptyMicros = (): MicronutrientHighlights => ({
  vitaminA: 0,
  vitaminC: 0,
  vitaminD: 0,
  vitaminB12: 0,
  calcium: 0,
  iron: 0,
  potassium: 0
});

export const addTotals = (left: NutrientTotals, right: NutrientTotals): NutrientTotals => ({
  calories: left.calories + right.calories,
  protein: left.protein + right.protein,
  carbs: left.carbs + right.carbs,
  fat: left.fat + right.fat,
  fiber: left.fiber + right.fiber,
  sugar: left.sugar + right.sugar,
  sodium: left.sodium + right.sodium
});

export const addMicros = (
  left: MicronutrientHighlights,
  right: MicronutrientHighlights
): MicronutrientHighlights => ({
  vitaminA: left.vitaminA + right.vitaminA,
  vitaminC: left.vitaminC + right.vitaminC,
  vitaminD: left.vitaminD + right.vitaminD,
  vitaminB12: left.vitaminB12 + right.vitaminB12,
  calcium: left.calcium + right.calcium,
  iron: left.iron + right.iron,
  potassium: left.potassium + right.potassium
});

export const roundNumber = (value: number, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const roundTotals = (totals: NutrientTotals): NutrientTotals => ({
  calories: roundNumber(totals.calories, 0),
  protein: roundNumber(totals.protein),
  carbs: roundNumber(totals.carbs),
  fat: roundNumber(totals.fat),
  fiber: roundNumber(totals.fiber),
  sugar: roundNumber(totals.sugar),
  sodium: roundNumber(totals.sodium, 0)
});

export const roundMicros = (micros: MicronutrientHighlights): MicronutrientHighlights => ({
  vitaminA: roundNumber(micros.vitaminA, 0),
  vitaminC: roundNumber(micros.vitaminC, 1),
  vitaminD: roundNumber(micros.vitaminD, 1),
  vitaminB12: roundNumber(micros.vitaminB12, 1),
  calcium: roundNumber(micros.calcium, 0),
  iron: roundNumber(micros.iron, 1),
  potassium: roundNumber(micros.potassium, 0)
});
