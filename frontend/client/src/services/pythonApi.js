import axios from 'axios';

const pythonApi = axios.create({
  baseURL: process.env.REACT_APP_PYTHON_API_URL || '/api/ml',
  timeout: 120000, // 2 min — SD generation takes time
});

// Request interceptor
pythonApi.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor — only parse JSON responses, leave blobs alone
pythonApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.message ||
      'Python API unreachable';
    return Promise.reject(new Error(message));
  }
);

export const forensicAPI = {
  // Health check — use this to verify API is online before doing anything
  health: () => pythonApi.get('/health'),

  // Step 1a — Upload audio → transcription + attributes JSON
  transcribe: (audioBlob) => {
    const fd = new FormData();
    fd.append('audio', audioBlob, 'narration.wav');
    return pythonApi.post('/generate-from-audio', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Step 1b — Type text → attributes JSON (no audio needed)
  attributesFromText: (text) =>
    pythonApi.post('/extract-attributes', { text }),

  // Step 2 — Attributes JSON → face image PNG blob
  generateFromAttributes: (attrs) =>
    pythonApi.post('/generate-from-text', { text: Object.values(attrs || {}).join(', ') }, {
      responseType: 'blob', // CRITICAL — response is binary image
    }),

  // Full pipeline in one shot — audio → face image PNG blob
  generate: (audioBlob) => {
    const fd = new FormData();
    fd.append('audio', audioBlob, 'narration.wav');
    return pythonApi.post('/generate-from-audio', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default pythonApi;