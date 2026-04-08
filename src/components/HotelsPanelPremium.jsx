import { useEffect, useState } from "react";
import FeatureShell from "./FeatureShell.jsx";

function HotelsPanelPremium({ defaultCity, defaultBudget }) {
  const [form, setForm] = useState({
    city: defaultCity,
    check_in: "",
    check_out: "",
    budget: defaultBudget
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(current => ({
      ...current,
      city: defaultCity,
      budget: defaultBudget
    }));
  }, [defaultCity, defaultBudget]);

  const searchHotels = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/hotels/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Hotel search failed.");
      }
      setResults(data.hotels || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureShell
      feature="Feature 5"
      title="Hotels Search"
      subtitle="Stay discovery with budget and centrality context"
      icon="⌂"
      loading={loading}
      error={error}
      defaultExpanded={false}
      action={
        <button className="button button-primary" type="button" onClick={searchHotels} disabled={loading}>
          {loading ? "Searching..." : "Search Hotels"}
        </button>
      }
    >
      <div className="module-panel">
        <div className="module-form-grid">
          <label>
            <span>City</span>
            <input value={form.city} onChange={event => setForm({ ...form, city: event.target.value })} />
          </label>
          <label>
            <span>Check in</span>
            <input type="date" value={form.check_in} onChange={event => setForm({ ...form, check_in: event.target.value })} />
          </label>
          <label>
            <span>Check out</span>
            <input type="date" value={form.check_out} onChange={event => setForm({ ...form, check_out: event.target.value })} />
          </label>
          <label>
            <span>Budget</span>
            <input type="number" min="1000" step="500" value={form.budget} onChange={event => setForm({ ...form, budget: Number(event.target.value) || 0 })} />
          </label>
        </div>

        <div className="module-card-grid">
          {results.map(hotel => (
            <article key={`${hotel.name}-${hotel.price_per_night}`} className="module-card premium-module-card">
              <strong>{hotel.name}</strong>
              <span>{hotel.rating}★ rating</span>
              <span>{hotel.price_per_night} / night</span>
              <span>{hotel.distance_from_city_center} from center</span>
            </article>
          ))}
        </div>
      </div>
    </FeatureShell>
  );
}

export default HotelsPanelPremium;
