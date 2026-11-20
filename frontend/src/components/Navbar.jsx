import { 
  ShieldCheck, 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  History, 
  Cpu, 
  Database, 
  BarChart3, 
  Layers, 
  Compass, 
  Settings, 
  BookOpen,
  Info
} from "lucide-react";

export default function Navbar({ activePage, setActivePage }) {
  const mainNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "evaluate", label: "Evaluate Response", icon: CheckSquare },
    { id: "results", label: "Evaluation Results", icon: FileText },
    { id: "history", label: "Evaluation History", icon: History },
    { id: "architecture", label: "Agent Architecture", icon: Cpu },
    { id: "knowledge", label: "Knowledge Base", icon: Database },
    { id: "analytics", label: "Analytics & Reports", icon: BarChart3 },
    { id: "batch", label: "Batch Evaluation", icon: Layers },
    { id: "research", label: "MultiAgent ResearchMind", icon: Compass },
  ];

  const secondaryNavItems = [
    { id: "settings", label: "Evaluation Settings", icon: Settings },
    { id: "docs", label: "System Documentation", icon: BookOpen },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-badge">
          <div className="brand-icon-shield">
            <ShieldCheck size={20} />
          </div>
          <span>AI Eval Sentinel</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {mainNavItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-link-btn ${activePage === id ? "active" : ""}`}
            onClick={() => setActivePage(id)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}

        <div className="nav-divider" />

        <div className="nav-section-title">System & Settings</div>
        {secondaryNavItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-link-btn ${activePage === id ? "active" : ""}`}
            onClick={() => setActivePage(id)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Footer Status & Profile */}
      <div className="sidebar-footer">
        <div className="status-indicator-pill" title="FastAPI service connected and responding on port 8000">
          <div className="status-dot-pulse" />
          <span>• FastAPI Connected</span>
          <Info size={13} style={{ marginLeft: "auto", opacity: 0.6 }} />
        </div>

        <div className="user-profile-badge">
          <div className="avatar-circle">T</div>
          <div>
            <div className="user-meta-name">test</div>
            <div className="user-meta-role">Technical Evaluator</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
