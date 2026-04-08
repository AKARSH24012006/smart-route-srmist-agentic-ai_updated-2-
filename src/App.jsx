import { Suspense, lazy, useEffect, useState } from "react";
import { motion } from "framer-motion";
import ChatbotPremium from "./components/ChatbotPremium.jsx";
import ItineraryPanel from "./components/ItineraryPanel.jsx";
import QuickTripPanel from "./components/QuickTripPanel.jsx";
import BudgetDashboard from "./components/BudgetDashboard.jsx";
import FlightsPanelPremium from "./components/FlightsPanelPremium.jsx";
import HotelsPanelPremium from "./components/HotelsPanelPremium.jsx";
import PackingChecklistPanelPremium from "./components/PackingChecklistPanelPremium.jsx";
import EmergencyPanelPremium from "./components/EmergencyPanelPremium.jsx";
import CrowdInsightsPanelPremium from "./components/CrowdInsightsPanelPremium.jsx";

const TravelMapPremium = lazy(() => import("./components/TravelMapPremium.jsx"));

const agentDeck = [
  { name: "Planner Agent", role: "Mission architecture", icon: "🛸" },
  { name: "Weather Risk Agent", role: "Forecast resilience", icon: "🌦️" },
  { name: "Crowd Analyzer", role: "Density intelligence", icon: "👥" },
  { name: "Budget Optimizer", role: "Spend discipline", icon: "💰" },
  { name: "Preference Agent", role: "Taste learning", icon: "❤️" },
  { name: "Booking Assistant", role: "Logistics signals", icon: "🎫" },
  { name: "Explainability Agent", role: "Reasoning trace", icon: "🧩" }
];

const starterActivities = [
  { agent: "Planner Agent", text: "System initialized and waiting for trip parameters." }
];

const defaultForm = {
  origin: "Maraimalai Nagar, Chennai",
  destination: "Shillong",
  days: 5,
  budget: 18000,
  persona: "explorer",
  notes: "Cultural experiences, manageable budget, photogenic viewpoints, and weather-safe alternatives.",
  services: ["Hotels", "Food", "Attractions", "Language tips"]
};

const personas = [
  { id: "explorer", icon: "🧭", title: "Explorer", body: "Hidden gems and route novelty" },
  { id: "student", icon: "🎓", title: "Student", body: "Lean budgets and fast movement" },
  { id: "family", icon: "🏡", title: "Family", body: "Comfort, safety, and buffers" },
  { id: "creator", icon: "📸", title: "Creator", body: "Golden-hour visuals and shareable stops" }
];

const serviceOptions = ["Hotels", "Food", "Cab rental", "Attractions", "Language tips", "Local events", "Rain backup"];

function formatMoney(value) {
  return `INR ${Number(value || 0).toLocaleString("en-IN")}`;
}

