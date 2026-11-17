import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Download, FileText, Cpu } from "lucide-react";
import { reportUrl } from "../services/api";

function Agent({ title, data, risk = false }) {
  const [open, setOpen] = useState(true);
  const score = risk ? data?.risk_score : data?.score;
  const ml = data?.ml_prediction;

  return (
    <div className="agent-card">
      <button className="agent-head" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <strong>
          {score !== undefined && score !== null ? `${score}/100` : "—"}
        </strong>
        {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>
      {open && (
        <div className="agent-body">
          <p>{data?.reasoning || "No reasoning supplied."}</p>

          {/* Local fine-tuned model prediction badge */}
          {risk && ml && ml.label && (
            <div style={{ marginTop: "10px", padding: "10px 12px", background: "#f0f4ff", borderRadius: "8px", border: "1px solid #d4e0fc", fontSize: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
              <Cpu size={16} color="#3b5bdb" />
              <div>
                <strong>Fine-Tuned Model: </strong>
                <span style={{ color: ml.predicted_class === 0 ? "#2b8a3e" : "#c92a2a", fontWeight: "700" }}>
                  {ml.label}
                </span>
                {" "}(Confidence: {Math.round((ml.confidence || 0) * 100)}%)
              </div>
            </div>
          )}

          {data?.flagged_claims?.map((c, i) => (
            <div className="flag" key={i}>
              <AlertTriangle size={16} />
              <div>
                <b>{c.claim}</b>
                <p>{c.explanation}</p>
                {c.evidence && <small>Evidence: {c.evidence}</small>}
              </div>
            </div>
          ))}

          {data?.supported_points?.map((p, i) => (
            <p key={i} style={{ color: "#2b8a3e", display: "flex", gap: "6px", alignItems: "center" }}>
              <CheckCircle2 size={14} /> {p}
            </p>
          ))}

          {data?.missing_points?.map((p, i) => (
            <p key={i} style={{ color: "#c92a2a" }}>
              • Missing: {p}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultCard({ result }) {
  if (!result) return null;
  const agents = result.agents || {};
  const verdict = agents.verdict || {};
  const evalId = result.evaluation_id;

  return (
    <section className="panel result">
      <div className="result-top">
        <div>
          <div className="eyebrow">OVERALL EVALUATION SCORE</div>
          <div className="score">
            {result.overall_score}
            <small>/100</small>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span className={`verdict ${String(result.verdict).toLowerCase().replaceAll(" ", "-")}`}>
            {result.verdict}
          </span>
          {evalId && (
            <div style={{ display: "flex", gap: "8px" }}>
              <a
                href={reportUrl(evalId, "pdf")}
                target="_blank"
                rel="noreferrer"
                className="btn-export"
                title="Download PDF Evaluation Report"
                style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", background: "#e8effd", color: "#3653d9", borderRadius: "8px", textDecoration: "none", fontSize: "12px", fontWeight: "600" }}
              >
                <FileText size={15} /> PDF
              </a>
              <a
                href={reportUrl(evalId, "json")}
                target="_blank"
                rel="noreferrer"
                className="btn-export"
                title="Download JSON Report"
                style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", background: "#f1f3f7", color: "#475569", borderRadius: "8px", textDecoration: "none", fontSize: "12px", fontWeight: "600" }}
              >
                <Download size={15} /> JSON
              </a>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #edf2f7" }}>
        <strong>Verdict Summary: </strong>
        <span style={{ color: "#475569" }}>{verdict.reasoning || "Evaluation completed."}</span>
      </div>

      <div className="agent-grid">
        <Agent title="Relevance Judge" data={agents.relevance} />
        <Agent title="Accuracy Judge" data={agents.accuracy} />
        <Agent title="Hallucination Detection" data={agents.hallucination} risk />
        <Agent title="Completeness Judge" data={agents.completeness} />
      </div>

      {result.evidence && result.evidence.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <h3>Retrieved Reference Context ({result.evidence.length} chunks)</h3>
          <div style={{ maxHeight: "120px", overflowY: "auto", fontSize: "12px", background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            {result.evidence.map((chunk, idx) => (
              <p key={idx} style={{ margin: "4px 0", color: "#475569" }}>
                <b>[{idx + 1}]</b> {chunk}
              </p>
            ))}
          </div>
        </div>
      )}

      {verdict.recommendations?.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <h3>Actionable Recommendations</h3>
          {verdict.recommendations.map((x, i) => (
            <p key={i} style={{ display: "flex", gap: "6px", alignItems: "center", margin: "4px 0" }}>
              <CheckCircle2 size={14} color="#3b5bdb" /> {x}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
