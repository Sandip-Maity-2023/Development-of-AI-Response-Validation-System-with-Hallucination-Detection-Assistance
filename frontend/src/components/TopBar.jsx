import { Search, Plus, Bell, CheckCircle2, Shield } from "lucide-react";

export default function TopBar({ onEvaluateClick, searchQuery, setSearchQuery, onSearchSubmit }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <header className="topbar-header">
      {/* Search Bar */}
      <div className="topbar-search-box">
        <Search size={16} className="topbar-search-icon" />
        <input
          type="text"
          placeholder="Search evaluation ID, question keywords, or claims..."
          value={searchQuery || ""}
          onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Status Badges & Quick Action */}
      <div className="topbar-actions">
        <div className="badge-pill-ready" title="ChromaDB vector embedding index active (384-dim all-MiniLM-L6-v2)">
          <div className="status-dot-pulse" />
          <span>• ChromaDB: Ready</span>
        </div>

        <div className="badge-pill-purple" title="Relevance, Accuracy, Hallucination, Completeness, Verdict">
          <Shield size={13} />
          <span>Judges: 5 Active</span>
        </div>

        <button className="btn-primary-top" onClick={onEvaluateClick}>
          <Plus size={16} />
          <span>Evaluate Response</span>
        </button>

        <button className="topbar-bell-btn" title="Audit notifications">
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}
