import { useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import SingleEvaluator from "./components/SingleEvaluator";
import BatchEvaluator from "./components/BatchEvaluator";
import ResearchMind from "./components/ResearchMind";

export default function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="app-shell">
      <Navbar page={page} setPage={setPage} />
      <main className="main-content">
        {page === "dashboard" && <Dashboard />}
        {page === "single" && <SingleEvaluator />}
        {page === "batch" && <BatchEvaluator />}
        {page === "research" && <ResearchMind />}
      </main>
    </div>
  );
}
