import { useEffect, useState } from "react";

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

  useEffect(() => {
    fetch("/api/health")
      .then(res => res.json())
      .then(data => setStatus({ healthy: Boolean(data.ok), provider: data.provider || "mock" }))
      .catch(() => setStatus({ healthy: false, provider: "offline" }));
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

  return (
    <div className="app-shell">
      <header className="topbar glass-panel">
        <div className="brand">
          <div className="brand-mark">AI</div>
          <div>
            <p className="eyebrow">Smart Route SRMist</p>
            <h1>Agentic AI Travel Studio</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <button className="button button-primary" onClick={emergencyReplan}>Emergency Replan</button>
          <button className="button button-ghost" onClick={syncGps}>Use GPS Origin</button>
          <button className="button button-ghost" onClick={chooseDestination}>Idea Radar</button>
        </div>
      </header>

      <main className="page-grid">
        <section className="hero glass-panel">
          <div className="hero-copy">
            <span className="eyebrow live">Multi-agent route orchestration</span>
            <h2>Travel planning that feels like a command center, not a form.</h2>
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
          </div>
        </section>

        <section className="planner glass-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Trip console</p>
              <h3>Design a mission-ready route</h3>
            </div>
          </div>

          <div className="persona-grid">
            {personas.map(persona => (
              <button
                key={persona.id}
                type="button"
                className={`persona-card ${form.persona === persona.id ? "active" : ""}`}
                onClick={() => setForm(current => ({ ...current, persona: persona.id }))}
              >
                <span>{persona.icon}</span>
                <strong>{persona.title}</strong>
                <small>{persona.body}</small>
              </button>
            ))}
          </div>

          <div className="form-grid">
            <label>
              <span>Origin</span>
              <input value={form.origin} onChange={event => setForm({ ...form, origin: event.target.value })} />
            </label>
            <label>
              <span>Destination</span>
              <input value={form.destination} onChange={event => setForm({ ...form, destination: event.target.value })} />
            </label>
            <label>
              <span>Days</span>
              <input type="number" min="1" max="10" value={form.days} onChange={event => setForm({ ...form, days: Number(event.target.value) })} />
            </label>
            <label>
              <span>Budget</span>
              <input type="number" min="1000" step="500" value={form.budget} onChange={event => setForm({ ...form, budget: Number(event.target.value) })} />
            </label>
            <label className="full">
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
            <div className="plan-output">
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
            </div>
          )}
        </section>

        <aside className="sidebar">
          <section className="glass-panel panel">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Agents</p>
                <h3>Collaboration matrix</h3>
              </div>
            </div>
            <div className="agent-list">
              {agentDeck.map(agent => (
                <article key={agent.name} className={`agent-card ${activeAgents.includes(agent.name) ? "active" : ""}`}>
                  <div>
                    <span className="agent-icon">{agent.icon}</span>
                  </div>
                  <div className="agent-copy">
                    <strong>{agent.name}</strong>
                    <small>{agent.role}</small>
                  </div>
                  <span className="agent-dot" />
                </article>
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
        </aside>
      </main>
    </div>
  );
}

export default App;
