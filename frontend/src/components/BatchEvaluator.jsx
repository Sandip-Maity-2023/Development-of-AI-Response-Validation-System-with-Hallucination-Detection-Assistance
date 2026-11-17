import { useState } from "react";
import { uploadBatch } from "../services/api";
import { FileSpreadsheet, Download, CheckCircle, AlertCircle } from "lucide-react";

export default function BatchEvaluator() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(
      "question,response,reference_answer\n" +
      "\"What is the capital of France?\",\"Paris is the capital of France.\",\"Paris is the capital and largest city of France.\"\n" +
      "\"Explain photosynthesis in plants.\",\"Plants use sunlight, water, and CO2 to create oxygen and energy in the form of sugar.\",\"Photosynthesis converts light energy into chemical energy.\"\n" +
      "\"Who invented the telephone?\",\"Thomas Edison invented the telephone in 1890.\",\"Alexander Graham Bell patented the telephone in 1876.\"\n"
    );
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "sample_evaluations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setData(null);
    try {
      setData(await uploadBatch(file));
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">BULK EVALUATION PIPELINE</div>
          <h1>Batch CSV Evaluation</h1>
          <p>Upload a benchmark dataset or batch file to evaluate hundreds of responses concurrently.</p>
        </div>
        <button
          onClick={downloadSampleTemplate}
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "9px 15px",
            background: "white",
            border: "1px solid #dce2ec",
            borderRadius: "9px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
            color: "#3b5bdb"
          }}
        >
          <Download size={15} /> Download Sample CSV
        </button>
      </div>

      <form className="panel form" onSubmit={submit}>
        <label>
          Choose CSV File
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
        </label>
        <p className="hint">
          Required column headers: <code>question</code>, <code>response</code>. Optional: <code>reference_answer</code>.
        </p>
        {error && <div className="error">{error}</div>}
        <button className="primary" disabled={busy}>
          {busy ? "Evaluating Batch..." : "Upload & Run Batch Evaluation"}
        </button>
      </form>

      {data && (
        <section className="panel">
          <h2>Batch Results Summary</h2>
          <div className="metric-grid">
            <Metric label="Total Evaluations" value={data.total} />
            <Metric label="Average Quality Score" value={`${data.average_score}/100`} />
            <Metric label="Passed" value={data.pass_count} color="#167144" />
            <Metric label="Failed" value={data.fail_count} color="#ad3030" />
          </div>

          <div className="table-wrap" style={{ marginTop: "18px" }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question Prompt</th>
                  <th>AI Response</th>
                  <th>Score</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ maxWidth: "260px" }}>{r.question}</td>
                    <td style={{ maxWidth: "340px", color: "#64748b" }}>{r.response}</td>
                    <td>
                      <b>{r.overall_score}/100</b>
                    </td>
                    <td>
                      <span className={`verdict ${String(r.verdict).toLowerCase().replaceAll(" ", "-")}`}>
                        {r.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
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