function App() {
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState({ healthy: false, provider: "checking" });
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState(starterActivities);
  const [activeAgents, setActiveAgents] = useState([]);
  const [responseMode, setResponseMode] = useState("mock-ai");
  const [plan, setPlan] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [itineraryError, setItineraryError] = useState("");
  const [quickTripResults, setQuickTripResults] = useState([]);
  const [quickTripLoading, setQuickTripLoading] = useState(false);
  const [quickTripError, setQuickTripError] = useState("");
  const [availableHours, setAvailableHours] = useState(4);
  const [quickTripLocation, setQuickTripLocation] = useState("");
  const [quickTripCoords, setQuickTripCoords] = useState(null);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetError, setBudgetError] = useState("");

  useEffect(() => {
    fetch("/api/health")
      .then(res => res.json())
      .then(data => setStatus({ healthy: Boolean(data.ok), provider: data.provider || "mock" }))
      .catch(() => setStatus({ healthy: false, provider: "offline" }));
  }, []);

  useEffect(() => {
    fetch("/api/budget/status")
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.budget) {
          setBudgetStatus(data.budget);
        }
      })
      .catch(() => undefined);
  }, []);

  const pushActivity = (agent, text) => {
    setActivities(current => [{ agent, text }, ...current].slice(0, 8));
  };

  const toggleService = service => {
    setForm(current => ({
      ...current,
      services: current.services.includes(service)
        ? current.services.filter(item => item !== service)
        : [...current.services, service]
    }));
  };

  const runTripGeneration = async () => {
    setLoading(true);
    setPlan(null);
    setActiveAgents([]);

    agentDeck.forEach((agent, index) => {
      window.setTimeout(() => {
        setActiveAgents(current => Array.from(new Set([...current, agent.name])));
        pushActivity(agent.name, `${agent.role} engaged for ${form.destination}.`);
      }, 180 * index);
    });

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Plan generation failed");
      setPlan(data.plan);
      setResponseMode(data.mode);
      pushActivity("Explainability Agent", "Compiled the final rationale and exposed the planning tradeoffs.");
    } catch (error) {
      pushActivity("Planner Agent", error.message);
    } finally {
      setLoading(false);
    }
  };

  const runItineraryGeneration = async () => {
    setItineraryLoading(true);
    setItineraryError("");

    try {
      const response = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: form.destination,
          number_of_days: form.days,
          budget: form.budget,
          interests: form.services
        })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Itinerary generation failed.");
      }

      setItinerary(data.itinerary);
      pushActivity("Planner Agent", `Structured itinerary generated for ${form.destination}.`);
    } catch (error) {
      setItineraryError(error.message);
      pushActivity("Planner Agent", error.message);
    } finally {
      setItineraryLoading(false);
    }
  };

  const runQuickTripSearch = () => {
    if (!navigator.geolocation) {
      setQuickTripError("Geolocation is not supported in this browser.");
      pushActivity("Crowd Analyzer", "Quick Trip failed because browser geolocation is unavailable.");
      return;
    }

    setQuickTripLoading(true);
    setQuickTripError("");

    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        setQuickTripCoords({ latitude, longitude });
        setQuickTripLocation(`Lat ${latitude.toFixed(3)}, Lon ${longitude.toFixed(3)}`);

        try {
          const response = await fetch("/api/quick-trip", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude,
              longitude,
              available_hours: availableHours
            })
          });

          const data = await response.json();
          if (!response.ok || !data.ok) {
            throw new Error(data.error || "Quick trip search failed.");
          }

          setQuickTripResults(data.places || []);
          pushActivity("Crowd Analyzer", `Quick Trip suggestions generated for the next ${availableHours} hour(s).`);
        } catch (error) {
          setQuickTripError(error.message);
          pushActivity("Crowd Analyzer", error.message);
        } finally {
          setQuickTripLoading(false);
        }
      },
      error => {
        setQuickTripLoading(false);
        setQuickTripError("Unable to fetch your location. Please allow location access.");
        pushActivity("Crowd Analyzer", error.message || "Location access denied.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const createBudget = async ({ totalBudget, allocations }) => {
    setBudgetLoading(true);
    setBudgetError("");

    try {
      const response = await fetch("/api/budget/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_budget: totalBudget,
          allocations
        })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Budget creation failed.");
      }

      setBudgetStatus(data.budget);
      pushActivity("Budget Optimizer", "Budget manager initialized with category allocations.");
    } catch (error) {
      setBudgetError(error.message);
      pushActivity("Budget Optimizer", error.message);
    } finally {
      setBudgetLoading(false);
    }
  };

  const addBudgetExpense = async (category, amount) => {
    setBudgetLoading(true);
    setBudgetError("");

    try {
      const response = await fetch("/api/budget/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amount
        })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Budget update failed.");
      }

      setBudgetStatus(data.budget);
      pushActivity("Budget Optimizer", `${category} expenses updated independently.`);
    } catch (error) {
      setBudgetError(error.message);
      pushActivity("Budget Optimizer", error.message);
    } finally {
      setBudgetLoading(false);
    }
  };

  const chooseDestination = () => {
    const shortlist = ["Shillong", "Ooty", "Munnar", "Coorg", "Wayanad"];
    pushActivity("Preference Agent", `Recommended shortlist: ${shortlist.join(", ")}.`);
  };

  const halfDayPlan = () => {
    pushActivity("Planner Agent", "Built a half-day mission: scenic spot, local food, cultural stop, and return.");
  };

  const syncGps = () => {
    setForm(current => ({ ...current, origin: "Maraimalai Nagar, Chennai" }));
    pushActivity("Planner Agent", "GPS origin synchronized with the current device profile.");
  };

  const emergencyReplan = () => {
    pushActivity("Planner Agent", "Emergency replan triggered with safety-first routing.");
  };

  const weatherCards = plan?.weather?.length ? plan.weather : [];
  const mapAttractions = (itinerary?.days?.flatMap(day => day.plan.map(item => item.name)).slice(0, 5) || []).concat(
    quickTripResults.map(item => item.name)
  ).filter((value, index, array) => value && array.indexOf(value) === index);
  const crowdTargets = itinerary?.days?.flatMap(day => day.plan.filter(item => item.type === "Attraction").map(item => item.name)).slice(0, 4) || [form.destination];
  const destinationCoords = plan?.map?.geocode?.destination || null;
  const chatContext = {
    origin: form.origin,
    destination: form.destination,
    days: form.days,
    budget: form.budget,
    persona: form.persona,
    services: form.services,
    hasPlan: Boolean(plan)
  };

  return (
    <div className="app-shell">
      <div className="ambient-orb orb-one" />
      <div className="ambient-orb orb-two" />
      <div className="ambient-orb orb-three" />
      <div className="particle-grid" />

      <motion.header
        className="topbar glass-panel premium-topbar"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="brand">
          <div className="brand-mark glow-mark">AI</div>
          <div>
            <p className="eyebrow">Smart Route SRMist</p>
            <h1>Agentic AI Travel Studio</h1>
            <p className="brand-subline">A premium command center for travel planning, orchestration, and live assistance.</p>
          </div>
        </div>

        <div className="topbar-actions">
          <button className="button button-primary" onClick={emergencyReplan}>Emergency Replan</button>
          <button className="button button-ghost" onClick={syncGps}>Use GPS Origin</button>
          <button className="button button-ghost" onClick={chooseDestination}>Idea Radar</button>
        </div>
      </motion.header>

      <main className="page-grid">
        <motion.section
          className="hero glass-panel premium-hero"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="hero-decor hero-ring" />
          <div className="hero-decor hero-ring alt" />
          <div className="hero-floating-card">AI route intelligence</div>
          <div className="hero-copy">
            <span className="eyebrow live">Multi-agent route orchestration</span>
            <h2 className="animated-headline">Travel planning that feels like a command center, not a form.</h2>
            <p>
              This full-stack experience mixes live backend APIs, a React interface, and an AI-ready orchestration layer
              so every trip feels adaptive, transparent, and premium.
            </p>

            <div className="hero-stats">
              <article>
                <strong>7</strong>
                <span>specialist agents</span>
              </article>
              <article>
                <strong>{status.healthy ? "LIVE" : "OFF"}</strong>
                <span>backend health</span>
              </article>
              <article>
                <strong>{responseMode}</strong>
                <span>generation mode</span>
              </article>
            </div>

            <div className="hero-cta-row">
              <button className="button button-primary big" onClick={runTripGeneration} disabled={loading}>
                {loading ? "Agents collaborating..." : "Launch Full Travel Mission"}
              </button>
              <button className="button button-ghost" onClick={runItineraryGeneration}>
                Generate Structured Itinerary
              </button>
            </div>
          </div>

          <div className="hero-side">
            <div className="status-card">
              <p className="tiny-label">Provider</p>
              <strong>{status.provider}</strong>
              <span>{status.healthy ? "Backend online and ready for planning." : "Backend is not responding yet."}</span>
            </div>
            <div className="status-grid">
              <div className="mini-status">
                <p className="tiny-label">Mission confidence</p>
                <strong>{plan ? `${Math.round((plan.summary?.confidence || 0.9) * 100)}%` : "91%"}</strong>
              </div>
              <div className="mini-status">
                <p className="tiny-label">Trend heat</p>
                <strong>{plan?.trendSignals?.[0]?.value || "Low-Medium"}</strong>
              </div>
            </div>
            <div className="hero-mini-grid">
              <article className="hero-mini-card">
                <span>Geo routing</span>
                <strong>{quickTripCoords ? "Live" : "Standby"}</strong>
              </article>
              <article className="hero-mini-card">
                <span>Budget model</span>
                <strong>{budgetStatus ? "Tracked" : "Ready"}</strong>
              </article>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="planner glass-panel premium-planner"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: "easeOut" }}
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Trip console</p>
              <h3>Design a mission-ready route</h3>
            </div>
            <div className="planner-chip-stack">
              <span className="planner-badge">Live orchestration</span>
              <span className="planner-badge alt">Adaptive planning</span>
            </div>
          </div>

          <div className="persona-grid">
            {personas.map(persona => (
              <motion.button
                key={persona.id}
                type="button"
                className={`persona-card ${form.persona === persona.id ? "active" : ""}`}
                onClick={() => setForm(current => ({ ...current, persona: persona.id }))}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{persona.icon}</span>
                <strong>{persona.title}</strong>
                <small>{persona.body}</small>
              </motion.button>
            ))}
          </div>

          <div className="form-grid premium-form-grid">
            <label className="field-card">
              <span>Origin</span>
              <input value={form.origin} onChange={event => setForm({ ...form, origin: event.target.value })} />
            </label>
            <label className="field-card">
              <span>Destination</span>
              <input value={form.destination} onChange={event => setForm({ ...form, destination: event.target.value })} />
            </label>
            <label className="field-card">
              <span>Days</span>
              <input type="number" min="1" max="10" value={form.days} onChange={event => setForm({ ...form, days: Number(event.target.value) })} />
            </label>
            <label className="field-card">
              <span>Budget</span>
              <input type="number" min="1000" step="500" value={form.budget} onChange={event => setForm({ ...form, budget: Number(event.target.value) })} />
            </label>
            <label className="full field-card">
              <span>Intent prompt</span>
              <textarea rows="4" value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} />
            </label>
          </div>

          <div className="chip-row">
            {serviceOptions.map(service => (
              <button
                key={service}
                type="button"
                className={`chip ${form.services.includes(service) ? "active" : ""}`}
                onClick={() => toggleService(service)}
              >
                {service}
              </button>
            ))}
          </div>

          <div className="action-row">
            <button className="button button-primary big" onClick={runTripGeneration} disabled={loading}>
              {loading ? "Agents collaborating..." : "Generate Agentic Trip"}
            </button>
            <button className="button button-ghost" onClick={halfDayPlan}>Half-Day Plan</button>
          </div>

          {plan && (
            <motion.div
              className="plan-output premium-plan-output"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">Generated route</p>
                  <h3>{plan.summary?.title}</h3>
                </div>
                <span className="pill">{plan.summary?.totalDays} days</span>
              </div>

              <p className="plan-tagline">{plan.summary?.tagline}</p>

              <div className="itinerary-grid">
                {plan.itinerary?.map(day => (
                  <article key={day.day} className="itinerary-card">
                    <p className="tiny-label">Day {day.day}</p>
                    <h4>{day.theme}</h4>
                    <p>{day.summary}</p>
                    <div className="stop-list">
                      {day.stops?.map(stop => (
                        <div key={`${day.day}-${stop.time}-${stop.title}`} className="stop-item">
                          <strong>{stop.time}</strong>
                          <div>
                            <span>{stop.title}</span>
                            <small>{stop.detail}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </motion.div>
          )}
        </motion.section>

        <motion.aside
          className="sidebar"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
        >
          <ItineraryPanel
            itinerary={itinerary}
            loading={itineraryLoading}
            error={itineraryError}
            onGenerate={runItineraryGeneration}
          />

          <QuickTripPanel
            availableHours={availableHours}
            onHoursChange={setAvailableHours}
            onFetch={runQuickTripSearch}
            loading={quickTripLoading}
            error={quickTripError}
            results={quickTripResults}
            locationLabel={quickTripLocation}
          />

          <BudgetDashboard
            initialTotalBudget={form.budget}
            budgetStatus={budgetStatus}
            loading={budgetLoading}
            error={budgetError}
            onCreateBudget={createBudget}
            onAddExpense={addBudgetExpense}
          />

          <section className="glass-panel panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Agents</p>
                <h3>Collaboration matrix</h3>
              </div>
              <span className="planner-badge">Live nodes</span>
            </div>
            <div className="agent-list">
              {agentDeck.map(agent => (
                <motion.article
                  key={agent.name}
                  className={`agent-card ${activeAgents.includes(agent.name) ? "active" : ""}`}
                  whileHover={{ x: 4 }}
                >
                  <div>
                    <span className="agent-icon">{agent.icon}</span>
                  </div>
                  <div className="agent-copy">
                    <strong>{agent.name}</strong>
                    <small>{agent.role}</small>
                  </div>
                  <span className="agent-dot" />
                </motion.article>
              ))}
            </div>
          </section>

          <section className="glass-panel panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Budget</p>
                <h3>Optimization ledger</h3>
              </div>
            </div>
            <div className="budget-value">{formatMoney(plan?.budget?.estimated || 0)}</div>
            <p className="panel-subtle">Cap: {formatMoney(plan?.budget?.cap || form.budget)}</p>
            <div className="progress-bar">
              <span style={{ width: `${Math.min((((plan?.budget?.estimated || 0) / (plan?.budget?.cap || form.budget || 1)) * 100), 100)}%` }} />
            </div>
            <div className="metric-list">
              <div><span>Stay</span><strong>{formatMoney(plan?.budget?.breakdown?.accommodation || 0)}</strong></div>
              <div><span>Food</span><strong>{formatMoney(plan?.budget?.breakdown?.food || 0)}</strong></div>
              <div><span>Activities</span><strong>{formatMoney(plan?.budget?.breakdown?.activities || 0)}</strong></div>
              <div><span>Transit</span><strong>{formatMoney(plan?.budget?.breakdown?.transit || 0)}</strong></div>
            </div>
          </section>

          <section className="glass-panel panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Activity</p>
                <h3>Live mission feed</h3>
              </div>
            </div>
            <div className="activity-feed">
              {activities.map((item, index) => (
                <article key={`${item.agent}-${index}`} className="activity-item">
                  <span className="activity-bullet" />
                  <div>
                    <strong>{item.agent}</strong>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="glass-panel panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Weather</p>
                <h3>Live forecast window</h3>
              </div>
            </div>
            <div className="weather-grid">
              {weatherCards.length ? weatherCards.map(day => (
                <article key={day.date} className="weather-card">
                  <span>{day.emoji}</span>
                  <strong>{day.max}° / {day.min}°</strong>
                  <small>{day.label}</small>
                </article>
              )) : (
                <p className="panel-subtle">Generate a trip to fetch live forecast data.</p>
              )}
            </div>
          </section>

          {plan && (
            <>
              <section className="glass-panel panel">
                <div className="section-heading compact">
                  <div>
                    <p className="eyebrow">Innovation layer</p>
                    <h3>Experience upgrades</h3>
                  </div>
                </div>
                <div className="bullet-list">
                  {plan.innovations?.map(item => <p key={item}>{item}</p>)}
                </div>
              </section>

              <section className="glass-panel panel">
                <div className="section-heading compact">
                  <div>
                    <p className="eyebrow">Local kit</p>
                    <h3>Phrases and packing</h3>
                  </div>
                </div>
                <p className="panel-subtle">{plan.localKit?.vibe}</p>
                <div className="dual-list">
                  <div>
                    <h4>Useful phrases</h4>
                    {plan.localKit?.phrases?.map(item => <p key={item}>{item}</p>)}
                  </div>
                  <div>
                    <h4>Packing</h4>
                    {plan.localKit?.packing?.map(item => <p key={item}>{item}</p>)}
                  </div>
                </div>
              </section>

              <section className="glass-panel panel">
                <div className="section-heading compact">
                  <div>
                    <p className="eyebrow">Reasoning</p>
                    <h3>Transparent AI trail</h3>
                  </div>
                </div>
                <div className="bullet-list">
                  {plan.reasoning?.map(item => <p key={item}>{item}</p>)}
                </div>
              </section>
            </>
          )}
        </motion.aside>
      </main>

      <motion.section
        className="module-grid premium-module-grid"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.16, ease: "easeOut" }}
      >
        <FlightsPanelPremium defaultOrigin={form.origin} defaultDestination={form.destination} />
        <HotelsPanelPremium defaultCity={form.destination} defaultBudget={form.budget} />
        <Suspense
          fallback={
            <section className="feature-shell glass-panel collapsed">
              <div className="feature-shell-header static-shell-header">
                <div className="feature-shell-icon">◐</div>
                <div>
                  <p className="eyebrow">Feature 6</p>
                  <h3>Map Navigation</h3>
                  <span>Loading interactive map module...</span>
                </div>
              </div>
            </section>
          }
        >
          <TravelMapPremium
            destination={form.destination}
            destinationCoords={destinationCoords}
            userLocation={quickTripCoords}
            attractions={mapAttractions}
          />
        </Suspense>
        <PackingChecklistPanelPremium defaultDestination={form.destination} />
        <EmergencyPanelPremium origin={form.origin} destination={form.destination} />
        <CrowdInsightsPanelPremium destination={form.destination} attractions={crowdTargets} />
      </motion.section>

      <ChatbotPremium context={chatContext} />
    </div>
  );
}

export default App;
