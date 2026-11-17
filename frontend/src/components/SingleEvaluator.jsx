import { useState } from "react";
import { evaluateSingle, uploadDocument } from "../services/api";
import ResultCard from "./ResultCard";

export default function SingleEvaluator() {
  const [form, setForm] = useState({ question: "", response: "", reference_answer: "", document_id: null });
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault(); setBusy(true); setError(""); setResult(null);
    try {
      let document_id = form.document_id;
      if (file) document_id = (await uploadDocument(file)).document_id;
      const data = await evaluateSingle({ ...form, document_id });
      setResult(data);
    } catch (err) { setError(err.response?.data?.detail || err.message); }
    finally { setBusy(false); }
  };

  return <div className="page">
    <div className="page-heading"><div><div className="eyebrow">EVALUATION WORKSPACE</div><h1>Single response evaluation</h1>
      <p>Evaluate one AI-generated answer against a question and optional evidence.</p></div></div>
    <form className="panel form" onSubmit={submit}>
      <label>Question<textarea name="question" value={form.question} onChange={change} required placeholder="Enter the original question..."/></label>
      <label>AI-generated response<textarea name="response" value={form.response} onChange={change} required placeholder="Paste the AI response to evaluate..."/></label>
      <label>Reference answer (optional)<textarea name="reference_answer" value={form.reference_answer} onChange={change} placeholder="Provide a trusted reference answer..."/></label>
      <label>Reference document (PDF or TXT)<input type="file" accept=".pdf,.txt" onChange={e => setFile(e.target.files[0])}/></label>
      {error && <div className="error">{error}</div>}
      <button className="primary" disabled={busy}>{busy ? "Evaluating agents..." : "Run evaluation"}</button>
    </form>
    <ResultCard result={result}/>
  </div>;
}
