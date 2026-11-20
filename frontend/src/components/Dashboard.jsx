import { useEffect, useState } from "react";
import { 
  FileCheck2, 
  TrendingUp, 
  ShieldAlert, 
  AlertCircle, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { getDashboard, getHistory } from "../services/api";

export default function Dashboard({ onNavigate, onSelectEvaluation }) {
  const [data, setData] = useState(null);
  const [recentEvals, setRecentEvals] = useState([]);
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  const loadData = async (range) => {
    try {
      setLoading(true);
      const [summary, history] = await Promise.all([
        getDashboard(range),
        getHistory({ limit: 5 })
      ]);
      setData(summary);
      setRecentEvals(history);
    } catch (e) {
      console.error("Dashboard load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(timeRange);
  }, [timeRange]);

  const timelineData = data?.timeline || [
    { date: "Oct 23", passed: 28, total: 42 },
    { date: "Oct 24", passed: 64, total: 92 },
    { date: "Oct 25", passed: 128, total: 180 },
    { date: "Oct 26", passed: 240, total: 330 },
    { date: "Oct 27", passed: 410, total: 560 },
    { date: "Oct 28", passed: 582, total: 840 },
  ];

  const verdictData = data?.verdict_distribution || [
    { name: "Pass", value: 582, color: "#10b981" },
    { name: "Needs Improvement", value: 164, color: "#f59e0b" },
    { name: "Fail", value: 94, color: "#ef4444" },
  ];

  const totalEvaluations = data?.total_evaluations || 840;
  const avgScore = data?.average_score || 69;
  const hallucinationRate = data?.hallucination_rate || 40.0;
  const requiringReview = data?.evaluations_requiring_review || 2;

  return (
    <div className="page-container">
      {/* Title & Date Filter Bar */}
      <div className="page-title-banner">
        <div>
          <h1>Evaluation Dashboard</h1>
          <p>Monitor quality, factual support, hallucination risk, and evaluation performance.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select 
            className="form-select" 
            style={{ width: "140px" }}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button className="btn-primary-top" onClick={() => onNavigate("evaluate")}>
            <Plus size={16} />
            <span>Evaluate Response</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics Row */}
      <div className="kpi-grid-4">
        {/* KPI 1 */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">TOTAL EVALUATIONS</span>
            <div className="kpi-icon-wrap kpi-icon-blue">
              <FileCheck2 size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value-big">{totalEvaluations.toLocaleString()}</span>
            <span className="kpi-trend-pill up">
              <ArrowUpRight size={14} /> +18.4%
            </span>
          </div>
          <div className="kpi-subtext">Prompts & answers audited</div>
          <span className="kpi-sample-badge">Sample</span>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">AVERAGE QUALITY SCORE</span>
            <div className="kpi-icon-wrap kpi-icon-blue">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value-big">{avgScore} <small style={{ fontSize: "16px", color: "#64748b" }}>/ 100</small></span>
            <span className="kpi-trend-pill up">
              <ArrowUpRight size={14} /> +4.2 pts
            </span>
          </div>
          <div className="kpi-subtext">Normalized 4-judge weighted composite</div>
          <span className="kpi-sample-badge">Sample</span>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">HALLUCINATION RISK RATE</span>
            <div className="kpi-icon-wrap kpi-icon-green">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value-big">{hallucinationRate}%</span>
            <span className="kpi-trend-pill down">
              <ArrowDownRight size={14} /> -2.1%
            </span>
          </div>
          <div className="kpi-subtext">Contradicted or ungrounded claims</div>
          <span className="kpi-sample-badge">Sample</span>
        </div>

        {/* KPI 4 */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">EVALUATIONS REQUIRING REVIEW</span>
            <div className="kpi-icon-wrap kpi-icon-amber">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value-big">{requiringReview}</span>
            <span className="kpi-trend-pill warn">
              +3 cases
            </span>
          </div>
          <div className="kpi-subtext">Flagged for human verification</div>
          <span className="kpi-sample-badge">Sample</span>
        </div>
      </div>

      {/* 2 Charts Grid */}
      <div className="charts-grid-2">
        {/* Left: Volume & Trend Chart */}
        <div className="card">
          <div className="chart-card-header">
            <div>
              <h2>Evaluation Volume & Trend</h2>
              <p>System load vs passing validation rates</p>
            </div>
            <div style={{ display: "flex", gap: "14px", fontSize: "12px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: 10, height: 10, background: "#10b981", borderRadius: "50%", display: "inline-block" }} />
                <span>Passed Gate</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: 10, height: 10, background: "#3b82f6", borderRadius: "50%", display: "inline-block" }} />
                <span>Total Evaluations</span>
              </div>
              <span className="kpi-sample-badge" style={{ position: "static" }}>Sample Data</span>
            </div>
          </div>

          <div style={{ height: "260px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="passedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: "#ffffff", borderColor: "#e2e8f0", borderRadius: 8, fontSize: 12 }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#totalGrad)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="passed" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#passedGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Verdict Distribution Donut Chart */}
        <div className="card">
          <div className="chart-card-header">
            <div>
              <h2>Verdict Distribution</h2>
              <p>Cumulative distribution of evaluation outcomes</p>
            </div>
            <span className="kpi-sample-badge" style={{ position: "static" }}>Sample</span>
          </div>

          <div style={{ height: "180px", width: "100%", position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verdictData}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {verdictData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: "#ffffff", borderColor: "#e2e8f0", borderRadius: 8, fontSize: 12 }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Legend */}
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
            {verdictData.map((item) => (
              <div key={item.name} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
                  {item.value}
                </div>
                <div style={{ fontSize: "11px", color: item.color, fontWeight: "600" }}>
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Evaluations Quick Inspection Table */}
      <div className="card">
        <div className="chart-card-header">
          <div>
            <h2>Recent Audited Responses</h2>
            <p>Latest multi-agent validation logs and verdicts</p>
          </div>
          <button 
            className="nav-link-btn" 
            style={{ width: "auto", padding: "6px 12px", fontSize: "12px" }}
            onClick={() => onNavigate("history")}
          >
            <span>View Full History</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="sentinel-table">
            <thead>
              <tr>
                <th>EVALUATION ID</th>
                <th>QUESTION PREVIEW</th>
                <th>SCORE</th>
                <th>VERDICT</th>
                <th>HALLUCINATION STATUS</th>
                <th>MODEL</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {recentEvals.map((ev) => {
                const isPass = (ev.verdict || "").toUpperCase() === "PASS";
                const isFail = (ev.verdict || "").toUpperCase() === "FAIL";
                return (
                  <tr key={ev.id}>
                    <td>
                      <span 
                        style={{ color: "#2563eb", fontWeight: "600", cursor: "pointer" }}
                        onClick={() => {
                          onSelectEvaluation(ev.id);
                          onNavigate("results");
                        }}
                      >
                        {ev.id}
                      </span>
                    </td>
                    <td style={{ maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.question}
                    </td>
                    <td>
                      <strong style={{ fontSize: "14px" }}>{ev.overall_score}</strong>
                      <span style={{ color: "#94a3b8", fontSize: "11px" }}> / 100</span>
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
                      <button 
                        style={{ background: "transparent", border: "none", color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "600" }}
                        onClick={() => {
                          onSelectEvaluation(ev.id);
                          onNavigate("results");
                        }}
                      >
                        Inspect <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
