import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatbotPremium from "./components/ChatbotPremium.jsx";
import ItineraryPanel from "./components/ItineraryPanel.jsx";
import QuickTripPanel from "./components/QuickTripPanel.jsx";
import BudgetDashboard from "./components/BudgetDashboard.jsx";
import FlightsPanelPremium from "./components/FlightsPanelPremium.jsx";
import HotelsPanelPremium from "./components/HotelsPanelPremium.jsx";
import PackingChecklistPanelPremium from "./components/PackingChecklistPanelPremium.jsx";
import EmergencyPanelPremium from "./components/EmergencyPanelPremium.jsx";
import CrowdInsightsPanelPremium from "./components/CrowdInsightsPanelPremium.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
import { ToastContainer, useToast } from "./components/Toast.jsx";
import DestinationModal from "./components/DestinationModal.jsx";
import ParticleCanvas from "./components/ParticleCanvas.jsx";
import PipelineVisualization from "./components/PipelineVisualization.jsx";
import ActivitiesPanel from "./components/ActivitiesPanel.jsx";

const TravelMapPremium = lazy(() => import("./components/TravelMapPremium.jsx"));

const agentDeck = [
  { name: "Planner", role: "Route optimization", icon: "🛸" },
  { name: "Weather", role: "Forecast analysis", icon: "🌦️" },
  { name: "Crowd", role: "Density prediction", icon: "👥" },
  { name: "Budget", role: "Spend optimization", icon: "💰" },
  { name: "Preference", role: "Taste learning", icon: "❤️" },
  { name: "Booking", role: "Real-time search", icon: "🎫" },
  { name: "Explain", role: "Decision reasoning", icon: "🧩" }
];

const starterActivities = [
  { agent: "Planner Agent", text: "System initialized. Awaiting trip parameters." }
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
  { id: "explorer", icon: "🧭", title: "Explorer", body: "Hidden gems" },
  { id: "student", icon: "🎓", title: "Student", body: "Budget travel" },
  { id: "family", icon: "🏡", title: "Family", body: "Comfort first" },
  { id: "creator", icon: "📸", title: "Creator", body: "Visual stories" }
];

const serviceOptions = ["Hotels", "Food", "Cab rental", "Attractions", "Language tips", "Local events", "Rain backup"];

const navLinks = [
  { id: "hero-section", label: "Overview" },
  { id: "planner-section", label: "Planner" },
  { id: "pipeline-section", label: "Pipeline" },
  { id: "modules-section", label: "Book & Explore" },
  { id: "map-section", label: "Map" }
];

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

