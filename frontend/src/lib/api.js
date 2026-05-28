import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
});

export async function uploadInventoryFile(file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await axios.post(`${API}/upload`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return data;
}

export async function fetchReasoning(jobId, record) {
  const { data } = await api.post(`/reasoning`, { job_id: jobId, record });
  return data.reasoning;
}

export function downloadROSheetUrl(jobId) {
  return `${API}/download/${jobId}`;
}
