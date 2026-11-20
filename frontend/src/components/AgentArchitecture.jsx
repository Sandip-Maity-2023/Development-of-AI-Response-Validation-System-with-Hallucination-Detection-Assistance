import { Cpu, Database, ShieldCheck, CheckCircle2, ArrowRight, Layers, FileText } from "lucide-react";

export default function AgentArchitecture() {
  const judges = [
    {
      name: "Relevance Judge Agent",
      role: "Semantic Intent & Prompt Adherence",
      weight: "20%",
      model: "Gemini-1.5-Pro / GPT-4o-Mini",
      description: "Evaluates whether the candidate AI response directly addresses the user query without extraneous deviations or tangential fluff."
    },
    {
      name: "Accuracy Judge Agent",
      role: "Factual Grounding & Evidence Alignment",
      weight: "30%",
      model: "Gemini-1.5-Pro / RAG Cross-Examiner",
      description: "Cross-examines each technical assertion against reference passages retrieved from ChromaDB vector index."
    },
    {
      name: "Hallucination Detection Agent",
      role: "Fine-Tuned DistilBERT + Claim NLI",
      weight: "25%",
      model: "DistilBERT Sequence Classifier (Local)",
      description: "Extracts atomic claims and assigns entailment/contradiction probabilities. Severe contradictions trigger an automatic safety veto."
    },
    {
      name: "Completeness Judge Agent",
      role: "Coverage & Nuance Analysis",
      weight: "25%",
      model: "Gemini-1.5-Pro / Structured Evaluator",
      description: "Checks whether all constraints, edge cases, and required aspects of the prompt are addressed in the candidate response."
    },
    {
      name: "Verdict Aggregator Agent",
      role: "Consensus Synthesis & Gating",
      weight: "Composite",
      model: "Rule-Based Aggregator + LLM Synthesizer",
      description: "Calculates normalized composite score, executes safety veto thresholds (FAIL if severe contradiction), and produces the final audit verdict."
    }
  ];

  return (
    <div className="page-container">
      <div className="page-title-banner">
        <div>
          <h1>Agent Architecture & Multi-Agent Consensus Protocol</h1>
          <p>Inspect the specialized AI judges, RAG vector retrieval pipeline, and verdict aggregation workflow.</p>
        </div>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="card" style={{ padding: "26px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>
          End-to-End Evaluation Flowchart
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1.5fr auto 1fr", gap: "14px", alignItems: "center" }}>
          {/* Box 1: Input */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px", textAlign: "center" }}>
            <div style={{ width: 36, height: 36, background: "#eff6ff", color: "#2563eb", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
              <FileText size={18} />
            </div>
            <strong style={{ fontSize: "13px", color: "#0f172a" }}>Evaluation Input</strong>
            <p style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>
              User Prompt + AI Candidate Response
            </p>
          </div>

          <ArrowRight size={20} color="#94a3b8" />

          {/* Box 2: RAG Retriever */}
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "16px", borderRadius: "10px", textAlign: "center" }}>
            <div style={{ width: 36, height: 36, background: "#d1fae5", color: "#059669", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
              <Database size={18} />
            </div>
            <strong style={{ fontSize: "13px", color: "#065f46" }}>RAG Evidence Retriever</strong>
            <p style={{ fontSize: "11.5px", color: "#047857", marginTop: "4px" }}>
              ChromaDB (Cosine ANN Search, 384-dim all-MiniLM-L6-v2)
            </p>
          </div>

          <ArrowRight size={20} color="#94a3b8" />

          {/* Box 3: 4 Parallel Judges */}
          <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", padding: "16px", borderRadius: "10px", textAlign: "center" }}>
            <div style={{ width: 36, height: 36, background: "#ede9fe", color: "#7c3aed", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
              <Cpu size={18} />
            </div>
            <strong style={{ fontSize: "13px", color: "#5b21b6" }}>4 Parallel Judges</strong>
            <p style={{ fontSize: "11.5px", color: "#6d28d9", marginTop: "4px" }}>
              Relevance, Accuracy, DistilBERT Hallucination, Completeness
            </p>
          </div>
        </div>

        {/* Downward to Verdict Aggregator */}
        <div style={{ display: "flex", justifyContent: "center", margin: "20px 0 10px" }}>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "16px 28px", borderRadius: "12px", textAlign: "center", maxWidth: "480px" }}>
            <div style={{ width: 36, height: 36, background: "#dbeafe", color: "#1d4ed8", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
              <ShieldCheck size={20} />
            </div>
            <strong style={{ fontSize: "14px", color: "#1e3a8a" }}>Verdict Aggregator Agent</strong>
            <p style={{ fontSize: "12px", color: "#1e40af", marginTop: "4px" }}>
              Score = 0.20·Rel + 0.30·Acc + 0.25·(100 - HallucRisk) + 0.25·Comp<br />
              <span style={{ fontWeight: "700" }}>Automatic Veto:</span> Risk ≥ 75% triggers immediate FAIL.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Judges Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        {judges.map((j, i) => (
          <div key={i} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong style={{ fontSize: "15px", color: "#0f172a" }}>{j.name}</strong>
              <span className="badge-pill-purple" style={{ fontSize: "11px" }}>{j.weight}</span>
            </div>
            <div style={{ fontSize: "12px", fontWeight: "600", color: "#2563eb", marginBottom: "6px" }}>
              Role: {j.role}
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748b", marginBottom: "10px" }}>
              Engine: {j.model}
            </div>
            <p style={{ fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
              {j.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
