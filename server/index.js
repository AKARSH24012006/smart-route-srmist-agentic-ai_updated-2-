import "dotenv/config";
import express from "express";
import cors from "cors";
import { geocodePlace, fetchWeather, weatherEmoji } from "./lib/api.js";
import { buildMockPlan } from "./lib/planner.js";
import { maybeGenerateWithAI } from "./lib/ai.js";

const app = express();
const port = Number(process.env.PORT || 8787);
const budgetCategories = ["Food", "Shopping", "Transport", "Hotels", "Activities"];
let budgetStore = null;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res) => {
  res.json({
    ok: true,
    provider: process.env.AI_PROVIDER || "mock",
    timestamp: new Date().toISOString()
  });
});

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

function buildChatResponse(message, context = {}) {
  const normalized = String(message || "").toLowerCase();
  const destination = context.destination || "your destination";
  const origin = context.origin || "your current city";
  const days = context.days || 3;
  const budget = context.budget || 18000;

  if (normalized.includes("cheap") || normalized.includes("cheaper hotel") || normalized.includes("hotel")) {
    return {
      intent: "hotel_search",
      reply: `Here are some mock hotel suggestions for ${destination}. I’d start with budget-friendly stays near the city core and compare rating, distance, and food access before booking.`,
      cards: [
        {
          type: "hotel-options",
          title: "Hotel filters to try",
          items: ["Under INR 2,500/night", "Rating 4.0+", "Within 3 km of main attractions"]
        }
      ],
      quickActions: ["Find cheaper hotels", `Plan a ${days} day trip to ${destination}`, "Show budget allocation"]
    };
  }

  if (normalized.includes("nearby") || normalized.includes("2 hours") || normalized.includes("quick trip")) {
    return {
      intent: "quick_trip",
      reply: `From ${origin}, I’d suggest a quick-trip mode with places reachable within about 2 hours, keeping travel time low and flexibility high.`,
      cards: [
        {
          type: "quick-trip-options",
          title: "Quick trip ideas",
          items: ["Scenic viewpoint", "Local heritage zone", "Food street cluster", "Lake or nature stop"]
        }
      ],
      quickActions: ["Suggest nearby places I can reach in 2 hours", "Add a shopping place", "Plan a half-day route"]
    };
  }

  if (normalized.includes("plan") || normalized.includes("itinerary") || normalized.includes("trip")) {
    return {
      intent: "trip_planning",
      reply: `Here is a suggested itinerary for a ${days} day trip to ${destination} with a working budget of INR ${Number(budget).toLocaleString("en-IN")}. I’d balance iconic sights, local food, and recovery windows so the route feels smart instead of packed.`,
      cards: [
        {
          type: "itinerary-outline",
          title: "Starter itinerary",
          items: ["Day 1: arrival + orientation", "Day 2: core attractions", "Day 3: local culture + flexible slot"]
        },
        {
          type: "budget-hints",
          title: "Budget guardrails",
          items: ["40% stay", "24% food", "21% activities", "15% transit"]
        }
      ],
      quickActions: [`Plan a ${days} day trip to ${destination}`, "Add a shopping place", "Find cheaper hotels"]
    };
  }

  return {
    intent: "general_guidance",
    reply: `I can help plan trips, refine itineraries, suggest nearby places, and explore cheaper hotel options for ${destination}. Tell me what kind of travel help you want next.`,
    cards: [
      {
        type: "capabilities",
        title: "Assistant capabilities",
        items: ["Trip itinerary ideas", "Quick-trip suggestions", "Budget-aware hotel guidance"]
      }
    ],
    quickActions: ["Plan a 3 day trip to Goa", "Suggest nearby places I can reach in 2 hours", "Find cheaper hotels"]
  };
}

app.post("/api/chat", async (req, res) => {
  const { message, context, history } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(400).json({
      ok: false,
      error: "Message is required."
    });
  }

  res.json({
    ok: true,
    ...buildChatResponse(message, {
      ...context,
      history: Array.isArray(history) ? history.slice(-6) : []
    })
  });
});

