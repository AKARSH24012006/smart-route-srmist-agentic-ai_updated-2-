import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  geocodePlace,
  fetchWeather,
  weatherEmoji,
  fetchActivities,
  generateRealisticFlights,
  generateRealisticHotels,
  generateFlightBookingUrl,
  generateHotelBookingUrl
} from "./lib/api.js";
import { buildMockPlan } from "./lib/planner.js";
import { maybeGenerateWithAI } from "./lib/ai.js";

const app = express();
const port = Number(process.env.PORT || 8787);
const budgetCategories = ["Food", "Shopping", "Transport", "Hotels", "Activities"];
let budgetStore = null;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* ═══════ HEALTH ═══════ */
app.get("/api/health", async (_req, res) => {
  res.json({
    ok: true,
    provider: process.env.AI_PROVIDER || "mock",
    timestamp: new Date().toISOString(),
    version: "2.0.0"
  });
});

/* ═══════ BUDGET ═══════ */
function formatBudgetStore(totalBudget, allocations, spent = {}) {
  const categories = budgetCategories.reduce((accumulator, category) => {
    const allocated = Number(allocations[category] || 0);
    const categorySpent = Number(spent[category] || 0);
    const remaining = allocated - categorySpent;

    accumulator[category] = {
      allocated,
      spent: categorySpent,
      remaining,
      progress: allocated > 0 ? Math.round((categorySpent / allocated) * 100) : 0
    };
    return accumulator;
  }, {});

  return {
    totalBudget: Number(totalBudget || 0),
    totalSpent: Object.values(categories).reduce((sum, item) => sum + item.spent, 0),
    categories
  };
}

function defaultAllocations(totalBudget) {
  const total = Number(totalBudget || 0);
  return {
    Food: Math.round(total * 0.2),
    Shopping: Math.round(total * 0.15),
    Transport: Math.round(total * 0.2),
    Hotels: Math.round(total * 0.3),
    Activities: Math.round(total * 0.15)
  };
}

app.post("/api/budget/create", async (req, res) => {
  const { total_budget, allocations } = req.body || {};
  const totalBudget = Number(total_budget || 0);

  if (!totalBudget) {
    return res.status(400).json({ ok: false, error: "Total budget is required." });
  }

  const normalizedAllocations = budgetCategories.reduce((accumulator, category) => {
    accumulator[category] = Number(allocations?.[category] ?? defaultAllocations(totalBudget)[category]);
    return accumulator;
  }, {});

  budgetStore = formatBudgetStore(totalBudget, normalizedAllocations);
  res.json({ ok: true, budget: budgetStore });
});

app.post("/api/budget/update", async (req, res) => {
  const { category, amount } = req.body || {};

  if (!budgetStore) {
    return res.status(400).json({ ok: false, error: "Create a budget before updating it." });
  }

  if (!budgetCategories.includes(category)) {
    return res.status(400).json({ ok: false, error: "Invalid budget category." });
  }

  const nextSpent = budgetCategories.reduce((accumulator, item) => {
    accumulator[item] = budgetStore.categories[item].spent;
    return accumulator;
  }, {});

  nextSpent[category] += Number(amount || 0);

  const allocations = budgetCategories.reduce((accumulator, item) => {
    accumulator[item] = budgetStore.categories[item].allocated;
    return accumulator;
  }, {});

  budgetStore = formatBudgetStore(budgetStore.totalBudget, allocations, nextSpent);
  res.json({ ok: true, budget: budgetStore });
});

app.get("/api/budget/status", async (_req, res) => {
  res.json({ ok: true, budget: budgetStore });
});

