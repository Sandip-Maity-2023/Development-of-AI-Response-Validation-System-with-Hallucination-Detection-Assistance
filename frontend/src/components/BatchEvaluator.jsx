import { useState } from "react";
import { 
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  FileCheck2,
  Loader2,
  FileText
} from "lucide-react";
import { uploadBatch } from "../services/api";

export default function BatchEvaluator({ onSelectEvaluation, onNavigate }) {
  const [file, setFile] = useState(null);
  const [batchName, setBatchName] = useState("Enterprise QA Evaluation Set A");
  const [judgeModel, setJudgeModel] = useState("Gemini-1.5-Pro (Judge Multi-Agent)");
  const [busy, setBusy] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,question,response,reference_answer\n" +
      "Explain RAG architecture,Retrieval-Augmented Generation grounds LLM answers in external vector stores,RAG combines vector retrieval with LLM generation\n" +
      "What is oral amoxicillin pediatric dosage?,10 mg/kg monthly divided doses,80-90 mg/kg/day divided in 2 doses\n" +
      "Compare pgvector with FAISS,pgvector integrates directly in PostgreSQL with ACID while FAISS is in-memory for scale,pgvector offers relational ACID and FAISS offers large scale in-memory retrieval";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "eval_sentinel_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSample = () => {
    const sampleCsv = `question,response,reference_answer
"Explain the architecture of Retrieval-Augmented Generation (RAG) and its key benefits for enterprise AI systems.","Retrieval-Augmented Generation (RAG) optimizes LLM outputs by referencing authoritative knowledge bases outside of its original training data sources before generating a response. It embeds queries into dense vectors, retrieves the top relevant chunks using cosine similarity from vector stores like ChromaDB or FAISS, and augments the LLM prompt with grounded context. Key enterprise benefits include hallucination reduction, domain-specific factual grounding, data privacy compliance, and eliminating costly base model fine-tuning.","RAG architecture combines vector retrieval with LLM generation to ground responses in external documents, reducing hallucinations and improving factual accuracy."
"What is the recommended pediatric dosage of oral amoxicillin for acute otitis media?","The standard recommended dosage of oral amoxicillin for acute otitis media is 10 mg/kg/day divided into single monthly doses.","High-dose amoxicillin (80-90 mg/kg/day divided in 2 doses) is the first-line treatment for acute otitis media in pediatric patients."
"Compare PostgreSQL pgvector with FAISS for semantic vector storage in enterprise applications.","PostgreSQL pgvector is an open-source extension that allows storing and querying vector embeddings directly alongside relational business data, supporting ACID transactions and standard SQL joins. FAISS is a library developed by Meta optimized for high-throughput, in-memory nearest neighbor searches on large billion-scale datasets, but lacks built-in relational persistence.","pgvector adds vector capability to relational Postgres with ACID guarantees, while FAISS provides blazing fast in-memory indexing for massive embedding collections."`;

    const blob = new Blob([sampleCsv], { type: "text/csv" });
    const sampleFile = new File([blob], "enterprise_benchmark_eval_set.csv", { type: "text/csv" });
    setFile(sampleFile);
    setBatchName("Enterprise Benchmark QA Set");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select or drop a CSV dataset file.");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);

    try {
      setProgressMsg("Uploading dataset and normalizing headers (question, response, reference)...");
      await new Promise(r => setTimeout(r, 400));
      
      setProgressMsg("Evaluating rows across 4 specialized judges & fine-tuned DistilBERT detector...");
      const data = await uploadBatch(file, batchName, judgeModel);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Batch evaluation failed");
    } finally {
      setBusy(false);
      setProgressMsg("");
    }
  };

  return (
    <div className="page-container">
      {/* Page Title & Top Actions */}
      <div className="page-title-banner">
        <div>
          <h1>Batch Evaluation</h1>
          <p>Run consistent response-quality checks across datasets and review results at scale.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button 
            type="button" 
            className="topbar-bell-btn" 
            style={{ width: "auto", padding: "0 14px", gap: "6px" }}
            onClick={handleDownloadTemplate}
          >
            <Download size={14} />
            <span>Download CSV Template</span>
          </button>

          <button 
            type="button" 
            className="topbar-bell-btn" 
            style={{ width: "auto", padding: "0 14px", gap: "6px", background: "#eff6ff", color: "#2563eb", fontWeight: "600" }}
            onClick={handleLoadSample}
          >
            <FileSpreadsheet size={14} />
            <span>Load Sample Dataset</span>
          </button>
        </div>
      </div>

      {/* Two-Column Form Layout */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Card 1: Upload Dataset */}
          <div className="card">
            <h2 style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#0f172a", marginBottom: "14px" }}>
              1. SELECT OR UPLOAD EVALUATION DATASET (CSV)
            </h2>

            <label 
              style={{
                border: "2px dashed #cbd5e1",
                borderRadius: "12px",
                padding: "40px 20px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                background: file ? "#f0fdf4" : "#f8fafc",
                borderColor: file ? "#86efac" : "#cbd5e1",
                transition: "all 0.15s ease",
                minHeight: "180px"
              }}
            >
              <input
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
              <div style={{ width: 44, height: 44, borderRadius: 10, background: file ? "#dcfce7" : "#eff6ff", color: file ? "#16a34a" : "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <UploadCloud size={24} />
              </div>

              {file ? (
                <>
                  <strong style={{ fontSize: "14px", color: "#166534" }}>{file.name}</strong>
                  <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                    {(file.size / 1024).toFixed(1)} KB • Click to change file
                  </span>
                </>
              ) : (
                <>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>Click to browse or drop CSV file</strong>
                  <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                    Required columns: question, response, optional: reference_answer
                  </span>
                </>
              )}
            </label>
          </div>

          {/* Card 2: Batch Settings */}
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#0f172a", marginBottom: "14px" }}>
                2. BATCH AUDIT SETTINGS
              </h2>

              <div className="form-group">
                <label className="form-label">Batch Run Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Judge Architecture</label>
                <select 
                  className="form-select"
                  value={judgeModel}
                  onChange={(e) => setJudgeModel(e.target.value)}
                >
                  <option value="Gemini-1.5-Pro (Judge Multi-Agent)">Gemini-1.5-Pro (Judge Multi-Agent)</option>
                  <option value="Gemini-2.5-Flash (High Speed)">Gemini-2.5-Flash (High Speed)</option>
                  <option value="GPT-4o-Mini (Balanced)">GPT-4o-Mini (Balanced)</option>
                  <option value="DistilBERT Fine-Tuned (Local NLI)">DistilBERT Fine-Tuned (Local NLI)</option>
                </select>
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", color: "#475569", marginBottom: "16px" }}>
                <strong>Strictness:</strong> Standard Enterprise<br />
                <span style={{ color: "#64748b" }}>Weights: 20% Rel / 30% Acc / 25% Halluc / 25% Comp</span>
              </div>
            </div>

            <div>
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px", borderRadius: "6px", color: "#991b1b", fontSize: "12px", marginBottom: "10px" }}>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary-top" 
                disabled={busy}
                style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "14px" }}
              >
                {busy ? (
                  <>
                    <Loader2 size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                    <span>Processing Batch Dataset...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    <span>Start Batch Evaluation</span>
                  </>
                )}
              </button>

              {busy && progressMsg && (
                <div style={{ marginTop: "10px", textAlign: "center", fontSize: "12px", color: "#2563eb", fontWeight: "500" }}>
                  {progressMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Batch Results View */}
      {result && (
        <div className="card" style={{ marginTop: "10px" }}>
          <div className="chart-card-header">
            <div>
              <h2>Batch Execution Results: {result.batch_name || batchName}</h2>
              <p>Processed {result.total} evaluation records</p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span className="badge-pill-ready">
                Average Score: {result.average_score}%
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "11px", color: "#64748b" }}>TOTAL ROWS</div>
              <strong style={{ fontSize: "18px" }}>{result.total}</strong>
            </div>
            <div style={{ background: "#f0fdf4", padding: "12px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: "11px", color: "#166534" }}>PASSED</div>
              <strong style={{ fontSize: "18px", color: "#166534" }}>{result.pass_count}</strong>
            </div>
            <div style={{ background: "#fffbeb", padding: "12px", borderRadius: "8px", border: "1px solid #fde68a" }}>
              <div style={{ fontSize: "11px", color: "#92400e" }}>NEEDS IMPROVEMENT</div>
              <strong style={{ fontSize: "18px", color: "#92400e" }}>{result.needs_improvement_count}</strong>
            </div>
            <div style={{ background: "#fef2f2", padding: "12px", borderRadius: "8px", border: "1px solid #fecaca" }}>
              <div style={{ fontSize: "11px", color: "#991b1b" }}>FAILED</div>
              <strong style={{ fontSize: "18px", color: "#991b1b" }}>{result.fail_count}</strong>
            </div>
          </div>

          {/* Results Table */}
          <div className="table-responsive">
            <table className="sentinel-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>QUESTION</th>
                  <th>OVERALL SCORE</th>
                  <th>VERDICT</th>
                  <th>HALLUCINATION RISK</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(result.results || []).map((row, i) => {
                  const isPass = (row.verdict || "").toUpperCase() === "PASS";
                  const isFail = (row.verdict || "").toUpperCase() === "FAIL";
                  const halRisk = row.agents?.hallucination?.risk_score ?? 0;
                  return (
                    <tr key={i}>
                      <td><strong>{i + 1}</strong></td>
                      <td style={{ maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.question}
                      </td>
                      <td>
                        <strong>{row.overall_score}</strong>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}> / 100</span>
                      </td>
                      <td>
                        <span className={isPass ? "verdict-banner-pass" : isFail ? "verdict-banner-fail" : "verdict-banner-warn"}>
                          {isPass ? "✓ Pass" : isFail ? "✕ Fail" : "⚠ Needs Improvement"}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: halRisk > 50 ? "#dc2626" : "#16a34a", fontWeight: "600" }}>
                          {halRisk}% {halRisk > 50 ? "(High Risk)" : "(Safe)"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="nav-link-btn"
                          style={{ width: "auto", padding: "4px 8px", fontSize: "11.5px", background: "#eff6ff", color: "#2563eb", fontWeight: "600" }}
                          onClick={() => {
                            if (onSelectEvaluation) onSelectEvaluation(row.evaluation_id);
                            if (onNavigate) onNavigate("results");
                          }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
