import "dotenv/config";
import express from "express";
import cors from "cors";
import { geocodePlace, fetchWeather, weatherEmoji } from "./lib/api.js";
import { buildMockPlan } from "./lib/planner.js";
import { maybeGenerateWithAI } from "./lib/ai.js";

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res) => {
  res.json({
    ok: true,
    provider: process.env.AI_PROVIDER || "mock",
    timestamp: new Date().toISOString()
  });
});

app.post("/api/plan", async (req, res) => {
  try {
    const input = req.body || {};
    const destinationQuery = input.destination || "Shillong";
    const originQuery = input.origin || "Maraimalai Nagar, Chennai";

    const [originGeo, destinationGeo] = await Promise.all([
      geocodePlace(originQuery).catch(() => null),
      geocodePlace(destinationQuery).catch(() => null)
    ]);

    const liveWeather = destinationGeo
      ? await fetchWeather(destinationGeo.latitude, destinationGeo.longitude).catch(() => [])
      : [];

    const weather = liveWeather.map(day => ({
      ...day,
      emoji: weatherEmoji(day.weatherCode)
    }));

    const liveContext = {
      geocode: { origin: originGeo, destination: destinationGeo },
      weather,
      packing: weather.some(day => day.emoji === "🌧️" || day.emoji === "⛈️")
        ? ["Rain jacket", "Waterproof shoes", "Power bank", "Quick-dry layer"]
        : ["Light layers", "Walking shoes", "Power bank", "Reusable bottle"]
    };

    const aiPlan = await maybeGenerateWithAI(input, liveContext).catch(() => null);
    const plan = aiPlan || buildMockPlan(input, liveContext);

    res.json({
      ok: true,
      mode: aiPlan ? "live-ai" : "mock-ai",
      plan
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || "Failed to generate trip plan."
    });
  }
});

app.listen(port, () => {
  console.log(`Smart Route backend listening on http://localhost:${port}`);
});