/* ═══════ CHATBOT ═══════ */
function buildChatResponse(message, context = {}) {
  const normalized = String(message || "").toLowerCase();
  const destination = context.destination || "your destination";
  const origin = context.origin || "your current city";
  const days = context.days || 3;
  const budget = context.budget || 18000;

  if (normalized.includes("cheap") || normalized.includes("hotel")) {
    return {
      intent: "hotel_search",
      reply: `Here are some hotel recommendations for ${destination}. I'd suggest budget-friendly stays near the city center and compare rating, distance, and food access before booking.`,
      cards: [{ type: "hotel-options", title: "Hotel filters to try", items: ["Under ₹2,500/night", "Rating 4.0+", "Within 3 km of attractions"] }],
      quickActions: ["Find cheaper hotels", `Plan a ${days} day trip to ${destination}`, "Show budget allocation"]
    };
  }

  if (normalized.includes("nearby") || normalized.includes("quick trip")) {
    return {
      intent: "quick_trip",
      reply: `From ${origin}, I'd suggest a quick-trip with places reachable within about 2 hours, keeping travel time low and flexibility high.`,
      cards: [{ type: "quick-trip-options", title: "Quick trip ideas", items: ["Scenic viewpoint", "Local heritage zone", "Food street", "Lake or nature stop"] }],
      quickActions: ["Suggest nearby places", "Add a shopping place", "Plan a half-day route"]
    };
  }

  if (normalized.includes("plan") || normalized.includes("itinerary") || normalized.includes("trip")) {
    return {
      intent: "trip_planning",
      reply: `Here's a ${days}-day trip outline for ${destination} with ₹${Number(budget).toLocaleString("en-IN")} budget. I'll balance iconic sights, local food, and rest so the route feels smart.`,
      cards: [
        { type: "itinerary-outline", title: "Starter itinerary", items: ["Day 1: arrival + orientation", "Day 2: core attractions", "Day 3: local culture + flex slot"] },
        { type: "budget-hints", title: "Budget guardrails", items: ["35% stay", "22% food", "18% activities", "15% transit"] }
      ],
      quickActions: [`Plan a ${days} day trip to ${destination}`, "Add a shopping place", "Find cheaper hotels"]
    };
  }

  if (normalized.includes("flight") || normalized.includes("book")) {
    return {
      intent: "booking",
      reply: `I can help find flights and hotels for ${destination}. Use the Flights and Hotels panels to search real-time options with booking links!`,
      cards: [{ type: "booking-info", title: "Booking options", items: ["Search flights in the Flights panel", "Compare hotels in the Hotels panel", "Book via Google Travel links"] }],
      quickActions: ["Search flights", "Search hotels", `Plan trip to ${destination}`]
    };
  }

  return {
    intent: "general_guidance",
    reply: `I can plan trips, find flights & hotels, suggest nearby places, and analyze budgets for ${destination}. What would you like to explore?`,
    cards: [{ type: "capabilities", title: "What I can do", items: ["AI Trip Planning", "Flight & Hotel Search", "Budget Analysis", "Quick-trip Discovery"] }],
    quickActions: ["Plan a 3 day trip to Goa", "Search flights to Shillong", "Find hotels in Udaipur"]
  };
}

app.post("/api/chat", async (req, res) => {
  const { message, context, history } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ ok: false, error: "Message is required." });
  }
  res.json({
    ok: true,
    ...buildChatResponse(message, { ...context, history: Array.isArray(history) ? history.slice(-6) : [] })
  });
});

/* ═══════ FLIGHTS — Real-time-style search ═══════ */
app.post("/api/flights/search", async (req, res) => {
  const { origin, destination, departure_date, return_date, passengers } = req.body || {};

  if (!origin || !destination) {
    return res.status(400).json({ ok: false, error: "Origin and destination are required." });
  }

  const flights = generateRealisticFlights(
    origin, destination, departure_date, Number(passengers) || 1
  );

  res.json({ ok: true, flights, bookingUrl: generateFlightBookingUrl(origin, destination, departure_date) });
});

/* ═══════ HOTELS — Real-time-style search ═══════ */
app.post("/api/hotels/search", async (req, res) => {
  const { city, budget, check_in, check_out } = req.body || {};

  if (!city || !String(city).trim()) {
    return res.status(400).json({ ok: false, error: "City is required." });
  }

  const hotels = generateRealisticHotels(city, Number(budget) || 10000);

  res.json({ ok: true, hotels, bookingUrl: generateHotelBookingUrl(city, check_in, check_out) });
});

