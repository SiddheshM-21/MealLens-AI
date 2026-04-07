# MealLens AI

MealLens AI is a full-stack web app that lets users upload a meal photo and receive nutrition insights such as calories, protein, fats, carbs, fiber, vitamins, minerals, and an item-by-item meal breakdown.

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- AI layer: Groq OpenAI-compatible API
- Nutrition data: USDA FoodData Central API

## How It Works

1. The frontend uploads a meal photo to the backend.
2. The backend sends the image into Groq using `meta-llama/llama-4-scout-17b-16e-instruct` for structured meal parsing.
3. Each identified item is matched against USDA FoodData Central.
4. Nutrients are normalized to the estimated grams for each item.
5. The backend returns total nutrition plus per-item breakdowns for the UI.

## Environment Variables

Create `backend/.env` with:

```bash
PORT=8080
GROQ_API_KEY=your_groq_api_key
USDA_API_KEY=your_usda_api_key
FRONTEND_ORIGIN=http://localhost:5173
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

## Build

```bash
npm run build
```

## Important Notes

- Nutrition estimates are approximate because portion sizes are inferred from a photo.
- USDA values are used as the nutrient baseline, which is a strong public source but still varies by recipe and preparation style.
- Groq’s `meta-llama/llama-4-scout-17b-16e-instruct` supports image understanding, which makes it a better fit for the meal-photo analysis step than text-only models.
- The system is designed so you can later swap in barcode support, user corrections, meal history, auth, or premium analytics.
