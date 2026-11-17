import { useState, useEffect } from "react";
import { runResearch, getResearchModels, validateResearchReport } from "../services/api";
import ResultCard from "./ResultCard";
import {
  Compass,
  Search,
  BookOpen,
  PenTool,
  CheckCircle,
  Download,
  Copy,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";

export default function ResearchMind() {
  const [topic, setTopic] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [availableModels, setAvailableModels] = useState(["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite", "gemini-1.5-flash"]);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showScraped, setShowScraped] = useState(false);

  // Validation state
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    getResearchModels()
      .then((data) => {
        if (data.models && data.models.length > 0) {
          setAvailableModels(data.models);
          if (data.default) setModel(data.default);
        }
      })
      .catch(() => {});
  }, []);

  const handleRun = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setBusy(true);
    setError("");
    setResult(null);
    setValidationResult(null);
    setStage("Step 1/4: Search Agent querying Tavily & Web...");

    try {
      // Simulate live stage steps
      const stageTimer1 = setTimeout(() => {
        setStage("Step 2/4: Reader Agent scraping top articles...");
      }, 1800);
      const stageTimer2 = setTimeout(() => {
        setStage("Step 3/4: Writer Chain drafting report...");
      }, 3600);
      const stageTimer3 = setTimeout(() => {
        setStage("Step 4/4: Critic Chain evaluating report...");
      }, 5400);

      const res = await runResearch({ topic, model });
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setResult(res);
      setStage("Research completed!");
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleValidate = async () => {
    if (!result || !result.report) return;
    setValidating(true);
    try {
      const val = await validateResearchReport({
        topic: result.topic || topic,
        report: result.report,
        evidence: result.scraped_content || result.search_results
      });
      setValidationResult(val);
    } catch (err) {
      alert("Validation failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setValidating(false);
    }
  };

  const handleDownloadReport = () => {
    if (!result?.report) return;
    const blob = new Blob([result.report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Research_Report_${topic.replace(/\s+/g, "_").slice(0, 30)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = () => {
    if (result?.report) {
      navigator.clipboard.writeText(result.report);
      alert("Research report copied to clipboard!");
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={14} color="#6366f1" /> MULTI-AGENT RESEARCHMIND
          </div>
          <h1>Autonomous AI Research Assistant</h1>
          <p>
            Deploys Search & Reader agents, drafts structured intelligence reports with Gemini, and scores with a Critic chain.
          </p>
        </div>
      </div>

      <form className="panel form" onSubmit={handleRun}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "14px" }}>
          <label>
            Research Topic or Question
            <input
              type="text"
              placeholder="e.g. Next-Generation Solid State Batteries for Aviation"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </label>
          <label>
            Gemini Model
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #dce2ec",
                borderRadius: "9px",
                background: "white",
                color: "#172033"
              }}
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <div className="error">{error}</div>}

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button className="primary" disabled={busy} type="submit">
            {busy ? "Running Pipeline..." : "Launch Research Pipeline"}
          </button>
          {busy && (
            <span style={{ fontSize: "13px", color: "#4f46e5", fontWeight: "600" }}>
              {stage}
            </span>
          )}
        </div>
      </form>

      {result && (
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Action Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
              Topic: <i>{result.topic}</i>
            </span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleCopy}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
              >
                <Copy size={14} /> Copy
              </button>
              <button
                onClick={handleDownloadReport}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
              >
                <Download size={14} /> Download (.md)
              </button>
              <button
                onClick={handleValidate}
                disabled={validating}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", background: "#059669", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
              >
                <ShieldCheck size={14} /> {validating ? "Validating..." : "Validate with Hallucination Detector"}
              </button>
            </div>
          </div>

          {/* Research Report Output */}
          <section className="panel">
            <h2>📄 Generated Research Report</h2>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.7", color: "#334155", background: "#fafbfe", padding: "20px", borderRadius: "10px", border: "1px solid #e7ebf2" }}>
              {result.report}
            </div>
          </section>

          {/* Critic Chain Feedback */}
          {result.feedback && (
            <section className="panel" style={{ borderLeft: "5px solid #4f46e5" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                ⚖️ Critic Chain Evaluation & Review
              </h2>
              <div style={{ whiteSpace: "pre-wrap", color: "#475569", background: "#f8faff", padding: "16px", borderRadius: "8px", fontSize: "14px" }}>
                {result.feedback}
              </div>
            </section>
          )}

          {/* Validation Result from Multi-Agent Hallucination Detector */}
          {validationResult && (
            <div>
              <h2 style={{ marginBottom: "10px", color: "#0f172a" }}>🛡️ Independent Multi-Agent Validation Audit</h2>
              <ResultCard result={validationResult} />
            </div>
          )}

          {/* Raw Data Expanders */}
          <div style={{ display: "grid", gap: "10px" }}>
            <div className="agent-card">
              <button className="agent-head" onClick={() => setShowSearch(!showSearch)}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Search size={16} color="#4f46e5" /> Raw Search Results (Search Agent)
                </span>
                {showSearch ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
              {showSearch && (
                <div className="agent-body" style={{ background: "#f8fafc" }}>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px", color: "#475569" }}>
                    {result.search_results || "No raw search results recorded."}
                  </pre>
                </div>
              )}
            </div>

            <div className="agent-card">
              <button className="agent-head" onClick={() => setShowScraped(!showScraped)}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <BookOpen size={16} color="#059669" /> Raw Scraped Web Content (Reader Agent)
                </span>
                {showScraped ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
              {showScraped && (
                <div className="agent-body" style={{ background: "#f8fafc" }}>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px", color: "#475569" }}>
                    {result.scraped_content || "No scraped content recorded."}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