/* ═══════ ACTIVITIES — OpenTripMap integration ═══════ */
app.post("/api/activities/search", async (req, res) => {
  const { destination, latitude, longitude } = req.body || {};

  let lat = latitude;
  let lon = longitude;

  // If no coords provided, geocode the destination
  if ((!lat || !lon) && destination) {
    try {
      const geo = await geocodePlace(destination);
      if (geo) {
        lat = geo.latitude;
        lon = geo.longitude;
      }
    } catch {
      // fallback handled below
    }
  }

  if (!lat || !lon) {
    return res.status(400).json({ ok: false, error: "Could not determine location. Provide destination or coordinates." });
  }

  const activities = await fetchActivities(lat, lon);

  // If OpenTripMap returns nothing, provide curated fallback
  if (!activities.length) {
    const fallback = [
      { id: "f1", name: `${destination || "City"} Heritage Walk`, kinds: "cultural, historic", distance: "1.2 km", rating: 4 },
      { id: "f2", name: `${destination || "City"} Local Market`, kinds: "foods, shopping", distance: "0.8 km", rating: 4 },
      { id: "f3", name: `${destination || "City"} Viewpoint`, kinds: "natural, scenic", distance: "3.5 km", rating: 5 },
      { id: "f4", name: `${destination || "City"} Museum`, kinds: "cultural, museum", distance: "1.5 km", rating: 4 },
      { id: "f5", name: `${destination || "City"} Park`, kinds: "natural, park", distance: "2.0 km", rating: 3 },
      { id: "f6", name: `${destination || "City"} Temple`, kinds: "cultural, religious", distance: "1.8 km", rating: 4 }
    ];
    return res.json({ ok: true, activities: fallback, source: "curated" });
  }

  res.json({ ok: true, activities, source: "opentripmap" });
});

/* ═══════ QUICK TRIP ═══════ */
function buildMockQuickTrips({ latitude, longitude, available_hours }) {
  const hours = Math.max(1, Math.min(Number(available_hours) || 4, 12));
  const baseLabel = `${Number(latitude).toFixed(2)}, ${Number(longitude).toFixed(2)}`;

  return [
    { name: "Lakeview Escape", distance: "12 km", estimated_travel_time: "28 mins", rating: 4.6, note: `A scenic stop reachable within ${hours} hours from ${baseLabel}.` },
    { name: "Old Town Food Street", distance: "8 km", estimated_travel_time: "22 mins", rating: 4.4, note: "Perfect for a short food-first exploration." },
    { name: "Hilltop Sunset Point", distance: "18 km", estimated_travel_time: "40 mins", rating: 4.7, note: "Best for photogenic views with minimal planning." }
  ].filter((_, index) => index < Math.min(hours, 3));
}

app.post("/api/quick-trip", async (req, res) => {
  const { latitude, longitude, available_hours } = req.body || {};
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({ ok: false, error: "Latitude and longitude are required." });
  }
  res.json({ ok: true, places: buildMockQuickTrips({ latitude, longitude, available_hours }) });
});

/* ═══════ PACKING LIST ═══════ */
app.post("/api/packing-list", async (req, res) => {
  const { destination, travel_dates } = req.body || {};
  if (!destination || !String(destination).trim()) {
    return res.status(400).json({ ok: false, error: "Destination is required." });
  }

  const baseItems = ["Travel documents", "Phone charger", "Power bank", "Walking shoes", "Reusable water bottle"];
  const dest = String(destination).toLowerCase();
  const destinationItems = dest.includes("goa")
    ? ["Swimwear", "Sunscreen SPF50+", "Light cotton wear", "Flip flops"]
    : dest.includes("shillong") || dest.includes("munnar") || dest.includes("ooty")
      ? ["Rain jacket", "Warm layers", "Waterproof shoes", "Umbrella"]
      : ["Light jacket", "Comfortable layers", "Day backpack", "Sunglasses"];
  const dateItem = travel_dates ? [`Trip window: ${travel_dates}`] : [];

  res.json({ ok: true, items: [...baseItems, ...destinationItems, ...dateItem] });
});

/* ═══════ EMERGENCY ═══════ */
app.post("/api/emergency-options", async (req, res) => {
  const { origin, destination } = req.body || {};
  res.json({
    ok: true,
    options: {
      nearbyHotels: [`${destination || "Destination"} Airport Lodge`, `${destination || "Destination"} Transit Stay`, `${destination || "Destination"} Emergency Inn`],
      alternateFlights: [`${origin || "Origin"} → ${destination || "Dest"} redeye option`, `${origin || "Origin"} → ${destination || "Dest"} early AM backup`, `${origin || "Origin"} → ${destination || "Dest"} via connecting city`],
      transportOptions: ["Airport cab (Ola/Uber)", "Railway transfer", "App taxi priority", "Local auto-rickshaw"]
    }
  });
});

