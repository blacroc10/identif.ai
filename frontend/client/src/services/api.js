import axios from 'axios';

// Dynamically resolve the API base URL
// Priority: env variable → same host as frontend (works on any machine)
const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    const normalized = process.env.REACT_APP_API_URL.replace(/\/$/, '');
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5001/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

// ── Cases ────────────────────────────────────────────────
export const casesAPI = {
  getAll: (params) => api.get('/cases', { params }),
  getById: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  update: (id, data) => api.patch(`/cases/${id}`, data),
  delete: (id) => api.delete(`/cases/${id}`),
};

// ── Narrations ───────────────────────────────────────────
export const narrationsAPI = {
  getAll: (params) => api.get('/narrations', { params }),
  getById: (id) => api.get(`/narrations/${id}`),
  uploadAudio: (formData) => api.post('/narrations/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  submitText: (data) => api.post('/narrations/text', data),
  process: (id, data) => api.patch(`/narrations/${id}/process`, data),
};

// ── Sketches ─────────────────────────────────────────────
export const sketchesAPI = {
  getAll: (params) => api.get('/sketches', { params }),
  upload: (formData) => api.post('/sketches/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  approve: (id) => api.patch(`/sketches/${id}/approve`),
  refine: (id, data) => api.post(`/sketches/${id}/refine`, data),
};

// ── Meshes ───────────────────────────────────────────────
export const meshesAPI = {
  getAll: (params) => api.get('/meshes', { params }),
  upload: (formData) => api.post('/meshes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── Dashboard ────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;