function buildMockQuickTrips({ latitude, longitude, available_hours }) {
  const hours = Math.max(1, Math.min(Number(available_hours) || 4, 12));
  const baseLabel = `${Number(latitude).toFixed(2)}, ${Number(longitude).toFixed(2)}`;

  return [
    {
      name: "Lakeview Escape",
      distance: "12 km",
      estimated_travel_time: "28 mins",
      rating: 4.6,
      note: `A scenic low-effort stop reachable comfortably within ${hours} hours from ${baseLabel}.`
    },
    {
      name: "Old Town Food Street",
      distance: "8 km",
      estimated_travel_time: "22 mins",
      rating: 4.4,
      note: "Ideal for a short food-first exploration block."
    },
    {
      name: "Hilltop Sunset Point",
      distance: "18 km",
      estimated_travel_time: "40 mins",
      rating: 4.7,
      note: "Best if you want a photogenic destination with minimal planning overhead."
    }
  ].filter((_, index) => index < Math.min(hours, 3));
}

app.post("/api/quick-trip", async (req, res) => {
  const { latitude, longitude, available_hours } = req.body || {};

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res.status(400).json({
      ok: false,
      error: "Latitude and longitude are required."
    });
  }

  res.json({
    ok: true,
    places: buildMockQuickTrips({ latitude, longitude, available_hours })
  });
});

app.post("/api/budget/create", async (req, res) => {
  const { total_budget, allocations } = req.body || {};
  const totalBudget = Number(total_budget || 0);

  if (!totalBudget) {
    return res.status(400).json({
      ok: false,
      error: "Total budget is required."
    });
  }

  const normalizedAllocations = budgetCategories.reduce((accumulator, category) => {
    accumulator[category] = Number(allocations?.[category] ?? defaultAllocations(totalBudget)[category]);
    return accumulator;
  }, {});

  budgetStore = formatBudgetStore(totalBudget, normalizedAllocations);

  res.json({
    ok: true,
    budget: budgetStore
  });
});