/* ═══════ CROWD INFO ═══════ */
app.post("/api/crowd-info", async (req, res) => {
  const { destination, attractions } = req.body || {};
  const places = Array.isArray(attractions) && attractions.length ? attractions : [`${destination || "Destination"} Central`];

  res.json({
    ok: true,
    locations: places.map((name, index) => ({
      name,
      peak_hours: index % 2 === 0 ? "11:00 AM - 2:00 PM" : "5:00 PM - 8:00 PM",
      recommended_time: index % 2 === 0 ? "8:00 AM - 10:00 AM" : "3:30 PM - 5:00 PM",
      indicator: index % 2 === 0 ? "Moderate crowd risk" : "Best before evening rush"
    }))
  });
});

/* ═══════ ITINERARY ═══════ */
function buildMockItinerary({ destination, number_of_days, budget, interests }) {
  const place = destination || "your destination";
  const totalDays = Math.max(1, Math.min(Number(number_of_days) || 3, 7));
  const selectedInterests = Array.isArray(interests) && interests.length ? interests : ["Attractions", "Food", "Local culture"];

  const days = Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1;
    const primary = selectedInterests[index % selectedInterests.length];
    const secondary = selectedInterests[(index + 1) % selectedInterests.length];

    const plan = dayNumber % 2 === 1
      ? [
          { type: "Attraction", name: `${place} Signature Spot ${dayNumber}`, note: `Best for ${primary.toLowerCase()} exploration.` },
          { type: "Restaurant", name: `${place} Local Table ${dayNumber}`, note: `Budget-aware meal (₹${Number(budget || 0).toLocaleString("en-IN")} total).` },
          { type: "Activity", name: `${primary} Discovery`, note: `Flexible afternoon centered on ${primary.toLowerCase()}.` }
        ]
      : [
          { type: "Attraction", name: `${place} Cultural Landmark ${dayNumber}`, note: `Low-crowd morning stop for ${secondary.toLowerCase()}.` },
          { type: "Shopping", name: `${place} Market Walk ${dayNumber}`, note: "Time-boxed shopping and souvenirs." },
          { type: "Dinner", name: `${place} Evening Dining ${dayNumber}`, note: "Relaxed evening meal and route wrap-up." }
        ];

    return {
      day: dayNumber,
      theme: dayNumber === 1 ? "Arrival and orientation" : `Exploration loop ${dayNumber}`,
      plan
    };
  });

  return {
    title: `${place} ${totalDays}-day itinerary`,
    summary: `Built around ${selectedInterests.join(", ")} with ₹${Number(budget || 0).toLocaleString("en-IN")} budget.`,
    days
  };
}

app.post("/api/itinerary", async (req, res) => {
  const { destination, number_of_days, budget, interests } = req.body || {};
  if (!destination || !String(destination).trim()) {
    return res.status(400).json({ ok: false, error: "Destination is required." });
  }
  res.json({ ok: true, itinerary: buildMockItinerary({ destination, number_of_days, budget, interests }) });
});

/* ═══════ FULL PLAN — with pipeline ═══════ */
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
      ? await fetchWeather(destinationGeo.latitude, destinationGeo.longitude, input.days || 5).catch(() => [])
      : [];

    const weather = liveWeather.map(day => ({
      ...day,
      emoji: weatherEmoji(day.weatherCode)
    }));

    const liveContext = {
      geocode: { origin: originGeo, destination: destinationGeo },
      weather,
      packing: weather.some(day => day.emoji === "🌧️" || day.emoji === "⛈️")
        ? ["Rain jacket", "Waterproof shoes", "Power bank", "Quick-dry layer", "Umbrella"]
        : ["Light layers", "Walking shoes", "Power bank", "Reusable bottle", "Sunscreen"]
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

/* ═══════ START SERVER ═══════ */
app.listen(port, () => {
  console.log(`\n  🛸 Smart Route v2.0 backend`);
  console.log(`  📡 Listening on http://localhost:${port}`);
  console.log(`  🤖 Provider: ${process.env.AI_PROVIDER || "mock"}\n`);
});
