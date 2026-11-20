import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  Download, 
  FileJson, 
  RotateCcw, 
  Database,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  FileText
} from "lucide-react";
import { getEvaluation, getLatestEvaluation, reportUrl } from "../services/api";

export default function EvaluationResults({ evaluationId, currentResult, onRunNew }) {
  const [data, setData] = useState(currentResult || null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("claims");

  useEffect(() => {
    if (currentResult) {
      setData(currentResult);
    } else if (evaluationId) {
      getEvaluation(evaluationId).then(res => {
        if (res) setData(res);
      }).catch(err => console.error(err));
    } else {
      getLatestEvaluation().then(res => {
        if (res) setData(res);
      }).catch(err => console.error(err));
    }
  }, [evaluationId, currentResult]);

  if (!data) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "60px 20px" }}>
        <h2>Loading evaluation results...</h2>
      </div>
    );
  }

  const evalId = data.evaluation_id || data.id || "EVAL-2026-0841";
  const overallScore = data.overall_score || (data.agents?.verdict?.overall_score ?? 92);
  const verdict = (data.verdict || data.agents?.verdict?.verdict || "PASS").toUpperCase();
  const isPass = verdict === "PASS";
  const isFail = verdict === "FAIL";
  const isNeedsImp = verdict.includes("IMPROVE");

  const agents = data.agents || {};
  const relScore = agents.relevance?.score ?? 96;
  const accScore = agents.accuracy?.score ?? 94;
  const halRisk = agents.hallucination?.risk_score ?? 2;
  const halSafety = Math.max(0, 100 - halRisk);
  const compScore = agents.completeness?.score ?? 84;

  const corpusName = data.corpus_name || (data.document_id ? "Indexed Document Corpus" : "Enterprise_AI_Architecture_Guidelines_v3.pdf");
  const modelName = data.model || data.evaluator_model || "Gemini-1.5-Pro (Judge Multi-Agent)";
  const latency = data.latency_ms || 1240;
  const dateStr = data.timestamp || "2026-10-28 14:15:32";

  const handleCopyId = () => {
    navigator.clipboard.writeText(evalId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const claims = data.claims || [
    { claim: "Retrieval-Augmented Generation (RAG) optimizes LLM outputs by referencing external knowledge bases.", status: "Supported", confidence: 0.98 },
    { claim: "Dense vector embeddings and cosine similarity are utilized to retrieve top-k passages.", status: "Supported", confidence: 0.95 },
    { claim: "RAG reduces hallucinations and eliminates the need for continual base model retraining.", status: "Supported", confidence: 0.94 },
    { claim: "Enterprise benefits encompass factual accuracy, domain grounding, and compliance.", status: "Supported", confidence: 0.96 }
  ];

  const evidencePassages = data.evidence || [
    "Retrieval-Augmented Generation (RAG) is an architectural framework that optimizes Large Language Model (LLM) outputs by referencing authoritative knowledge bases outside of its original training data sources before generating a response. RAG reduces hallucinations by grounding responses in verified facts.",
    "In modern enterprise RAG systems, textual data is chunked into overlapping passages and projected into a dense vector space using models such as Sentence-Transformers (all-MiniLM-L6-v2, 384 dimensions). Retrieval mechanics rely on Approximate Nearest Neighbor (ANN) search via Cosine Similarity."
  ];

  return (
    <div className="page-container">
      {/* Top Breadcrumb & Actions Banner */}
      <div className="page-title-banner">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>Evaluation Results</span>
            <span style={{ color: "#94a3b8" }}>/</span>
            <span style={{ fontSize: "13px", color: "#64748b" }}>Claim-Level Findings & Explainability</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "12.5px" }}>
            <strong style={{ color: "#1e293b", fontSize: "14px" }}>{evalId}</strong>
            <span className={isPass ? "verdict-banner-pass" : isFail ? "verdict-banner-fail" : "verdict-banner-warn"}>
              {isPass ? "✓ Pass" : isFail ? "✕ Fail" : "⚠ Needs Improvement"}
            </span>
            <span className="kpi-sample-badge" style={{ position: "static" }}>Sample Data</span>
            <span style={{ color: "#64748b" }}>• Evaluated on {dateStr}</span>
            <span style={{ color: "#64748b" }}>• Model: {modelName}</span>
            <span style={{ color: "#64748b" }}>• Latency: {latency}ms</span>
          </div>
        </div>

        {/* Top Right Buttons */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button className="topbar-bell-btn" style={{ width: "auto", padding: "0 10px", gap: "6px" }} onClick={handleCopyId}>
            {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
            <span>{copied ? "Copied" : "Copy ID"}</span>
          </button>

          <a 
            href={reportUrl(evalId, "json")} 
            target="_blank" 
            rel="noreferrer" 
            className="topbar-bell-btn" 
            style={{ width: "auto", padding: "0 10px", gap: "6px", textDecoration: "none" }}
          >
            <FileJson size={14} />
            <span>JSON</span>
          </a>

          <a 
            href={reportUrl(evalId, "pdf")} 
            target="_blank" 
            rel="noreferrer" 
            className="topbar-bell-btn" 
            style={{ width: "auto", padding: "0 10px", gap: "6px", textDecoration: "none" }}
          >
            <Download size={14} />
            <span>Export Report</span>
          </a>

          <button className="btn-primary-top" onClick={onRunNew}>
            <RotateCcw size={15} />
            <span>Run New Evaluation</span>
          </button>
        </div>
      </div>

      {/* Big Composite Evaluation Verdict Card */}
      <div className="card" style={{ padding: "26px", border: isPass ? "1px solid #bbf7d0" : isFail ? "1px solid #fecaca" : "1px solid #fde68a" }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "24px", alignItems: "center" }}>
          {/* Left: Synthesis & Notes */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "#0f172a" }}>
                COMPOSITE EVALUATION VERDICT
              </span>
              <span className={isPass ? "verdict-banner-pass" : isFail ? "verdict-banner-fail" : "verdict-banner-warn"}>
                {isPass ? "✓ Pass" : isFail ? "✕ Fail" : "⚠ Needs Improvement"}
              </span>
            </div>

            <p style={{ fontSize: "15px", lineHeight: "1.6", color: "#1e293b", fontWeight: "500", marginBottom: "14px" }}>
              {data.reasoning_summary || data.agents?.verdict?.summary || "The response is highly accurate, well-grounded in enterprise technical literature, and completely addresses all facets of RAG architecture and business benefits. All factual claims are supported by reference evidence."}
            </p>

            <div style={{ fontSize: "12.5px", color: "#475569", display: "flex", gap: "16px", marginBottom: "14px", flexWrap: "wrap" }}>
              <span><strong>Average Evaluation Score:</strong> {overallScore}%</span>
              <span>•</span>
              <span><strong>Corpus:</strong> {corpusName}</span>
            </div>

            {/* Scientific Uncertainty Note */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", color: "#64748b" }}>
              <strong>Scientific Uncertainty Note:</strong> {data.uncertainty_note || "The evaluation confidence reflects semantic concordance with indexed reference passages. Missing reference evidence indicates lack of verification, not mathematical proof of falsity."}
            </div>
          </div>

          {/* Right: Big Score Box */}
          <div style={{ 
            background: "#f8fafc", 
            border: "1px solid #e2e8f0", 
            borderRadius: "12px", 
            padding: "24px 16px", 
            textAlign: "center", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            gap: "8px" 
          }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", letterSpacing: "0.05em" }}>
              OVERALL QUALITY SCORE
            </span>
            <div style={{ fontSize: "44px", fontWeight: "800", color: isPass ? "#16a34a" : isFail ? "#dc2626" : "#d97706", lineHeight: 1 }}>
              {overallScore}
              <small style={{ fontSize: "18px", color: "#94a3b8", fontWeight: "500" }}> / 100</small>
            </div>
            <span className={isPass ? "verdict-banner-pass" : isFail ? "verdict-banner-fail" : "verdict-banner-warn"}>
              {isPass ? "✓ Pass" : isFail ? "✕ Fail" : "⚠ Needs Improvement"}
            </span>
            <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
              Four Specialist Judges + Verdict Aggregator
            </span>
          </div>
        </div>
      </div>

      {/* 4 Specialist Judge Breakdown Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {/* Judge 1: Relevance */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>Relevance</strong>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Weight: 20%</div>
            </div>
            <span className="badge-pill-ready" style={{ fontSize: "11px" }}>Optimal</span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
              {(relScore / 20).toFixed(1)}
            </span>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>/ 5.0</span>
            <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: "700", color: "#16a34a" }}>
              {relScore}%
            </span>
          </div>

          <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ width: `${relScore}%`, height: "100%", background: "#10b981", borderRadius: "4px" }} />
          </div>

          <p style={{ fontSize: "12px", color: "#475569", lineHeight: "1.5", marginTop: "4px" }}>
            {agents.relevance?.reasoning || "Directly addresses both architecture mechanics and enterprise business benefits without extraneous deviations."}
          </p>
        </div>

        {/* Judge 2: Accuracy */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>Accuracy</strong>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Weight: 30%</div>
            </div>
            <span className="badge-pill-ready" style={{ fontSize: "11px" }}>Optimal</span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
              {(accScore / 20).toFixed(1)}
            </span>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>/ 5.0</span>
            <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: "700", color: "#16a34a" }}>
              {accScore}%
            </span>
          </div>

          <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ width: `${accScore}%`, height: "100%", background: "#10b981", borderRadius: "4px" }} />
          </div>

          <p style={{ fontSize: "12px", color: "#475569", lineHeight: "1.5", marginTop: "4px" }}>
            {agents.accuracy?.reasoning || "All technical claims regarding vector search, retrieval mechanics, and chunking strategies align with the grounded corpus."}
          </p>
        </div>

        {/* Judge 3: Hallucination Assessment */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>Hallucination Assessment</strong>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Weight: 25%</div>
            </div>
            <span className={halRisk < 30 ? "badge-pill-ready" : "verdict-banner-fail"} style={{ fontSize: "11px" }}>
              {halRisk < 30 ? "Optimal" : "Risk Detected"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
              {(halSafety / 20).toFixed(1)}
            </span>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>/ 5.0</span>
            <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: "700", color: halRisk < 30 ? "#16a34a" : "#dc2626" }}>
              {halSafety}%
            </span>
          </div>

          <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ width: `${halSafety}%`, height: "100%", background: halRisk < 30 ? "#10b981" : "#ef4444", borderRadius: "4px" }} />
          </div>

          <p style={{ fontSize: "12px", color: "#475569", lineHeight: "1.5", marginTop: "4px" }}>
            {agents.hallucination?.reasoning || "Zero contradicted or fabricated claims detected. All extracted claims have matching semantic support."}
          </p>
        </div>

        {/* Judge 4: Completeness */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>Completeness</strong>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Weight: 25%</div>
            </div>
            <span className="verdict-banner-warn" style={{ fontSize: "11px" }}>Acceptable</span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
              {(compScore / 20).toFixed(1)}
            </span>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>/ 5.0</span>
            <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: "700", color: "#d97706" }}>
              {compScore}%
            </span>
          </div>

          <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ width: `${compScore}%`, height: "100%", background: "#f59e0b", borderRadius: "4px" }} />
          </div>

          <p style={{ fontSize: "12px", color: "#475569", lineHeight: "1.5", marginTop: "4px" }}>
            {agents.completeness?.reasoning || "Thorough architectural breakdown; misses only minor advanced enterprise compliance nuances."}
          </p>
        </div>
      </div>

      {/* Tabs: Claims / Evidence / Original Input */}
      <div className="card">
        <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
          <button 
            className={`nav-link-btn ${activeTab === "claims" ? "active" : ""}`}
            style={{ width: "auto", padding: "6px 14px" }}
            onClick={() => setActiveTab("claims")}
          >
            Claim-Level Verification ({claims.length})
          </button>
          <button 
            className={`nav-link-btn ${activeTab === "evidence" ? "active" : ""}`}
            style={{ width: "auto", padding: "6px 14px" }}
            onClick={() => setActiveTab("evidence")}
          >
            Retrieved Evidence Chunks ({evidencePassages.length})
          </button>
          <button 
            className={`nav-link-btn ${activeTab === "input" ? "active" : ""}`}
            style={{ width: "auto", padding: "6px 14px" }}
            onClick={() => setActiveTab("input")}
          >
            Prompt & Evaluated Answer
          </button>
        </div>

        {activeTab === "claims" && (
          <div className="table-responsive">
            <table className="sentinel-table">
              <thead>
                <tr>
                  <th>EXTRACTED ATOMIC CLAIM</th>
                  <th>VERIFICATION STATUS</th>
                  <th>CONFIDENCE</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: "500" }}>{c.claim}</td>
                    <td>
                      <span className={c.status === "Supported" ? "verdict-banner-pass" : "verdict-banner-fail"}>
                        {c.status === "Supported" ? "✓ Supported" : "✕ Contradicted"}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#0f172a" }}>{Math.round((c.confidence || 0.95) * 100)}%</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "evidence" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {evidencePassages.map((text, i) => (
              <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "14px", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "11px", color: "#64748b" }}>
                  <span>EVIDENCE CHUNK #{i + 1} • {corpusName}</span>
                  <span className="badge-pill-ready" style={{ fontSize: "10px" }}>ChromaDB Cosine Match</span>
                </div>
                <p style={{ fontSize: "13px", color: "#1e293b", lineHeight: "1.6" }}>{text}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "input" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", marginBottom: "6px" }}>
                ORIGINAL QUESTION / PROMPT
              </div>
              <p style={{ fontSize: "13px", color: "#0f172a", whiteSpace: "pre-wrap" }}>{data.question}</p>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", marginBottom: "6px" }}>
                AI-GENERATED RESPONSE
              </div>
              <p style={{ fontSize: "13px", color: "#0f172a", whiteSpace: "pre-wrap" }}>{data.response}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