app.post("/api/budget/update", async (req, res) => {
  const { category, amount } = req.body || {};

  if (!budgetStore) {
    return res.status(400).json({
      ok: false,
      error: "Create a budget before updating it."
    });
  }

  if (!budgetCategories.includes(category)) {
    return res.status(400).json({
      ok: false,
      error: "Invalid budget category."
    });
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

  res.json({
    ok: true,
    budget: budgetStore
  });
});

app.get("/api/budget/status", async (_req, res) => {
  res.json({
    ok: true,
    budget: budgetStore
  });
});

app.post("/api/flights/search", async (req, res) => {
  const { origin, destination, departure_date, return_date, passengers } = req.body || {};

  if (!origin || !destination) {
    return res.status(400).json({
      ok: false,
      error: "Origin and destination are required."
    });
  }

  res.json({
    ok: true,
    flights: [
      {
        airline: "IndiGo",
        departure_time: departure_date || "06:45",
        duration: "2h 15m",
        price: `INR ${Number(4200 * (Number(passengers) || 1)).toLocaleString("en-IN")}`
      },
      {
        airline: "Air India",
        departure_time: return_date || "12:10",
        duration: "2h 35m",
        price: `INR ${Number(5100 * (Number(passengers) || 1)).toLocaleString("en-IN")}`
      },
      {
        airline: "Vistara",
        departure_time: "18:20",
        duration: "2h 05m",
        price: `INR ${Number(5900 * (Number(passengers) || 1)).toLocaleString("en-IN")}`
      }
    ]
  });
});

app.post("/api/hotels/search", async (req, res) => {
  const { city, budget } = req.body || {};

  if (!city || !String(city).trim()) {
    return res.status(400).json({
      ok: false,
      error: "City is required."
    });
  }

  res.json({
    ok: true,
    hotels: [
      {
        name: `${city} Urban Stay`,
        rating: 4.3,
        price_per_night: `INR ${Math.max(1800, Math.round(Number(budget || 4000) * 0.18)).toLocaleString("en-IN")}`,
        distance_from_city_center: "1.2 km"
      },
      {
        name: `${city} Vista Hotel`,
        rating: 4.6,
        price_per_night: `INR ${Math.max(2400, Math.round(Number(budget || 4000) * 0.22)).toLocaleString("en-IN")}`,
        distance_from_city_center: "2.6 km"
      },
      {
        name: `${city} Budget Retreat`,
        rating: 4.1,
        price_per_night: `INR ${Math.max(1500, Math.round(Number(budget || 4000) * 0.15)).toLocaleString("en-IN")}`,
        distance_from_city_center: "3.4 km"
      }
    ]
  });
});

app.post("/api/packing-list", async (req, res) => {
  const { destination, travel_dates } = req.body || {};

  if (!destination || !String(destination).trim()) {
    return res.status(400).json({
      ok: false,
      error: "Destination is required."
    });
  }

  const baseItems = ["Travel documents", "Phone charger", "Power bank", "Walking shoes", "Reusable water bottle"];
  const destinationItems = String(destination).toLowerCase().includes("goa")
    ? ["Swimwear", "Sunscreen", "Light cotton wear"]
    : ["Light jacket", "Comfortable layers", "Day backpack"];
  const dateItem = travel_dates ? [`Trip window note: ${travel_dates}`] : [];

  res.json({
    ok: true,
    items: [...baseItems, ...destinationItems, ...dateItem]
  });
});

app.post("/api/emergency-options", async (req, res) => {
  const { origin, destination } = req.body || {};

  res.json({
    ok: true,
    options: {
      nearbyHotels: [
        `${destination || "Destination"} Airport Lodge`,
        `${destination || "Destination"} Transit Stay`
      ],
      alternateFlights: [
        `${origin || "Origin"} to ${destination || "Destination"} redeye option`,
        `${origin || "Origin"} to ${destination || "Destination"} early-morning backup`
      ],
      transportOptions: ["Airport cab", "Railway transfer", "App taxi priority booking"]
    }
  });
});

app.post("/api/crowd-info", async (req, res) => {
  const { destination, attractions } = req.body || {};
  const places = Array.isArray(attractions) && attractions.length ? attractions : [`${destination || "Destination"} Central Spot`];

  res.json({
    ok: true,
    locations: places.map((name, index) => ({
      name,
      peak_hours: index % 2 === 0 ? "11:00 AM - 2:00 PM" : "5:00 PM - 8:00 PM",
      recommended_time: index % 2 === 0 ? "8:00 AM - 10:00 AM" : "3:30 PM - 5:00 PM",
      indicator: index % 2 === 0 ? "Moderate crowd risk" : "Best visited before evening rush"
    }))
  });
});

function buildMockItinerary({ destination, number_of_days, budget, interests }) {
  const place = destination || "your destination";
  const totalDays = Math.max(1, Math.min(Number(number_of_days) || 3, 7));
  const selectedInterests = Array.isArray(interests) && interests.length ? interests : ["Attractions", "Food", "Local culture"];
  const interestCycle = selectedInterests.map(item => String(item));

  const days = Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1;
    const primary = interestCycle[index % interestCycle.length];
    const secondary = interestCycle[(index + 1) % interestCycle.length];

    const plan = dayNumber % 2 === 1
      ? [
          { type: "Attraction", name: `${place} Signature Spot ${dayNumber}`, note: `Best for ${primary.toLowerCase()} and scenic exploration.` },
          { type: "Restaurant", name: `${place} Local Table ${dayNumber}`, note: `Budget-aware meal stop aligned to INR ${Number(budget || 0).toLocaleString("en-IN")}.` },
          { type: "Activity", name: `${primary} Discovery Block`, note: `A flexible afternoon experience centered around ${primary.toLowerCase()}.` }
        ]
      : [
          { type: "Attraction", name: `${place} Cultural Landmark ${dayNumber}`, note: `A lower-crowd morning stop designed around ${secondary.toLowerCase()}.` },
          { type: "Shopping", name: `${place} Market Walk ${dayNumber}`, note: "Time-boxed shopping and souvenir discovery." },
          { type: "Dinner", name: `${place} Evening Dining ${dayNumber}`, note: "A relaxed evening meal and route wrap-up." }
        ];

    return {
      day: dayNumber,
      theme: dayNumber === 1 ? "Arrival and orientation" : `Exploration loop ${dayNumber}`,
      plan
    };
  });

  return {
    title: `${place} ${totalDays}-day itinerary`,
    summary: `Built around ${selectedInterests.join(", ")} with a total trip budget of INR ${Number(budget || 0).toLocaleString("en-IN")}.`,
    days
  };
}

app.post("/api/itinerary", async (req, res) => {
  const { destination, number_of_days, budget, interests } = req.body || {};

  if (!destination || !String(destination).trim()) {
    return res.status(400).json({
      ok: false,
      error: "Destination is required."
    });
  }

  res.json({
    ok: true,
    itinerary: buildMockItinerary({ destination, number_of_days, budget, interests })
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
