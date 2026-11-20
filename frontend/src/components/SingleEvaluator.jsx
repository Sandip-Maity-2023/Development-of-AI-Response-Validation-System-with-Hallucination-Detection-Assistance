import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Trash2, 
  Database, 
  Upload, 
  CheckCircle, 
  Cpu, 
  FileCheck, 
  Sliders, 
  Layers,
  ArrowRight,
  Loader2
} from "lucide-react";
import { evaluateSingle, uploadDocument, getDocuments } from "../services/api";

export default function SingleEvaluator({ onEvaluationComplete }) {
  const [form, setForm] = useState({
    question: "",
    response: "",
    reference_answer: "",
    document_id: "DOC-ENT-RAG-001",
    model: "Gemini-1.5-Pro (Judge Multi-Agent)",
    strictness: "Standard Enterprise (Balanced)",
    retrieval_window: 4
  });

  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [stepMsg, setStepMsg] = useState("");
  const [error, setError] = useState("");

  const presets = [
    {
      label: "RAG Architecture & Enterprise Benefits (Grounded Pass)",
      question: "Explain the architecture of Retrieval-Augmented Generation (RAG) and its key benefits for enterprise AI systems.",
      response: "Retrieval-Augmented Generation (RAG) optimizes LLM outputs by referencing authoritative knowledge bases outside of its original training data sources before generating a response. It embeds queries into dense vectors, retrieves the top relevant chunks using cosine similarity from vector stores like ChromaDB or FAISS, and augments the LLM prompt with grounded context. Key enterprise benefits include hallucination reduction, domain-specific factual grounding, data privacy compliance, and eliminating costly base model fine-tuning.",
      reference_answer: "RAG architecture combines vector retrieval with LLM generation to ground responses in external documents, reducing hallucinations and improving factual accuracy."
    },
    {
      label: "Pediatric Clinical Dosage (Hazardous Hallucination Fail)",
      question: "What is the recommended pediatric dosage of oral amoxicillin for acute otitis media?",
      response: "The standard recommended dosage of oral amoxicillin for acute otitis media is 10 mg/kg/day divided into single monthly doses.",
      reference_answer: "High-dose amoxicillin (80-90 mg/kg/day divided in 2 doses) is the first-line treatment for acute otitis media in pediatric patients."
    },
    {
      label: "pgvector vs FAISS Vector Storage (Needs Improvement)",
      question: "Compare PostgreSQL pgvector with FAISS for semantic vector storage in enterprise applications.",
      response: "PostgreSQL pgvector is an open-source extension that allows storing and querying vector embeddings directly alongside relational business data, supporting ACID transactions and standard SQL joins. FAISS is a library developed by Meta optimized for high-throughput, in-memory nearest neighbor searches on large billion-scale datasets, but lacks built-in relational persistence.",
      reference_answer: "pgvector adds vector capability to relational Postgres with ACID guarantees, while FAISS provides blazing fast in-memory indexing for massive embedding collections."
    }
  ];

  useEffect(() => {
    getDocuments().then(res => {
      if (res?.documents?.length > 0) {
        setDocuments(res.documents);
      }
    }).catch(() => {});
  }, []);

  const handlePresetSelect = (preset) => {
    setForm(prev => ({
      ...prev,
      question: preset.question,
      response: preset.response,
      reference_answer: preset.reference_answer
    }));
  };

  const handleClear = () => {
    setForm({
      question: "",
      response: "",
      reference_answer: "",
      document_id: "DOC-ENT-RAG-001",
      model: "Gemini-1.5-Pro (Judge Multi-Agent)",
      strictness: "Standard Enterprise (Balanced)",
      retrieval_window: 4
    });
    setFile(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      let docId = form.document_id;
      if (file) {
        setStepMsg("Uploading and chunking document into ChromaDB (all-MiniLM-L6-v2)...");
        const uploadRes = await uploadDocument(file, "Uploaded Evidence");
        docId = uploadRes.document_id;
      }

      setStepMsg("Querying ChromaDB vector index and retrieving grounding passages...");
      await new Promise(r => setTimeout(r, 400));

      setStepMsg("Dispatching parallel judges (Relevance, Accuracy, Completeness)...");
      await new Promise(r => setTimeout(r, 400));

      setStepMsg("Running fine-tuned DistilBERT hallucination classifier & verdict aggregator...");
      const result = await evaluateSingle({
        ...form,
        document_id: docId
      });

      setStepMsg("Evaluation finalized!");
      if (onEvaluationComplete) {
        onEvaluationComplete(result);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Evaluation failed");
    } finally {
      setBusy(false);
      setStepMsg("");
    }
  };

  return (
    <div className="page-container">
      {/* Title & Preset Controls */}
      <div className="page-title-banner">
        <div>
          <h1>Evaluate Response</h1>
          <p>Validate AI-generated answers using evidence-based evaluation and specialized AI judges.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select 
            className="form-select" 
            style={{ width: "240px" }}
            onChange={(e) => {
              const idx = parseInt(e.target.value);
              if (!isNaN(idx)) handlePresetSelect(presets[idx]);
            }}
            defaultValue=""
          >
            <option value="" disabled>Load Example Presets...</option>
            {presets.map((p, i) => (
              <option key={i} value={i}>{p.label}</option>
            ))}
          </select>

          <button 
            type="button" 
            className="topbar-bell-btn" 
            style={{ width: "auto", padding: "0 12px", gap: "6px", display: "flex", alignItems: "center" }}
            onClick={handleClear}
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="eval-form-grid">
          {/* Left Column: Core Inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Input 1: Question */}
            <div className="card">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div className="form-label-row">
                  <label className="form-label">Original Question / Prompt *</label>
                  <span className="char-counter">{form.question.length} characters</span>
                </div>
                <div className="form-hint" style={{ marginBottom: "8px" }}>
                  Enter the user query or task prompt that was provided to the AI model.
                </div>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: "85px" }}
                  placeholder="e.g., Explain the architecture of Retrieval-Augmented Generation (RAG) and its key benefits for enterprise AI systems."
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Input 2: Response */}
            <div className="card">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div className="form-label-row">
                  <label className="form-label">AI Response to Evaluate *</label>
                  <span className="char-counter">{form.response.length} characters</span>
                </div>
                <div className="form-hint" style={{ marginBottom: "8px" }}>
                  Paste the complete generated or candidate answer that requires factual verification and hallucination auditing.
                </div>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: "130px" }}
                  placeholder="Paste the candidate response here..."
                  value={form.response}
                  onChange={(e) => setForm({ ...form, response: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Input 3: Optional Reference */}
            <div className="card">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div className="form-label-row">
                  <label className="form-label">Optional Reference Answer</label>
                  <span style={{ fontSize: "11px", color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>Optional</span>
                </div>
                <div className="form-hint" style={{ marginBottom: "8px" }}>
                  Provide an ideal gold-standard answer for accuracy and completeness benchmark comparison.
                </div>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: "75px" }}
                  placeholder="Optional ground truth reference..."
                  value={form.reference_answer}
                  onChange={(e) => setForm({ ...form, reference_answer: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Grounding & Configuration */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Grounding Knowledge Base Card */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Database size={17} color="#2563eb" />
                  <strong style={{ fontSize: "14px" }}>Grounding Knowledge Base</strong>
                </div>
                <span className="badge-pill-ready" style={{ fontSize: "11px" }}>
                  ChromaDB Indexed
                </span>
              </div>
              <div className="form-hint" style={{ marginBottom: "12px" }}>
                Select the reference corpus used by the RAG Retriever to cross-examine claims.
              </div>

              <div className="form-group">
                <select 
                  className="form-select"
                  value={form.document_id || ""}
                  onChange={(e) => setForm({ ...form, document_id: e.target.value })}
                >
                  <option value="DOC-ENT-RAG-001">Enterprise_AI_Architecture_Guidelines_v3.pdf (142 chunks)</option>
                  {documents.filter(d => d.document_id !== "DOC-ENT-RAG-001").map(doc => (
                    <option key={doc.document_id} value={doc.document_id}>
                      {doc.name} ({doc.chunks} chunks)
                    </option>
                  ))}
                  <option value="">No Grounding Document (LLM Self-Consistency Only)</option>
                </select>
              </div>

              <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "12px", marginTop: "12px" }}>
                <label className="form-label" style={{ fontSize: "12px", marginBottom: "6px", display: "block" }}>
                  Or upload a specific document for this evaluation:
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md"
                    className="form-input"
                    style={{ fontSize: "12px", padding: "6px" }}
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </div>
                <div className="form-hint" style={{ fontSize: "11px", marginTop: "6px", color: "#64748b" }}>
                  Note: Unindexed files will be automatically parsed, chunked, and vectorized via Sentence Transformers (all-MiniLM-L6-v2).
                </div>
              </div>
            </div>

            {/* Evaluation Configuration & Judge Settings */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <Sliders size={17} color="#6d28d9" />
                <strong style={{ fontSize: "14px" }}>Judge Architecture & Settings</strong>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: "12px" }}>Multi-Agent Protocol</label>
                <select 
                  className="form-select"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                >
                  <option value="Gemini-1.5-Pro (Judge Multi-Agent)">Gemini-1.5-Pro (Recommended)</option>
                  <option value="Gemini-2.5-Flash (High Speed)">Gemini-2.5-Flash (High Speed)</option>
                  <option value="GPT-4o-Mini (Balanced)">GPT-4o-Mini (Balanced)</option>
                  <option value="DistilBERT Fine-Tuned (Local NLI)">DistilBERT Fine-Tuned (Local NLI)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: "12px" }}>Audit Strictness</label>
                <select 
                  className="form-select"
                  value={form.strictness}
                  onChange={(e) => setForm({ ...form, strictness: e.target.value })}
                >
                  <option value="Standard Enterprise (Balanced)">Standard Enterprise (Balanced)</option>
                  <option value="Strict Clinical/Legal (Zero Tolerance)">Strict Clinical/Legal (Zero Tolerance)</option>
                  <option value="Permissive General (Exploratory)">Permissive General (Exploratory)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: "12px" }}>Evidence Retrieval Window</label>
                <select 
                  className="form-select"
                  value={form.retrieval_window}
                  onChange={(e) => setForm({ ...form, retrieval_window: parseInt(e.target.value) })}
                >
                  <option value={4}>Top 4 Relevant Chunks (Optimal)</option>
                  <option value={2}>Top 2 Chunks (Focused)</option>
                  <option value={8}>Top 8 Chunks (Comprehensive)</option>
                </select>
                <div className="form-hint" style={{ fontSize: "11px", marginTop: "8px" }}>
                  Multi-agent workflow triggers 4 specialized judges + verdict aggregator.
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "12px", borderRadius: "8px", color: "#991b1b", fontSize: "13px" }}>
                {error}
              </div>
            )}

            {/* Submit Button & Progress Stepper */}
            <div className="card" style={{ background: "#f8fafc", border: "1px solid #cbd5e1" }}>
              <button 
                type="submit" 
                className="btn-primary-top" 
                disabled={busy}
                style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "14px" }}
              >
                {busy ? (
                  <>
                    <Loader2 size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                    <span>Running Evaluation Judges...</span>
                  </>
                ) : (
                  <>
                    <span>Run Evidence-Based Evaluation</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {busy && stepMsg && (
                <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#2563eb", fontWeight: "500" }}>
                  <div className="status-dot-pulse" />
                  <span>{stepMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
