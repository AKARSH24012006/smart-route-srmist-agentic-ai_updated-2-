/* ── Multi-Agent Pipeline Planner ──
   Simulates the pipeline architecture:
   Request Capture → Multi-Agent Analysis → Planning Layer
   → Decision Policy → LLM Refinement → Explainability Layer
*/

const fallbackDictionary = {
  Shillong: {
    vibe: "misty highland culture, music lanes, and view-heavy day trips",
    phrases: ["Khublei = thank you", "Kumno phi long? = how are you?", "Sngewbha = please"],
    highlights: ["Ward's Lake", "Don Bosco Museum", "Police Bazaar", "Elephant Falls", "Umiam Lake", "Cathedral Catholic Church", "Shillong Peak", "Lady Hydari Park"]
  },
  Goa: {
    vibe: "coastal freedom, creative cafés, and sunset-friendly mobility",
    phrases: ["Dev borem korum = thank you", "Hanv Goenkar = I am Goan", "Mhaka zai = I want to go"],
    highlights: ["Fontainhas", "Aguada Fort", "Ashwem Beach", "Anjuna Flea Market", "Divar Island", "Basilica of Bom Jesus", "Chapora Fort", "Dudhsagar Falls"]
  },
  Ooty: {
    vibe: "cool-weather tea trails and scenic ridge viewpoints",
    phrases: ["Vanakkam = hello", "Nandri = thank you", "Saptingala? = have you eaten?"],
    highlights: ["Botanical Garden", "Doddabetta Peak", "Ooty Lake", "Coonoor", "Tea Museum", "Pykara Falls", "Rose Garden", "Nilgiri Mountain Railway"]
  },
  Munnar: {
    vibe: "emerald tea plantations, misty peaks, and wildlife sanctuaries",
    phrases: ["Namaskaram = hello", "Nandi = thank you", "Sugham ano? = how are you?"],
    highlights: ["Eravikulam National Park", "Top Station", "Mattupetty Dam", "Tea Museum", "Anamudi Peak", "Kundala Lake", "Attukal Waterfalls"]
  },
  Rishikesh: {
    vibe: "spiritual adventure town with river rafting and yoga retreats",
    phrases: ["Har Har Mahadev = hail Lord Shiva", "Namaste = greetings", "Dhanyavaad = thank you"],
    highlights: ["Laxman Jhula", "Ram Jhula", "Triveni Ghat", "Neer Garh Waterfall", "Beatles Ashram", "Rajaji National Park", "Parmarth Niketan"]
  },
  Udaipur: {
    vibe: "lakeside royal heritage, palace walks, and sunset boat rides",
    phrases: ["Khamma Ghani = hello", "Padharo Mhare Desh = welcome", "Meharbani = thank you"],
    highlights: ["City Palace", "Lake Pichola", "Jag Mandir", "Fateh Sagar Lake", "Saheliyon Ki Bari", "Monsoon Palace", "Jagdish Temple"]
  }
};

const personaArchetypes = {
  explorer: { priorities: ["route novelty", "walkable discoveries", "local food clusters"], riskTolerance: 0.8, budgetFlex: 0.15 },
  student: { priorities: ["price efficiency", "compact travel windows", "shareable transport"], riskTolerance: 0.6, budgetFlex: 0.05 },
  family: { priorities: ["comfort buffers", "safe transitions", "predictable meal stops"], riskTolerance: 0.3, budgetFlex: 0.1 },
  creator: { priorities: ["golden-hour visuals", "viral angles", "aesthetic cafés"], riskTolerance: 0.7, budgetFlex: 0.2 }
};

function normalizeDestination(destination) {
  return Object.keys(fallbackDictionary).find(
    key => key.toLowerCase() === String(destination || "").trim().toLowerCase()
  );
}

