import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const api = axios.create({ baseURL: API_BASE });

export const getHealth = async () => (await api.get("/health")).data;

export const evaluateSingle = async (payload) => (await api.post("/evaluate", payload)).data;

export const getEvaluation = async (id) => (await api.get(`/evaluation/${id}`)).data;

export const getLatestEvaluation = async () => (await api.get("/evaluations/latest")).data;

export const getEvaluations = async (params = {}) => (await api.get("/evaluations", { params })).data;

export const getDocuments = async () => (await api.get("/documents")).data;

export const uploadDocument = async (file, category = "Architecture & Standards") => {
  const form = new FormData();
  form.append("file", file);
  form.append("category", category);
  return (await api.post("/documents/upload", form)).data;
};

export const deleteDocument = async (docId) => (await api.delete(`/documents/${docId}`)).data;

export const queryVectorStore = async (payload) => (await api.post("/documents/query", payload)).data;

export const uploadBatch = async (file, batchName = "Enterprise QA Evaluation Set A", judgeArchitecture = "Gemini-1.5-Pro (Judge Multi-Agent)") => {
  const form = new FormData();
  form.append("file", file);
  form.append("batch_name", batchName);
  form.append("judge_architecture", judgeArchitecture);
  return (await api.post("/batch/upload", form)).data;
};

export const getDashboard = async (range = "7d") => (await api.get(`/dashboard/summary?range=${range}`)).data;

export const getHistory = async (params = {}) => (await api.get("/history", { params })).data;

export const exportHistoryCsvUrl = () => `${API_BASE}/evaluations/export/csv`;

export const reportUrl = (id, format) => `${API_BASE}/report/${id}/${format}`;

// ResearchMind API endpoints
export const getResearchModels = async () => (await api.get("/research/models")).data;

export const runResearch = async (payload) => (await api.post("/research/run", payload)).data;

export const validateResearchReport = async (payload) => (await api.post("/research/validate", payload)).data;
