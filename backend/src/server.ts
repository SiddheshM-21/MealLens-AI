import cors from "cors";
import express from "express";
import multer from "multer";
import { env } from "./config.js";
import { addMicros, addTotals, emptyMicros, emptyTotals, roundMicros, roundTotals } from "./lib/nutrients.js";
import { analyzeMealImage } from "./services/groqMealAnalysis.js";
import { enrichMealItem } from "./services/usdaNutrition.js";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok"
  });
});

app.post("/api/analyze", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "An image file is required."
      });
    }

    const vision = await analyzeMealImage(file.mimetype, file.buffer.toString("base64"));
    const enrichedItems = await Promise.all(vision.items.map((item) => enrichMealItem(item)));

    const totals = roundTotals(enrichedItems.reduce((acc, item) => addTotals(acc, item.totals), emptyTotals()));
    const micros = roundMicros(enrichedItems.reduce((acc, item) => addMicros(acc, item.micros), emptyMicros()));

    return res.json({
      mealName: vision.mealName,
      summary: vision.summary,
      confidence: vision.confidence,
      notes: [
        ...vision.notes,
        "Nutrition values are estimates based on visual portion detection and USDA reference foods."
      ],
      totals,
      micros,
      items: enrichedItems
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze meal.";

    return res.status(500).json({
      message
    });
  }
});

app.listen(env.PORT, () => {
  console.log(`MealLens backend running on http://localhost:${env.PORT}`);
});
