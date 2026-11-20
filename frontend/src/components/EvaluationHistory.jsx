import { useState, useEffect } from "react";
import { 
  Download, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  FileSpreadsheet
} from "lucide-react";
import { getEvaluations, exportHistoryCsvUrl, reportUrl } from "../services/api";

export default function EvaluationHistory({ onSelectEvaluation, onNavigate }) {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verdict, setVerdict] = useState("ALL");
  const [scoreTier, setScoreTier] = useState("ALL");
  const [hallucinationStatus, setHallucinationStatus] = useState("ALL");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getEvaluations({
        search,
        verdict,
        score_tier: scoreTier,
        hallucination_status: hallucinationStatus,
        limit: 100
      });
      setEvaluations(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search, verdict, scoreTier, hallucinationStatus]);

  const totalAudited = evaluations.length;
  const passedCount = evaluations.filter(e => (e.verdict || "").toUpperCase() === "PASS").length;
  const needsImpCount = evaluations.filter(e => (e.verdict || "").toUpperCase().includes("IMPROVE")).length;
  const failedCount = evaluations.filter(e => (e.verdict || "").toUpperCase() === "FAIL").length;

  return (
    <div className="page-container">
      {/* Page Title & CSV Export */}
      <div className="page-title-banner">
        <div>
          <h1>Evaluation History</h1>
          <p>Inspect previous evaluations, compare outcomes, and investigate flagged responses.</p>
        </div>

        <a 
          href={exportHistoryCsvUrl()} 
          target="_blank" 
          rel="noreferrer" 
          className="topbar-bell-btn"
          style={{ width: "auto", padding: "0 14px", gap: "8px", textDecoration: "none", color: "#1e293b", fontWeight: "600" }}
        >
          <FileSpreadsheet size={15} color="#059669" />
          <span>Export CSV</span>
        </a>
      </div>

      {/* 4 Summary Cards */}
      <div className="kpi-grid-4">
        {/* Card 1: Audited */}
        <div className="kpi-card">
          <span className="kpi-label">AUDITED</span>
          <div className="kpi-value-row">
            <span className="kpi-value-big">{totalAudited}</span>
          </div>
          <div className="kpi-subtext">Total tracked evaluations</div>
        </div>

        {/* Card 2: Passed */}
        <div className="kpi-card" style={{ borderLeft: "3px solid #10b981" }}>
          <span className="kpi-label" style={{ color: "#166534" }}>PASSED</span>
          <div className="kpi-value-row">
            <span className="kpi-value-big" style={{ color: "#166534" }}>{passedCount}</span>
          </div>
          <div className="kpi-subtext">Score ≥ 80% with no veto</div>
        </div>

        {/* Card 3: Needs Improvement */}
        <div className="kpi-card" style={{ borderLeft: "3px solid #f59e0b" }}>
          <span className="kpi-label" style={{ color: "#92400e" }}>NEEDS IMPROVEMENT</span>
          <div className="kpi-value-row">
            <span className="kpi-value-big" style={{ color: "#92400e" }}>{needsImpCount}</span>
          </div>
          <div className="kpi-subtext">60% – 79% score range</div>
        </div>

        {/* Card 4: Failed */}
        <div className="kpi-card" style={{ borderLeft: "3px solid #ef4444" }}>
          <span className="kpi-label" style={{ color: "#991b1b" }}>FAILED GATES</span>
          <div className="kpi-value-row">
            <span className="kpi-value-big" style={{ color: "#991b1b" }}>{failedCount}</span>
          </div>
          <div className="kpi-subtext">Score &lt; 60% or contradiction</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px", alignItems: "center" }}>
          {/* Search Input */}
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "11px", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search by ID, prompt keywords..."
              className="form-input"
              style={{ paddingLeft: "34px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Verdict Filter */}
          <select 
            className="form-select"
            value={verdict}
            onChange={(e) => setVerdict(e.target.value)}
          >
            <option value="ALL">All Verdicts</option>
            <option value="PASS">Pass</option>
            <option value="NEEDS IMPROVEMENT">Needs Improvement</option>
            <option value="FAIL">Fail</option>
          </select>

          {/* Score Tier Filter */}
          <select 
            className="form-select"
            value={scoreTier}
            onChange={(e) => setScoreTier(e.target.value)}
          >
            <option value="ALL">All Score Tiers</option>
            <option value="HIGH">High (≥ 80%)</option>
            <option value="MEDIUM">Medium (60% – 79%)</option>
            <option value="LOW">Low (&lt; 60%)</option>
          </select>

          {/* Hallucination Status Filter */}
          <select 
            className="form-select"
            value={hallucinationStatus}
            onChange={(e) => setHallucinationStatus(e.target.value)}
          >
            <option value="ALL">All Hallucination Statuses</option>
            <option value="SUBSTANTIATED">Substantiated</option>
            <option value="CONTRADICTED">Contradicted</option>
            <option value="FLAGGED">Flagged for Review</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-responsive">
          <table className="sentinel-table">
            <thead>
              <tr>
                <th>EVALUATION ID</th>
                <th>QUESTION PREVIEW</th>
                <th>SCORE</th>
                <th>VERDICT</th>
                <th>HALLUCINATION STATUS</th>
                <th>EVALUATOR MODEL</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No evaluations match the current filter criteria.
                  </td>
                </tr>
              ) : (
                evaluations.map((ev) => {
                  const isPass = (ev.verdict || "").toUpperCase() === "PASS";
                  const isFail = (ev.verdict || "").toUpperCase() === "FAIL";
                  return (
                    <tr key={ev.id}>
                      <td>
                        <strong 
                          style={{ color: "#2563eb", cursor: "pointer" }}
                          onClick={() => {
                            onSelectEvaluation(ev.id);
                            onNavigate("results");
                          }}
                        >
                          {ev.id}
                        </strong>
                      </td>
                      <td style={{ maxWidth: "320px" }}>
                        <div style={{ fontWeight: "500", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ev.question}
                        </div>
                        {ev.response && (
                          <div style={{ fontSize: "11.5px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
                            {ev.response}
                          </div>
                        )}
                      </td>
                      <td>
                        <strong style={{ fontSize: "14px", color: isPass ? "#16a34a" : isFail ? "#dc2626" : "#d97706" }}>
                          {ev.overall_score}
                        </strong>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}> / 100</span>
                      </td>
                      <td>
                        <span className={isPass ? "verdict-banner-pass" : isFail ? "verdict-banner-fail" : "verdict-banner-warn"}>
                          {isPass ? "✓ Pass" : isFail ? "✕ Fail" : "⚠ Needs Improvement"}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          color: ev.hallucination_status === "Substantiated" ? "#16a34a" : "#dc2626",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          {ev.hallucination_status === "Substantiated" ? "✓ Substantiated" : "✕ Contradicted"}
                        </span>
                      </td>
                      <td>{ev.evaluator_model || "Gemini-1.5-Pro"}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button 
                            className="nav-link-btn" 
                            style={{ width: "auto", padding: "4px 8px", fontSize: "11.5px", background: "#eff6ff", color: "#2563eb", fontWeight: "600" }}
                            onClick={() => {
                              onSelectEvaluation(ev.id);
                              onNavigate("results");
                            }}
                          >
                            Inspect
                          </button>
                          <a 
                            href={reportUrl(ev.id, "pdf")} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ color: "#64748b" }}
                            title="Download PDF Report"
                          >
                            <Download size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
