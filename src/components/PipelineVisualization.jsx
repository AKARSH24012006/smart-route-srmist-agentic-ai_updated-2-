import { motion } from "framer-motion";

const pipelineNodes = [
  {
    id: "capture",
    name: "Request Capture",
    icon: "📡",
    iconClass: "capture",
    desc: "Validates user input and prepares the request payload.",
    detail: null
  },
  {
    id: "analysis",
    name: "Multi-Agent Analysis",
    icon: "🧠",
    iconClass: "analysis",
    desc: "Preference, budget, weather, and crowd agents collaborate on analysis.",
    detail: null
  },
  {
    id: "planning",
    name: "Route Planning",
    icon: "🎯",
    iconClass: "planning",
    desc: "Optimizes route selection using tree search across multiple iterations.",
    detail: null
  },
  {
    id: "decision",
    name: "Decision Policy",
    icon: "⚖️",
    iconClass: "decision",
    desc: "Reinforcement learning refines policy with confidence scoring.",
    detail: null
  },
  {
    id: "llm",
    name: "LLM Refinement",
    icon: "✨",
    iconClass: "llm",
    desc: "Enriches the plan with real-time data and AI-generated context.",
    detail: null
  },
  {
    id: "explain",
    name: "Explainability",
    icon: "🔍",
    iconClass: "explain",
    desc: "Generates decision reasoning and factor attribution.",
    detail: null
  },
  {
    id: "booking",
    name: "Booking Layer",
    icon: "🎫",
    iconClass: "booking",
    desc: "Prepares real-time flight, hotel, and activity options.",
    detail: null
  }
];

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

function PipelineVisualization({ pipelineData, loading }) {
  const stages = pipelineData?.stages || [];

  const getNodeStatus = (nodeId) => {
    if (loading) {
      const stageIndex = pipelineNodes.findIndex(n => n.id === nodeId);
      const completedCount = stages.filter(s => s.status === "completed").length;
      if (stageIndex < completedCount) return "completed";
      if (stageIndex === completedCount) return "running";
      return "idle";
    }
    const stage = stages.find(s => s.id === nodeId);
    return stage?.status || (stages.length > 0 ? "completed" : "idle");
  };

  const getNodeDetail = (nodeId) => {
    const stage = stages.find(s => s.id === nodeId);
    return stage?.detail || null;
  };

  return (
    <motion.section
      className="glass-panel pipeline-section"
      id="pipeline-section"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="section-label">⚙️ Architecture</div>
      <h2 className="section-title">AI Pipeline</h2>
      <p className="section-subtitle">
        Real-time visualization of the multi-agent pipeline — from request capture through analysis, planning, and booking.
      </p>

      <motion.div
        className="pipeline-grid"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {pipelineNodes.map(node => {
          const status = getNodeStatus(node.id);
          const detail = getNodeDetail(node.id);

          return (
            <motion.div
              key={node.id}
              className={`pipeline-node ${status}`}
              variants={staggerItem}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <div className={`pipeline-icon ${node.iconClass}`}>{node.icon}</div>
              <div className="pipeline-name">{node.name}</div>
              <div className="pipeline-desc">{node.desc}</div>

              <div className={`pipeline-status ${status}`}>
                <span className="pipeline-status-dot" />
                {status === "idle" ? "Standby" : status === "running" ? "Processing" : "Complete"}
              </div>

              {detail && <div className="pipeline-detail">{detail}</div>}
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Agent Scores Summary ── */}
      {pipelineData?.agents?.length > 0 && (
        <motion.div
          style={{ marginTop: "24px" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Agent Scores</h3>
          <div className="pipeline-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
            {pipelineData.agents.map(agent => (
              <div key={agent.agent} className="pipeline-node completed" style={{ padding: "16px" }}>
                <div className="pipeline-name" style={{ fontSize: "0.82rem" }}>
                  {agent.agent.split(" (")[0]}
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: agent.score > 0.8 ? "var(--green)" : "var(--gold)", margin: "4px 0" }}>
                  {(agent.score * 100).toFixed(0)}%
                </div>
                <div className="pipeline-desc" style={{ fontSize: "0.72rem" }}>
                  {agent.output?.recommendation?.slice(0, 60) || `Score: ${agent.score}`}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Decision Confidence ── */}
      {pipelineData?.decision && (
        <motion.div
          style={{ marginTop: "24px", padding: "20px", borderRadius: "var(--r-lg)", border: "1px solid var(--border)", background: "rgba(54, 228, 168, 0.03)" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "1rem" }}>Decision Output</h3>
            <span style={{ fontSize: "1.6rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--green)" }}>
              {(pipelineData.decision.confidenceScore * 100).toFixed(1)}%
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px", marginBottom: "12px" }}>
            {Object.entries(pipelineData.decision.factorAttribution || {}).map(([key, value]) => (
              <div key={key} style={{ padding: "10px", borderRadius: "var(--r-md)", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border)" }}>
                <div style={{ color: "var(--muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div style={{ fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: Number(value) > 0.8 ? "var(--green)" : "var(--gold)" }}>
                  {(Number(value) * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>

          <div className="bullet-list" style={{ gap: "6px" }}>
            {(pipelineData.decision.decisionReasoning || []).map((reason, i) => (
              <p key={i} style={{ fontSize: "0.82rem" }}>{reason}</p>
            ))}
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}

export default PipelineVisualization;
