import { useState } from "react";
import Navbar from "./components/Navbar";
import TopBar from "./components/TopBar";
import Dashboard from "./components/Dashboard";
import SingleEvaluator from "./components/SingleEvaluator";
import EvaluationResults from "./components/EvaluationResults";
import EvaluationHistory from "./components/EvaluationHistory";
import AgentArchitecture from "./components/AgentArchitecture";
import KnowledgeBase from "./components/KnowledgeBase";
import AnalyticsReports from "./components/AnalyticsReports";
import BatchEvaluator from "./components/BatchEvaluator";
import ResearchMind from "./components/ResearchMind";
import EvaluationSettings from "./components/EvaluationSettings";
import SystemDocs from "./components/SystemDocs";

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedEvaluationId, setSelectedEvaluationId] = useState(null);
  const [latestResult, setLatestResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEvaluationComplete = (result) => {
    setLatestResult(result);
    setSelectedEvaluationId(result.evaluation_id);
    setActivePage("results");
  };

  const handleSelectEvaluation = (evalId) => {
    setSelectedEvaluationId(evalId);
    setLatestResult(null); // Fetch fresh from API
    setActivePage("results");
  };

  const handleSearchSubmit = (query) => {
    if (query?.trim()) {
      setActivePage("history");
    }
  };

  return (
    <div className="app-layout">
      {/* Left Sidebar Navigation */}
      <Navbar 
        activePage={activePage} 
        setActivePage={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }} 
      />

      {/* Main Panel */}
      <div className="app-main">
        <TopBar 
          onEvaluateClick={() => setActivePage("evaluate")}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
        />

        <main>
          {activePage === "dashboard" && (
            <Dashboard 
              onNavigate={setActivePage} 
              onSelectEvaluation={handleSelectEvaluation} 
            />
          )}

          {activePage === "evaluate" && (
            <SingleEvaluator 
              onEvaluationComplete={handleEvaluationComplete} 
            />
          )}

          {activePage === "results" && (
            <EvaluationResults 
              evaluationId={selectedEvaluationId} 
              currentResult={latestResult} 
              onRunNew={() => setActivePage("evaluate")} 
            />
          )}

          {activePage === "history" && (
            <EvaluationHistory 
              onSelectEvaluation={handleSelectEvaluation} 
              onNavigate={setActivePage} 
            />
          )}

          {activePage === "architecture" && (
            <AgentArchitecture />
          )}

          {activePage === "knowledge" && (
            <KnowledgeBase />
          )}

          {activePage === "analytics" && (
            <AnalyticsReports />
          )}

          {activePage === "batch" && (
            <BatchEvaluator 
              onSelectEvaluation={handleSelectEvaluation} 
              onNavigate={setActivePage} 
            />
          )}

          {activePage === "research" && (
            <ResearchMind 
              onValidateWithJudges={(result) => {
                handleEvaluationComplete(result);
              }}
            />
          )}

          {activePage === "settings" && (
            <EvaluationSettings />
          )}

          {activePage === "docs" && (
            <SystemDocs />
          )}
        </main>
      </div>
    </div>
  );
}