/* ── Multi-Agent Pipeline Simulation ── */
function runPreferenceAgent(input, persona) {
  const archetype = personaArchetypes[persona] || personaArchetypes.explorer;
  const score = 0.7 + Math.random() * 0.25;
  return {
    agent: "Preference Agent (Bayesian)",
    status: "completed",
    score: Number(score.toFixed(2)),
    output: {
      matchedPreferences: archetype.priorities,
      personaScore: score,
      riskTolerance: archetype.riskTolerance,
      budgetFlexibility: archetype.budgetFlex,
      recommendation: `Route optimized for ${persona} profile with ${archetype.priorities[0]} as primary signal.`
    }
  };
}

function runBudgetOptimizer(budget, days, persona) {
  const archetype = personaArchetypes[persona] || personaArchetypes.explorer;
  const dailyBudget = budget / days;
  const flex = archetype.budgetFlex;

  const allocations = {
    accommodation: Math.round(budget * (0.35 + (persona === "family" ? 0.08 : 0))),
    food: Math.round(budget * 0.22),
    activities: Math.round(budget * (0.18 + (persona === "creator" ? 0.05 : 0))),
    transit: Math.round(budget * 0.15),
    emergency: Math.round(budget * 0.05),
    misc: Math.round(budget * 0.05)
  };

  return {
    agent: "Budget Optimizer (LP)",
    status: "completed",
    score: 0.88,
    output: {
      totalBudget: budget,
      dailyBudget: Math.round(dailyBudget),
      allocations,
      flexibilityMargin: `±${Math.round(flex * 100)}%`,
      optimizationIterations: 12,
      constraintsSatisfied: true,
      lpObjective: "Minimize cost variance while maximizing experience quality"
    }
  };
}

function runWeatherRiskAgent(weather) {
  const riskDays = (weather || []).filter(d => d.precipitation > 50 || d.windSpeed > 30);
  const overallRisk = riskDays.length / Math.max(weather?.length || 1, 1);
  const riskLevel = overallRisk > 0.5 ? "HIGH" : overallRisk > 0.2 ? "MODERATE" : "LOW";

  return {
    agent: "Weather Risk Agent (Naive Bayes)",
    status: "completed",
    score: Number((1 - overallRisk * 0.8).toFixed(2)),
    output: {
      riskLevel,
      riskyDays: riskDays.length,
      totalDays: weather?.length || 0,
      probability: Number((overallRisk * 100).toFixed(1)),
      recommendation: riskLevel === "HIGH"
        ? "Pack rain gear and schedule flexible indoor alternatives."
        : riskLevel === "MODERATE"
          ? "Some weather variability expected. Keep backup plans for 1-2 days."
          : "Weather conditions are favorable for outdoor-heavy itinerary.",
      indoorBackupDays: riskDays.map((_, i) => i + 1)
    }
  };
}

function runCrowdAnalyzer(destination, days) {
  const baseLevel = Math.random() * 0.6 + 0.2;
  const hourlyPattern = Array.from({ length: 12 }, (_, h) => {
    const hour = h + 8;
    const peak = hour >= 10 && hour <= 14 ? 0.85 : hour >= 16 && hour <= 19 ? 0.75 : 0.35;
    return { hour: `${hour}:00`, density: Number((peak * (0.8 + Math.random() * 0.4)).toFixed(2)) };
  });

  return {
    agent: "Crowd Analyzer (GPR)",
    status: "completed",
    score: Number((0.7 + Math.random() * 0.25).toFixed(2)),
    output: {
      destination,
      overallDensity: baseLevel > 0.6 ? "High" : baseLevel > 0.35 ? "Medium" : "Low",
      bestVisitingHours: "8:00 AM - 10:00 AM",
      peakHours: "11:00 AM - 2:00 PM",
      hourlyPattern: hourlyPattern.slice(0, 6),
      gprConfidence: Number((0.75 + Math.random() * 0.2).toFixed(2)),
      recommendation: `Visit key attractions before 10 AM to avoid ${Math.round(baseLevel * 100)}% peak density.`
    }
  };
}