/* ── Animated Counter ── */
function AnimatedCounter({ value, duration = 1.2 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const target = typeof value === "number" ? value : parseInt(value, 10);
    if (isNaN(target)) { setDisplay(value); return; }

    let start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (elapsed < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);

  return <span className="counter-number">{display}</span>;
}

/* ── Stagger wrapper ── */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

/* ── Weather Gradient ── */
function weatherGradient(emoji) {
  if (emoji === "☀️") return "linear-gradient(135deg, rgba(255,183,77,0.2), rgba(255,111,0,0.1))";
  if (emoji === "⛅" || emoji === "🌤️") return "linear-gradient(135deg, rgba(255,213,79,0.14), rgba(100,181,246,0.1))";
  if (emoji === "☁️") return "linear-gradient(135deg, rgba(120,144,156,0.15), rgba(176,190,197,0.08))";
  if (emoji === "🌧️" || emoji === "🌦️") return "linear-gradient(135deg, rgba(66,165,245,0.18), rgba(38,50,56,0.12))";
  if (emoji === "⛈️") return "linear-gradient(135deg, rgba(255,82,82,0.15), rgba(38,50,56,0.15))";
  if (emoji === "❄️") return "linear-gradient(135deg, rgba(179,229,252,0.18), rgba(227,242,253,0.1))";
  return "linear-gradient(135deg, rgba(86,216,245,0.08), rgba(139,108,255,0.06))";
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
  const [splashVisible, setSplashVisible] = useState(true);
  const [destinationModalOpen, setDestinationModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("hero-section");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const toast = useToast();
  const emergencyRef = useRef(null);

  useEffect(() => {
    fetch("/api/health")
      .then(res => res.json())
      .then(data => setStatus({ healthy: Boolean(data.ok), provider: data.provider || "mock" }))
      .catch(() => setStatus({ healthy: false, provider: "offline" }));
  }, []);

  useEffect(() => {
    fetch("/api/budget/status")
      .then(res => res.json())
      .then(data => { if (data.ok && data.budget) setBudgetStatus(data.budget); })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSplashVisible(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);

      const sections = navLinks.map(link => ({
        id: link.id,
        el: document.getElementById(link.id)
      })).filter(s => s.el);

      let current = "hero-section";
      for (const section of sections) {
        const rect = section.el.getBoundingClientRect();
        if (rect.top <= 200) {
          current = section.id;
        }
      }
      setActiveNav(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = useCallback((sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const pushActivity = (agent, text) => {
    setActivities(current => [{ agent, text }, ...current].slice(0, 10));
  };

  const toggleService = service => {
    setForm(current => ({
      ...current,
      services: current.services.includes(service)
        ? current.services.filter(item => item !== service)
        : [...current.services, service]
    }));
  };

  /* ── Trip Generation with Pipeline ── */
  const runTripGeneration = async () => {
    setLoading(true);
    setPlan(null);
    setActiveAgents([]);
    toast.info("Agents starting multi-agent pipeline...", "Mission Launched");

    agentDeck.forEach((agent, index) => {
      window.setTimeout(() => {
        setActiveAgents(current => Array.from(new Set([...current, agent.name])));
        pushActivity(agent.name, `${agent.role} engaged for ${form.destination}.`);
      }, 200 * index);
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
      pushActivity("Explainability Agent", `Pipeline complete. Confidence: ${((data.plan?.pipeline?.decision?.confidenceScore || 0.9) * 100).toFixed(1)}%`);
      toast.success(`${form.destination} mission ready! Pipeline confidence: ${((data.plan?.pipeline?.decision?.confidenceScore || 0.9) * 100).toFixed(0)}%`, "Trip Ready");
    } catch (error) {
      pushActivity("Planner Agent", error.message);
      toast.error(error.message, "Plan Failed");
    } finally {
      setLoading(false);
    }
  };

  const runItineraryGeneration = async () => {
    setItineraryLoading(true);
    setItineraryError("");
    toast.info("Building structured itinerary...", "Itinerary");

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
      if (!response.ok || !data.ok) throw new Error(data.error || "Itinerary generation failed.");

      setItinerary(data.itinerary);
      pushActivity("Planner Agent", `Structured itinerary for ${form.destination} generated.`);
      toast.success(`${form.days}-day itinerary for ${form.destination} ready!`, "Itinerary Complete");
    } catch (error) {
      setItineraryError(error.message);
      toast.error(error.message, "Itinerary Failed");
    } finally {
      setItineraryLoading(false);
    }
  };

  const runQuickTripSearch = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported", "Quick Trip");
      return;
    }

    setQuickTripLoading(true);
    setQuickTripError("");
    toast.info("Locating you...", "Quick Trip");

    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        setQuickTripCoords({ latitude, longitude });
        setQuickTripLocation(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);

        try {
          const response = await fetch("/api/quick-trip", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude, available_hours: availableHours })
          });

          const data = await response.json();
          if (!response.ok || !data.ok) throw new Error(data.error || "Quick trip search failed.");

          setQuickTripResults(data.places || []);
          toast.success(`Found ${(data.places || []).length} nearby places!`, "Quick Trip");
        } catch (error) {
          setQuickTripError(error.message);
          toast.error(error.message, "Quick Trip");
        } finally {
          setQuickTripLoading(false);
        }
      },
      () => {
        setQuickTripLoading(false);
        setQuickTripError("Unable to access location.");
        toast.error("Location access denied", "Quick Trip");
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
        body: JSON.stringify({ total_budget: totalBudget, allocations })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Budget creation failed.");

      setBudgetStatus(data.budget);
      toast.success(`Budget of ${formatMoney(totalBudget)} created!`, "Budget Ready");
    } catch (error) {
      setBudgetError(error.message);
      toast.error(error.message, "Budget Failed");
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
        body: JSON.stringify({ category, amount })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Budget update failed.");

      setBudgetStatus(data.budget);
      toast.success(`Added ${formatMoney(amount)} to ${category}`, "Expense Logged");
    } catch (error) {
      setBudgetError(error.message);
      toast.error(error.message, "Budget Update Failed");
    } finally {
      setBudgetLoading(false);
    }
  };

  const chooseDestination = () => {
    setDestinationModalOpen(true);
    pushActivity("Preference Agent", "Idea Radar activated — browse curated destinations.");
    toast.info("Explore destinations", "Idea Radar");
  };

  const halfDayPlan = async () => {
    setItineraryLoading(true);
    setItineraryError("");
    toast.info("Generating half-day mission...", "Quick Plan");

    try {
      const response = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: form.destination,
          number_of_days: 1,
          budget: Math.round(form.budget / form.days),
          interests: form.services
        })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Half-day plan failed.");

      setItinerary(data.itinerary);
      toast.success(`Half-day plan for ${form.destination} ready!`, "Quick Plan");
    } catch (error) {
      setItineraryError(error.message);
      toast.error(error.message, "Quick Plan Failed");
    } finally {
      setItineraryLoading(false);
    }
  };

  const syncGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported.", "GPS");
      return;
    }
    toast.info("Acquiring GPS signal...", "GPS Origin");

    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${latitude.toFixed(2)},${longitude.toFixed(2)}&count=1&language=en&format=json`
          );
          const data = await response.json();
          const place = data.results?.[0];
          const label = place ? `${place.name}, ${place.country}` : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setForm(current => ({ ...current, origin: label }));
          toast.success(`Origin: ${label}`, "GPS Locked");
        } catch {
          const label = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setForm(current => ({ ...current, origin: label }));
          toast.success(`Origin: ${label}`, "GPS Locked");
        }
      },
      () => toast.error("Location access denied.", "GPS Failed"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const emergencyReplan = () => {
    pushActivity("Planner Agent", "Emergency replan triggered.");
    toast.info("Scrolling to Emergency...", "Emergency");
    if (emergencyRef.current) {
      emergencyRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(async () => {
      try {
        const response = await fetch("/api/emergency-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin: form.origin, destination: form.destination })
        });
        const result = await response.json();
        if (result.ok) toast.success("Emergency options loaded!", "Emergency");
      } catch {
        toast.error("Failed to load emergency options", "Emergency");
      }
    }, 800);
  };

  const handleDestinationSelect = (name) => {
    setForm(current => ({ ...current, destination: name }));
    toast.success(`Destination: ${name}!`, "Updated");
    pushActivity("Preference Agent", `Destination selected: ${name}.`);
  };

  const weatherCards = plan?.weather?.length ? plan.weather : [];
  const mapAttractions = (itinerary?.days?.flatMap(day => day.plan.map(item => item.name)).slice(0, 6) || []).concat(
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
    <>
      <SplashScreen visible={splashVisible} />
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
      <DestinationModal
        isOpen={destinationModalOpen}
        onClose={() => setDestinationModalOpen(false)}
        onSelect={handleDestinationSelect}
      />

      <div className="app-shell">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <ParticleCanvas />

        {/* ═══ STICKY NAV BAR ═══ */}
        <motion.header
          className="topbar glass-panel premium-topbar"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: splashVisible ? 2.4 : 0, ease: "easeOut" }}
        >
          <div className="brand">
            <div className="brand-mark glow-mark">SR</div>
            <div>
              <p className="eyebrow">SRMist</p>
              <h1>Smart Route</h1>
            </div>
          </div>

          <nav className="topbar-nav" aria-label="Section navigation">
            {navLinks.map(link => (
              <button
                key={link.id}
                type="button"
                className={`nav-link ${activeNav === link.id ? "active" : ""}`}
                onClick={() => scrollToSection(link.id)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="topbar-actions">
            <button className="button button-primary" onClick={emergencyReplan}>Emergency</button>
            <button className="button button-ghost" onClick={syncGps}>GPS</button>
            <button className="button button-ghost" onClick={chooseDestination}>Explore</button>
          </div>
        </motion.header>

        {/* ═══ HERO SECTION ═══ */}
        <motion.section
          className="glass-panel premium-hero"
          id="hero-section"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: splashVisible ? 2.6 : 0.05, ease: "easeOut" }}
        >
          <div className="hero-floating-card">AI-Powered</div>
          <div className="hero-copy">
            <span className="eyebrow live">Multi-agent pipeline</span>
            <h2 className="animated-headline">Plan smarter, travel better.</h2>
            <p>
              7 AI agents optimize routes, flights, hotels, and budget in real time.
            </p>

            <div className="hero-stats">
              <article>
                <strong><AnimatedCounter value={7} /></strong>
                <span>Agents</span>
              </article>
              <article>
                <strong>{status.healthy ? "LIVE" : "OFF"}</strong>
                <span>Status</span>
              </article>
              <article>
                <strong>{plan?.pipeline?.decision?.confidenceScore ? `${(plan.pipeline.decision.confidenceScore * 100).toFixed(0)}%` : "—"}</strong>
                <span>Confidence</span>
              </article>
            </div>

            <div className="hero-cta-row">
              <button className="button button-primary big" onClick={runTripGeneration} disabled={loading}>
                {loading ? "Generating..." : "Generate Trip"}
              </button>
              <button className="button button-ghost" onClick={halfDayPlan}>
                Quick Plan
              </button>
            </div>
          </div>

          <div className="hero-side">
            <div className="status-card">
              <p className="tiny-label">Provider</p>
              <strong>{status.provider}</strong>
              <span>{status.healthy ? "Online" : "Offline"}</span>
            </div>
            <div className="status-grid">
              <div className="mini-status">
                <p className="tiny-label">Confidence</p>
                <strong>{plan ? `${Math.round((plan.summary?.confidence || 0.9) * 100)}%` : "—"}</strong>
              </div>
              <div className="mini-status">
                <p className="tiny-label">Mode</p>
                <strong>{responseMode}</strong>
              </div>
            </div>
            <div className="hero-mini-grid">
              <article className="hero-mini-card">
                <span>GPS</span>
                <strong>{quickTripCoords ? "Live" : "Standby"}</strong>
              </article>
              <article className="hero-mini-card">
                <span>Budget</span>
                <strong>{budgetStatus ? "Tracked" : "Ready"}</strong>
              </article>
            </div>
          </div>
        </motion.section>

        {/* ═══ PLANNER + SIDEBAR ═══ */}
        <main className="page-grid" id="planner-section">
          <motion.section
            className="planner glass-panel premium-planner"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Planner</p>
                <h3>Plan your trip</h3>
              </div>
              <div className="planner-chip-stack">
                <span className="planner-badge">Live</span>
                <span className="planner-badge alt">Adaptive</span>
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
                <input value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} />
              </label>
              <label className="field-card">
                <span>Destination</span>
                <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
              </label>
              <label className="field-card">
                <span>Days</span>
                <input type="number" min="1" max="10" value={form.days} onChange={e => setForm({ ...form, days: Number(e.target.value) })} />
              </label>
              <label className="field-card">
                <span>Budget (₹)</span>
                <input type="number" min="1000" step="500" value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })} />
              </label>
              <label className="full field-card">
                <span>Intent prompt</span>
                <textarea rows="3" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
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
                {loading ? "Generating..." : "Generate Trip"}
              </button>
              <button className="button button-ghost" onClick={runItineraryGeneration}>
                Itinerary
              </button>
              <button className="button button-ghost" onClick={halfDayPlan}>Quick Plan</button>
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
                    <motion.article
                      key={day.day}
                      className="itinerary-card"
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: day.day * 0.06 }}
                    >
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
                    </motion.article>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.section>

          {/* ═══ SIDEBAR ═══ */}
          <motion.aside
            className="sidebar"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <ItineraryPanel
                itinerary={itinerary}
                loading={itineraryLoading}
                error={itineraryError}
                onGenerate={runItineraryGeneration}
              />
            </motion.div>

            <motion.div variants={fadeUp}>
              <QuickTripPanel
                availableHours={availableHours}
                onHoursChange={setAvailableHours}
                onFetch={runQuickTripSearch}
                loading={quickTripLoading}
                error={quickTripError}
                results={quickTripResults}
                locationLabel={quickTripLocation}
              />
            </motion.div>

            <motion.div variants={fadeUp}>
              <BudgetDashboard
                initialTotalBudget={form.budget}
                budgetStatus={budgetStatus}
                loading={budgetLoading}
                error={budgetError}
                onCreateBudget={createBudget}
                onAddExpense={addBudgetExpense}
              />
            </motion.div>

            <motion.section className="glass-panel panel" variants={fadeUp}>
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">Agents</p>
                  <h3>Active agents</h3>
                </div>
                <span className="planner-badge">Live</span>
              </div>
              <div className="agent-list">
                {agentDeck.map(agent => (
                  <motion.article
                    key={agent.name}
                    className={`agent-card ${activeAgents.includes(agent.name) ? "active" : ""}`}
                    whileHover={{ x: 4 }}
                  >
                    <div><span className="agent-icon">{agent.icon}</span></div>
                    <div className="agent-copy">
                      <strong>{agent.name}</strong>
                      <small>{agent.role}</small>
                    </div>
                    <span className="agent-dot" />
                  </motion.article>
                ))}
              </div>
            </motion.section>

            <motion.section className="glass-panel panel" variants={fadeUp}>
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">Budget</p>
                  <h3>Spending overview</h3>
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
            </motion.section>

            <motion.section className="glass-panel panel" variants={fadeUp}>
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">Activity</p>
                  <h3>Agent feed</h3>
                </div>
              </div>
              <div className="activity-feed">
                {activities.map((item, index) => (
                  <motion.article
                    key={`${item.agent}-${index}`}
                    className="activity-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <span className="activity-bullet" />
                    <div>
                      <strong>{item.agent}</strong>
                      <p>{item.text}</p>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.section>

            {/* ── Weather Cards ── */}
            <motion.section className="glass-panel panel" variants={fadeUp}>
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">Weather</p>
                  <h3>Forecast</h3>
                </div>
              </div>
              <div className="weather-grid">
                {weatherCards.length ? weatherCards.map(day => (
                  <motion.article
                    key={day.date}
                    className="weather-card weather-card-premium"
                    style={{ background: weatherGradient(day.emoji) }}
                    whileHover={{ y: -3, scale: 1.03 }}
                  >
                    <span className="weather-emoji">{day.emoji}</span>
                    <div className="weather-temps">
                      <strong className="weather-high">{day.max}°</strong>
                      <span className="weather-low">{day.min}°</span>
                    </div>
                    <small className="weather-label">{day.label}</small>
                    <div className="weather-bar">
                      <span style={{ width: `${Math.min(((day.max || 30) / 45) * 100, 100)}%` }} />
                    </div>
                  </motion.article>
                )) : (
                  <p className="panel-subtle">Generate a trip to see live forecast.</p>
                )}
              </div>
            </motion.section>

            {plan && (
              <>
                <motion.section className="glass-panel panel" variants={fadeUp}>
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Insights</p>
                      <h3>Recommendations</h3>
                    </div>
                  </div>
                  <div className="bullet-list">
                    {plan.innovations?.map(item => <p key={item}>{item}</p>)}
                  </div>
                </motion.section>

                <motion.section className="glass-panel panel" variants={fadeUp}>
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Local</p>
                      <h3>Phrases & packing</h3>
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
                </motion.section>

                <motion.section className="glass-panel panel" variants={fadeUp}>
                  <div className="section-heading compact">
                    <div>
                      <p className="eyebrow">Reasoning</p>
                      <h3>Decision trail</h3>
                    </div>
                  </div>
                  <div className="bullet-list">
                    {plan.reasoning?.map(item => <p key={item}>{item}</p>)}
                  </div>
                </motion.section>
              </>
            )}
          </motion.aside>
        </main>

        <hr className="section-divider" />

        {/* ═══ PIPELINE VISUALIZATION ═══ */}
        <PipelineVisualization pipelineData={plan?.pipeline} loading={loading} />

        <hr className="section-divider" />

        {/* ═══ MODULES — Flights, Hotels, Activities, Map ═══ */}
        <motion.section
          className="module-grid premium-module-grid"
          id="modules-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <FlightsPanelPremium defaultOrigin={form.origin} defaultDestination={form.destination} defaultExpanded={true} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <HotelsPanelPremium defaultCity={form.destination} defaultBudget={form.budget} defaultExpanded={true} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <ActivitiesPanel destination={form.destination} defaultExpanded={true} />
          </motion.div>
          <motion.div variants={fadeUp} id="map-section">
            <Suspense
              fallback={
                <section className="feature-shell glass-panel collapsed">
                  <div className="feature-shell-header static-shell-header">
                    <div className="feature-shell-icon">🗺️</div>
                    <div>
                      <p className="eyebrow">Feature 6</p>
                      <h3>Interactive Map</h3>
                      <span>Loading map module...</span>
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
          </motion.div>
          <motion.div variants={fadeUp}>
            <PackingChecklistPanelPremium defaultDestination={form.destination} />
          </motion.div>
          <motion.div variants={fadeUp} ref={emergencyRef}>
            <EmergencyPanelPremium origin={form.origin} destination={form.destination} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <CrowdInsightsPanelPremium destination={form.destination} attractions={crowdTargets} />
          </motion.div>
        </motion.section>

        {/* ═══ FOOTER ═══ */}
        <motion.footer
          className="app-footer"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <div className="footer-brand-mark">SR</div>
                <span className="footer-brand-text">Smart Route</span>
              </div>
              <p className="footer-desc">
                Multi-agent AI travel planner with real-time booking.
              </p>
            </div>

            <div className="footer-col">
              <h4>Platform</h4>
              <ul>
                <li>Trip Planning</li>
                <li>Flight Search</li>
                <li>Hotel Booking</li>
                <li>Activities</li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>AI Pipeline</h4>
              <ul>
                <li>Preference Agent</li>
                <li>Budget Optimizer</li>
                <li>Route Planner</li>
                <li>Decision Engine</li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Features</h4>
              <ul>
                <li>Flights</li>
                <li>Hotels</li>
                <li>Activities</li>
                <li>Emergency</li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Smart Route SRMist</p>
            <div className="footer-badge">
              <span>Built with</span> React · Node.js · AI
            </div>
          </div>
        </motion.footer>
      </div>

      {/* ── Scroll to Top ── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            className="scroll-top-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            aria-label="Scroll to top"
          >
            ↑
          </motion.button>
        )}
      </AnimatePresence>

      <ChatbotPremium context={chatContext} />
    </>
  );
}

export default App;
