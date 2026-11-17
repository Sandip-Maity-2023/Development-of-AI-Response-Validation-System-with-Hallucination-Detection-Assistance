import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getDashboard, getHistory, reportUrl } from "../services/api";
import { FileText, Download, RotateCw } from "lucide-react";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    setError("");
    Promise.all([getDashboard(), getHistory()])
      .then(([s, h]) => {
        setSummary(s);
        setHistory(h || []);
      })
      .catch((e) => setError(e.response?.data?.detail || "Could not connect to backend."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const chart = summary
    ? [
        { name: "Pass", count: summary.pass_count || 0 },
        { name: "Needs Improvement", count: summary.needs_improvement_count || 0 },
        { name: "Fail", count: summary.fail_count || 0 },
      ]
    : [];

  const dimAvg = summary?.dimension_averages;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SYSTEM OVERVIEW</div>
          <h1>Evaluation Dashboard</h1>
          <p>Real-time analytics and quality audit tracking across your LLM evaluations.</p>
        </div>
        <button
          onClick={loadData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 16px",
            background: "white",
            border: "1px solid #dce2ec",
            borderRadius: "9px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
          }}
        >
          <RotateCw size={15} /> Refresh
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="metric-grid">
        <Metric label="Total Evaluations" value={summary?.total_evaluations ?? "—"} />
        <Metric label="Average Quality Score" value={summary?.average_score !== undefined ? `${summary.average_score}/100` : "—"} />
        <Metric label="Passed" value={summary?.pass_count ?? "—"} color="#167144" />
        <Metric label="Failed / Hallucinations" value={summary?.fail_count ?? "—"} color="#ad3030" />
      </div>

      {dimAvg && (
        <div className="metric-grid" style={{ marginTop: "12px" }}>
          <Metric label="Avg Relevance" value={`${dimAvg.relevance || 0}/100`} />
          <Metric label="Avg Accuracy" value={`${dimAvg.accuracy || 0}/100`} />
          <Metric label="Avg Hallucination Risk" value={`${dimAvg.hallucination || 0}%`} color={dimAvg.hallucination > 30 ? "#ad3030" : "#167144"} />
          <Metric label="Avg Completeness" value={`${dimAvg.completeness || 0}/100`} />
        </div>
      )}

      <section className="panel chart-panel">
        <h2>Verdict Distribution</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#465fe0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <h2>Recent Evaluation Runs</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time / ID</th>
                <th>Prompt / Question</th>
                <th>Score</th>
                <th>Verdict</th>
                <th>Reports</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#8a94a6", padding: "20px" }}>
                    No evaluations recorded yet. Run a single or batch evaluation to get started.
                  </td>
                </tr>
              ) : (
                history.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <strong>{x.id.slice(0, 8)}</strong>
                      {x.timestamp && <div style={{ fontSize: "11px", color: "#8a94a6" }}>{x.timestamp}</div>}
                    </td>
                    <td style={{ maxWidth: "340px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {x.question || "—"}
                    </td>
                    <td>
                      <b>{x.overall_score !== null && x.overall_score !== undefined ? `${x.overall_score}/100` : "Batch"}</b>
                    </td>
                    <td>
                      <span className={`verdict ${String(x.verdict || "unknown").toLowerCase().replaceAll(" ", "-")}`}>
                        {x.verdict || "Completed"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <a
                          href={reportUrl(x.id, "pdf")}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#3653d9", display: "inline-flex", alignItems: "center", gap: "3px", textDecoration: "none", fontSize: "12px", fontWeight: "600" }}
                          title="PDF Report"
                        >
                          <FileText size={14} /> PDF
                        </a>
                        <a
                          href={reportUrl(x.id, "json")}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#64748b", display: "inline-flex", alignItems: "center", gap: "3px", textDecoration: "none", fontSize: "12px", fontWeight: "600" }}
                          title="JSON Report"
                        >
                          <Download size={14} /> JSON
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <b style={color ? { color } : {}}>{value}</b>
    </div>
  );
}
