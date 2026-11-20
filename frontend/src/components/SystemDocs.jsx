import { BookOpen, CheckCircle, Code, Cpu, Database, Shield } from "lucide-react";

export default function SystemDocs() {
  return (
    <div className="page-container">
      <div className="page-title-banner">
        <div>
          <h1>System Documentation & Technical Specifications</h1>
          <p>Architectural guide, mathematical formulas, and integration references for AI Eval Sentinel.</p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px", color: "#0f172a" }}>
          1. Multi-Agent Evaluation Mathematical Formulation
        </h2>
        <p style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.7", marginBottom: "14px" }}>
          The composite response quality score \(Q\) is calculated as a normalized linear combination of four orthogonal evaluation dimensions:
        </p>

        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "8px", fontFamily: "monospace", fontSize: "13px", color: "#0f172a", marginBottom: "16px" }}>
          Q = w_rel · S_rel + w_acc · S_acc + w_hal · (100 - R_hal) + w_comp · S_comp<br /><br />
          Where:<br />
          • w_rel = 0.20 (Relevance Weight)<br />
          • w_acc = 0.30 (Factual Accuracy Weight)<br />
          • w_hal = 0.25 (Hallucination Safety Weight, where R_hal is risk %)<br />
          • w_comp = 0.25 (Completeness Weight)<br />
          • Automatic Safety Veto: If R_hal ≥ 75.0% or S_acc &lt; 30.0%, Verdict = FAIL regardless of Q.
        </div>

        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px", color: "#0f172a" }}>
          2. Fine-Tuned DistilBERT Hallucination Classifier
        </h2>
        <p style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.7", marginBottom: "14px" }}>
          The hallucination detection agent couples a fine-tuned sequence classification model (DistilBERT NLI) with LLM claim extraction. Sentences in the candidate response are decomposed into atomic claims and cross-referenced with retrieved evidence passages:
        </p>
        <ul style={{ paddingLeft: "24px", fontSize: "13px", color: "#475569", lineHeight: "1.8", marginBottom: "16px" }}>
          <li><strong>Supported:</strong> The claim is entailed by verified passages in the knowledge base.</li>
          <li><strong>Contradicted:</strong> The claim directly contradicts facts in the reference corpus.</li>
          <li><strong>Ungrounded:</strong> The claim introduces entities or assertions not verifiable in the corpus.</li>
        </ul>

        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px", color: "#0f172a" }}>
          3. Vector Store & RAG Retrieval
        </h2>
        <p style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.7" }}>
          Reference documents are parsed (PDF, TXT, MD) and chunked with 800-character windows and 150-character overlaps. Vectors are indexed using ChromaDB with the <code>all-MiniLM-L6-v2</code> embedding model (384 dimensions) using Cosine distance space.
        </p>
      </div>
    </div>
  );
}
