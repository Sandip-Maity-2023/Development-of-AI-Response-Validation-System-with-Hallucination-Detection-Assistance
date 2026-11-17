import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api" });

export const evaluateSingle = async (payload) => (await api.post("/evaluate", payload)).data;

export const uploadBatch = async (file) => {
  const form = new FormData();
  form.append("file", file);
  return (await api.post("/batch/upload", form)).data;
};

export const uploadDocument = async (file) => {
  const form = new FormData();
  form.append("file", file);
  return (await api.post("/documents/upload", form)).data;
};

export const getDashboard = async () => (await api.get("/dashboard/summary")).data;

export const getHistory = async () => (await api.get("/history")).data;

export const reportUrl = (id, format) =>
  `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/report/${id}/${format}`;

// ResearchMind API endpoints
export const getResearchModels = async () => (await api.get("/research/models")).data;

export const runResearch = async (payload) => (await api.post("/research/run", payload)).data;

export const validateResearchReport = async (payload) => (await api.post("/research/validate", payload)).data;
