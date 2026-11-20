import { useState } from "react";
import { Sliders, Database, Key, Shield, Check, Save } from "lucide-react";

export default function EvaluationSettings() {
  const [weights, setWeights] = useState({
    relevance: 20,
    accuracy: 30,
    hallucination: 25,
    completeness: 25
  });

  const [thresholds, setThresholds] = useState({
    passScore: 80,
    needsImpScore: 60,
    maxHallucinationRisk: 50
  });

  const [dbType, setDbType] = useState("sqlite");
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-container">
      <div className="page-title-banner">
        <div>
          <h1>Evaluation Settings & System Configuration</h1>
          <p>Customize judge scoring weights, safety veto thresholds, and backend storage providers.</p>
        </div>

        <button className="btn-primary-top" onClick={handleSave}>
          {saved ? <Check size={16} /> : <Save size={16} />}
          <span>{saved ? "Settings Saved" : "Save Changes"}</span>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Card 1: Weights */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Sliders size={18} color="#2563eb" />
            <h2 style={{ fontSize: "15px", fontWeight: "700" }}>Judge Weights (% Total: 100%)</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Relevance Weight: {weights.relevance}%</label>
            <input 
              type="range" 
              min="10" 
              max="50" 
              value={weights.relevance}
              onChange={(e) => setWeights({ ...weights, relevance: parseInt(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Accuracy Weight: {weights.accuracy}%</label>
            <input 
              type="range" 
              min="10" 
              max="50" 
              value={weights.accuracy}
              onChange={(e) => setWeights({ ...weights, accuracy: parseInt(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hallucination Safety Weight: {weights.hallucination}%</label>
            <input 
              type="range" 
              min="10" 
              max="50" 
              value={weights.hallucination}
              onChange={(e) => setWeights({ ...weights, hallucination: parseInt(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Completeness Weight: {weights.completeness}%</label>
            <input 
              type="range" 
              min="10" 
              max="50" 
              value={weights.completeness}
              onChange={(e) => setWeights({ ...weights, completeness: parseInt(e.target.value) })}
            />
          </div>
        </div>

        {/* Card 2: Thresholds & DB */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Shield size={18} color="#059669" />
            <h2 style={{ fontSize: "15px", fontWeight: "700" }}>Gating Thresholds & Storage</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Minimum Pass Quality Score</label>
            <input 
              type="number" 
              className="form-input" 
              value={thresholds.passScore}
              onChange={(e) => setThresholds({ ...thresholds, passScore: parseInt(e.target.value) })}
            />
            <div className="form-hint">Scores above this threshold receive a green PASS outcome.</div>
          </div>

          <div className="form-group">
            <label className="form-label">Automatic Hallucination Veto Limit (%)</label>
            <input 
              type="number" 
              className="form-input" 
              value={thresholds.maxHallucinationRisk}
              onChange={(e) => setThresholds({ ...thresholds, maxHallucinationRisk: parseInt(e.target.value) })}
            />
            <div className="form-hint">Responses with hallucination risk above this limit trigger an automatic FAIL.</div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Database Backend</label>
            <select 
              className="form-select"
              value={dbType}
              onChange={(e) => setDbType(e.target.value)}
            >
              <option value="sqlite">SQLite (Default Local - evaluator.db)</option>
              <option value="mysql">MySQL / MariaDB (pymysql)</option>
              <option value="mongodb">MongoDB (pymongo)</option>
            </select>
            <div className="form-hint">
              Automatic schema migration and UUID keys supported across all providers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
