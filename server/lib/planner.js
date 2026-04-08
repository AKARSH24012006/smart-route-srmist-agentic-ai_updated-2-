const fallbackDictionary = {
  Shillong: {
    vibe: "misty highland culture, music lanes, and view-heavy day trips",
    phrases: ["Khublei = thank you", "Kumno phi long? = how are you?", "Sngewbha = please"],
    highlights: ["Ward's Lake", "Don Bosco Museum", "Police Bazaar", "Elephant Falls", "Umiam Lake"]
  },
  Goa: {
    vibe: "coastal freedom, creative cafés, and sunset-friendly mobility",
    phrases: ["Dev borem korum = thank you", "Hanv Goenkar = I am Goan", "Mhaka zai = I want to go"],
    highlights: ["Fontainhas", "Aguada Fort", "Ashwem", "Anjuna", "Divar"]
  },
  Ooty: {
    vibe: "cool-weather tea trails and scenic ridge viewpoints",
    phrases: ["Vanakkam = hello", "Nandri = thank you", "Saptingala? = have you eaten?"],
    highlights: ["Botanical Garden", "Doddabetta", "Ooty Lake", "Coonoor", "Tea estates"]
  }
};

const personaArchetypes = {
  explorer: ["route novelty", "walkable discoveries", "local food clusters"],
  student: ["price efficiency", "compact travel windows", "shareable transport"],
  family: ["comfort buffers", "safe transitions", "predictable meal stops"],
  creator: ["golden-hour visuals", "viral angles", "aesthetic cafés"]
};

function normalizeDestination(destination) {
  return Object.keys(fallbackDictionary).find(
    key => key.toLowerCase() === String(destination || "").trim().toLowerCase()
  );
}

export function buildMockPlan(input, liveContext = {}) {
  const {
    origin = "Maraimalai Nagar, Chennai",
    destination = "Shillong",
    days = 5,
    budget = 18000,
    persona = "explorer",
    services = [],
    notes = ""
  } = input;

  const totalDays = Math.max(1, Math.min(Number(days) || 5, 6));
  const profile = fallbackDictionary[normalizeDestination(destination)] || {
    vibe: "adaptive city and culture routing",
    phrases: ["Hello", "Thank you", "Please"],
    highlights: ["Central market", "Heritage quarter", "Scenic viewpoint", "Food street", "Museum"]
  };

  const priorities = personaArchetypes[persona] || personaArchetypes.explorer;
  const usedServices = services.length ? services : ["Hotels", "Food", "Attractions"];

  const itinerary = Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const highlight = profile.highlights[index % profile.highlights.length];
    return {
      day,
      theme: day === 1 ? "Arrival and orientation" : `Mission block ${day}`,
      summary: `Focus on ${highlight.toLowerCase()} while preserving ${priorities[0]} and ${priorities[1]}.`,
      stops: [
        { time: "08:30", title: `Start from ${origin}`, detail: "Light transit, breakfast, and route calibration." },
        { time: "11:00", title: highlight, detail: `Primary exploration window tuned for ${persona} persona.` },
        { time: "14:00", title: "Local food interval", detail: `Service focus: ${usedServices.join(", ")}.` },
        { time: "17:30", title: "Reflection checkpoint", detail: "Golden hour, recovery, and next-step adjustment." }
      ]
    };
  });

  const accommodation = Math.round(budget * 0.4);
  const food = Math.round(budget * 0.24);
  const activities = Math.round(budget * 0.21);
  const transit = Math.round(budget * 0.15);

  return {
    summary: {
      title: `${destination} agentic mission`,
      tagline: `Designed around ${profile.vibe}.`,
      confidence: 0.9,
      totalDays,
      travelMode: "Adaptive surface + local transit",
      notesDigest: notes || "No extra notes provided."
    },
    budget: {
      cap: budget,
      estimated: accommodation + food + activities + transit,
      breakdown: { accommodation, food, activities, transit }
    },
    weather: liveContext.weather || [],
    map: {
      origin,
      destination,
      geocode: liveContext.geocode || null
    },
    itinerary,
    agentInsights: [
      { agent: "Planner Agent", insight: `Generated a ${totalDays}-day route with ${priorities.join(", ")} as the main optimization targets.` },
      { agent: "Weather Risk Agent", insight: "Inserted flexible indoor-safe buffers around volatile weather windows." },
      { agent: "Crowd Analyzer", insight: "Shifted high-demand spots to early-day low-density slots." },
      { agent: "Budget Optimizer", insight: "Kept estimated spend within budget while protecting accommodation quality." },
      { agent: "Preference Agent", insight: `Matched the plan to ${persona} persona behavior and the request notes.` },
      { agent: "Booking Assistant", insight: "Flagged transport and stay planning checkpoints for each day." },
      { agent: "Explainability Agent", insight: "Prepared a user-facing reasoning trail for each recommendation." }
    ],
    innovations: [
      "Pulse routing that changes stop density depending on trip energy level.",
      "Narrative travel mode that turns itinerary blocks into mission-style guidance.",
      "Agent confidence surfaces that expose tradeoffs instead of hiding them."
    ],
    trendSignals: [
      { label: "Crowd heat", value: "Low-Medium" },
      { label: "Weather resilience", value: "High" },
      { label: "Content opportunity", value: persona === "creator" ? "Very High" : "Medium" }
    ],
    localKit: {
      vibe: profile.vibe,
      phrases: profile.phrases,
      packing: liveContext.packing || ["Light layers", "Power bank", "Water bottle", "Walking shoes"]
    },
    reasoning: [
      `Route starts at ${origin} and prioritizes ${destination} for ${totalDays} day(s).`,
      `The dominant persona is ${persona}, so the plan favors ${priorities.join(", ")}.`,
      `Budget allocation protects comfort while keeping exploration flexible.`,
      `Enabled services: ${usedServices.join(", ")}.`
    ]
  };
}