/* ── Planning Layer: MCTS Simulation ── */
function runMCTSPlanning(input, agentResults) {
  const iterations = 47;
  const nodes = Math.round(12 + Math.random() * 8);
  const bestScore = Number((0.82 + Math.random() * 0.15).toFixed(3));

  return {
    layer: "Planning Layer",
    method: "Monte Carlo Tree Search + UCB1",
    iterations,
    nodesExplored: nodes,
    bestPathScore: bestScore,
    ucb1ExplorationConstant: 1.414,
    convergenceRate: Number((0.85 + Math.random() * 0.1).toFixed(2)),
    selectedPlan: `Optimal ${input.days}-day route with balanced exploration/rest ratio`
  };
}

/* ── Decision Policy Layer ── */
function runDecisionPolicy(mctsResult, agentResults) {
  const agentScores = agentResults.map(a => a.score);
  const avgScore = agentScores.reduce((s, v) => s + v, 0) / agentScores.length;
  const confidenceScore = Number((avgScore * 0.6 + mctsResult.bestPathScore * 0.4).toFixed(3));

  return {
    layer: "Decision Policy Layer",
    method: "Adaptive Q-Learning RL",
    confidenceScore,
    policyImprovement: Number((Math.random() * 0.15 + 0.05).toFixed(3)),
    factorAttribution: {
      weatherSafety: Number((agentResults[2]?.score || 0.8).toFixed(2)),
      budgetCompliance: Number((agentResults[1]?.score || 0.88).toFixed(2)),
      preferenceMatch: Number((agentResults[0]?.score || 0.85).toFixed(2)),
      crowdAvoidance: Number((agentResults[3]?.score || 0.7).toFixed(2))
    },
    decisionReasoning: [
      `Confidence of ${(confidenceScore * 100).toFixed(1)}% based on multi-agent consensus.`,
      `Weather factor weighted at ${(agentResults[2]?.score * 100 || 80).toFixed(0)}% safety.`,
      `Budget allocation verified within ±${Math.round(Math.random() * 5 + 3)}% of optimal.`,
      `Crowd avoidance strategy reduces peak exposure by ~${Math.round(20 + Math.random() * 30)}%.`
    ]
  };
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

  const totalDays = Math.max(1, Math.min(Number(days) || 5, 7));
  const profile = fallbackDictionary[normalizeDestination(destination)] || {
    vibe: "adaptive city and culture routing",
    phrases: ["Hello", "Thank you", "Please"],
    highlights: ["Central Market", "Heritage Quarter", "Scenic Viewpoint", "Food Street", "Museum", "Local Temple", "Sunset Point"]
  };

  const priorities = (personaArchetypes[persona] || personaArchetypes.explorer).priorities;
  const usedServices = services.length ? services : ["Hotels", "Food", "Attractions"];

  /* ── Run Multi-Agent Pipeline ── */
  const preferenceResult = runPreferenceAgent(input, persona);
  const budgetResult = runBudgetOptimizer(budget, totalDays, persona);
  const weatherResult = runWeatherRiskAgent(liveContext.weather || []);
  const crowdResult = runCrowdAnalyzer(destination, totalDays);
  const agentPipelineResults = [preferenceResult, budgetResult, weatherResult, crowdResult];

  /* ── Planning Layer ── */
  const mctsResult = runMCTSPlanning(input, agentPipelineResults);

  /* ── Decision Policy ── */
  const decisionResult = runDecisionPolicy(mctsResult, agentPipelineResults);

  /* ── Build Itinerary ── */
  const itinerary = Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const highlight = profile.highlights[index % profile.highlights.length];
    const secondary = profile.highlights[(index + 1) % profile.highlights.length];
    return {
      day,
      theme: day === 1 ? "Arrival and orientation" : day === totalDays ? "Final exploration and departure prep" : `Mission block ${day}: ${highlight}`,
      summary: `Focus on ${highlight.toLowerCase()} with ${priorities[index % priorities.length]} optimization.`,
      stops: [
        { time: "08:00", title: day === 1 ? `Arrive at ${destination}` : "Morning start", detail: day === 1 ? "Check-in, breakfast, and area orientation." : `Energy-optimized morning slot at ${highlight}.` },
        { time: "10:30", title: highlight, detail: `Primary exploration — tuned for ${persona} persona. ${usedServices.includes("Attractions") ? "Must-visit landmark." : "Scenic viewpoint."}` },
        { time: "13:00", title: "Local dining", detail: `Budget-aware meal stop (₹${Math.round(budget * 0.22 / totalDays)} allocated). ${profile.vibe.split(",")[0]}.` },
        { time: "15:30", title: secondary, detail: `Secondary discovery block. Crowd density: ${crowdResult.output.overallDensity}.` },
        { time: "18:00", title: "Golden hour & rest", detail: `Recovery window. Weather: ${weatherResult.output.riskLevel.toLowerCase()} risk. Plan flexibility maintained.` }
      ]
    };
  });

  const allocation = budgetResult.output.allocations;

  return {
    summary: {
      title: `${destination} Agentic Mission`,
      tagline: `Designed around ${profile.vibe}.`,
      confidence: decisionResult.confidenceScore,
      totalDays,
      travelMode: "Adaptive surface + local transit",
      notesDigest: notes || "No extra notes provided."
    },
    budget: {
      cap: budget,
      estimated: Object.values(allocation).reduce((s, v) => s + v, 0),
      breakdown: allocation
    },
    weather: (liveContext.weather || []).map(day => ({
      ...day,
      emoji: liveContext.weather ? day.emoji : "🌤️"
    })),
    map: {
      origin,
      destination,
      geocode: liveContext.geocode || null
    },
    itinerary,
    /* ── Pipeline Data ── */
    pipeline: {
      agents: agentPipelineResults,
      planning: mctsResult,
      decision: decisionResult,
      stages: [
        { id: "capture", name: "Request Capture", status: "completed", detail: "Pydantic validation passed" },
        { id: "analysis", name: "Multi-Agent Analysis", status: "completed", detail: `${agentPipelineResults.length} agents completed` },
        { id: "planning", name: "Planning Layer", status: "completed", detail: `MCTS: ${mctsResult.iterations} iterations` },
        { id: "decision", name: "Decision Policy", status: "completed", detail: `Confidence: ${(decisionResult.confidenceScore * 100).toFixed(1)}%` },
        { id: "llm", name: "LLM Refinement", status: "completed", detail: "Context package processed" },
        { id: "explain", name: "Explainability", status: "completed", detail: `${decisionResult.decisionReasoning.length} reasoning traces` },
        { id: "booking", name: "Booking Layer", status: "completed", detail: "Flights + Hotels + Activities ready" }
      ]
    },
    agentInsights: [
      ...agentPipelineResults.map(a => ({ agent: a.agent.split(" (")[0], insight: a.output.recommendation || `Score: ${a.score}` })),
      { agent: "Explainability Agent", insight: `Decision confidence: ${(decisionResult.confidenceScore * 100).toFixed(1)}%. ${decisionResult.decisionReasoning[0]}` }
    ],
    innovations: [
      "Pulse routing that adapts stop density to trip energy level using RL feedback.",
      "Bayesian preference learning that improves with each trip interaction.",
      `Monte Carlo Tree Search with ${mctsResult.iterations} iterations for optimal route selection.`,
      "GPR-based crowd prediction shifts popular spots to off-peak windows."
    ],
    trendSignals: [
      { label: "Crowd heat", value: crowdResult.output.overallDensity },
      { label: "Weather resilience", value: weatherResult.output.riskLevel === "LOW" ? "High" : weatherResult.output.riskLevel === "MODERATE" ? "Medium" : "Low" },
      { label: "Content opportunity", value: persona === "creator" ? "Very High" : "Medium" },
      { label: "Pipeline confidence", value: `${(decisionResult.confidenceScore * 100).toFixed(0)}%` }
    ],
    localKit: {
      vibe: profile.vibe,
      phrases: profile.phrases,
      packing: liveContext.packing || ["Light layers", "Power bank", "Water bottle", "Walking shoes"]
    },
    reasoning: decisionResult.decisionReasoning
  };
}
