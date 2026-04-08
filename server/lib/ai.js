export async function maybeGenerateWithAI(input, liveContext) {
  const provider = process.env.AI_PROVIDER || "mock";
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;

  if (provider === "mock" || !apiKey || !baseUrl || !model) {
    return null;
  }

  const payload = {
    model,
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          "You are an expert travel multi-agent orchestrator. Return valid JSON only with keys: summary, budget, weather, map, itinerary, agentInsights, innovations, trendSignals, localKit, reasoning."
      },
      {
        role: "user",
        content: JSON.stringify({ input, liveContext })
      }
    ],
    response_format: { type: "json_object" }
  };

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`AI provider failed with ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI provider returned no content");
  }

  return JSON.parse(content);
}
