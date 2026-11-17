import { ShieldCheck, LayoutDashboard, MessageSquare, FileSpreadsheet, Compass } from "lucide-react";

export default function Navbar({ page, setPage }) {
  const links = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["single", "Single Evaluation", MessageSquare],
    ["batch", "Batch Evaluation", FileSpreadsheet],
    ["research", "ResearchMind Agent", Compass]
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <ShieldCheck size={25} /> <span>ResponseIQ</span>
      </div>
      <nav>
        {links.map(([id, label, Icon]) => (
          <button
            key={id}
            className={page === id ? "nav-item active" : "nav-item"}
            onClick={() => setPage(id)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">AI Validation & ResearchMind</div>
    </aside>
  );
}
