import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import type { MealAnalysisResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const macros = [
  { label: "Calories", key: "calories", unit: "kcal" },
  { label: "Protein", key: "protein", unit: "g" },
  { label: "Carbs", key: "carbs", unit: "g" },
  { label: "Fat", key: "fat", unit: "g" },
  { label: "Fiber", key: "fiber", unit: "g" },
  { label: "Sugar", key: "sugar", unit: "g" }
] as const;

const micros = [
  { label: "Vitamin A", key: "vitaminA", unit: "mcg" },
  { label: "Vitamin C", key: "vitaminC", unit: "mg" },
  { label: "Vitamin D", key: "vitaminD", unit: "mcg" },
  { label: "Vitamin B12", key: "vitaminB12", unit: "mcg" },
  { label: "Calcium", key: "calcium", unit: "mg" },
  { label: "Iron", key: "iron", unit: "mg" },
  { label: "Potassium", key: "potassium", unit: "mg" }
] as const;

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [analysis, setAnalysis] = useState<MealAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setAnalysis(null);
    setError("");

    if (!file) {
      setPreviewUrl("");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Choose a meal image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        body: formData
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message ?? "Analysis failed.");
      }

      setAnalysis(payload);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while analyzing the image."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <main className="app-frame">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">AI meal diagnostics</p>
            <h1>Turn a food photo into calorie, macro, and micronutrient insight.</h1>
            <p className="hero-text">
              Upload a meal snapshot and MealLens estimates what is on the plate, how much of it
              is there, and the nutrition profile behind it.
            </p>
          </div>

          <form className="upload-panel" onSubmit={handleSubmit}>
            <label className="upload-dropzone">
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {previewUrl ? (
                <img className="preview-image" src={previewUrl} alt="Meal preview" />
              ) : (
                <div className="upload-placeholder">
                  <span>Drop a meal image</span>
                  <small>PNG, JPG, or HEIC-style exports up to 8MB</small>
                </div>
              )}
            </label>

            <button className="analyze-button" type="submit" disabled={isLoading}>
              {isLoading ? "Analyzing meal..." : "Analyze this meal"}
            </button>

            {error ? <p className="error-message">{error}</p> : null}
          </form>
        </section>

        <section className="info-strip">
          <div>
            <strong>Vision step</strong>
            <span>Detects food items and rough portion size from the image.</span>
          </div>
          <div>
            <strong>Nutrition step</strong>
            <span>Matches each item to USDA food references and aggregates nutrients.</span>
          </div>
          <div>
            <strong>Result</strong>
            <span>Returns calories, macros, vitamins, minerals, and a per-item breakdown.</span>
          </div>
        </section>

        {analysis ? (
          <section className="results-grid">
            <article className="results-card spotlight">
              <p className="eyebrow">Meal summary</p>
              <h2>{analysis.mealName}</h2>
              <p>{analysis.summary}</p>
              <div className="confidence-pill">
                {(analysis.confidence * 100).toFixed(0)}% model confidence
              </div>
            </article>

            <article className="results-card">
              <p className="eyebrow">Macro totals</p>
              <div className="metric-grid">
                {macros.map((metric) => (
                  <div className="metric-tile" key={metric.key}>
                    <span>{metric.label}</span>
                    <strong>
                      {analysis.totals[metric.key]} {metric.unit}
                    </strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="results-card">
              <p className="eyebrow">Micronutrients</p>
              <div className="metric-grid">
                {micros.map((metric) => (
                  <div className="metric-tile" key={metric.key}>
                    <span>{metric.label}</span>
                    <strong>
                      {analysis.micros[metric.key]} {metric.unit}
                    </strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="results-card full-width">
              <p className="eyebrow">Detected foods</p>
              <div className="item-list">
                {analysis.items.map((item) => (
                  <div className="item-card" key={`${item.name}-${item.householdMeasure}`}>
                    <div className="item-header">
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                      </div>
                      <div className="item-stats">
                        <span>{item.estimatedGrams}g estimated</span>
                        <span>{item.householdMeasure}</span>
                      </div>
                    </div>

                    <div className="item-tags">
                      <span>{item.matchedFoodDescription}</span>
                      <span>{item.dataType}</span>
                      <span>{(item.confidence * 100).toFixed(0)}% confidence</span>
                    </div>

                    <div className="item-macros">
                      <span>{item.totals.calories} kcal</span>
                      <span>{item.totals.protein}g protein</span>
                      <span>{item.totals.carbs}g carbs</span>
                      <span>{item.totals.fat}g fat</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="results-card full-width">
              <p className="eyebrow">Analysis notes</p>
              <ul className="notes-list">
                {analysis.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </article>
          </section>
        ) : (
          <section className="empty-state">
            <p className="eyebrow">What the app returns</p>
            <h2>A practical nutrition report, not just object detection.</h2>
            <p>
              The backend estimates portion sizes, looks up food references, and returns totals for
              calories, protein, carbs, fats, fiber, sugar, sodium, and selected vitamins and
              minerals.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
