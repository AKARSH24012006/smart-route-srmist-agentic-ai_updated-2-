export async function geocodePlace(name) {
  if (!name) return null;
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding failed with ${response.status}`);
  }

  const data = await response.json();
  const first = data.results?.[0];
  if (!first) return null;

  return {
    name: first.name,
    country: first.country,
    latitude: first.latitude,
    longitude: first.longitude
  };
}

export async function fetchWeather(latitude, longitude) {
  if (typeof latitude !== "number" || typeof longitude !== "number") return [];
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "3");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Forecast failed with ${response.status}`);
  }

  const data = await response.json();
  const daily = data.daily;
  if (!daily) return [];

  return daily.time.map((date, index) => ({
    date,
    label: `Day ${index + 1}`,
    weatherCode: daily.weather_code[index],
    max: Math.round(daily.temperature_2m_max[index]),
    min: Math.round(daily.temperature_2m_min[index])
  }));
}

export function weatherEmoji(code) {
  if ([0].includes(code)) return "☀️";
  if ([1, 2].includes(code)) return "🌤️";
  if ([3].includes(code)) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌥️";
}
