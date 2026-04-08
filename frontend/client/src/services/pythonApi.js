import axios from 'axios';

const pythonApi = axios.create({
  baseURL: process.env.REACT_APP_PYTHON_API_URL || '/api/ml',
  timeout: 900000, // 15 min — CPU-bound ASR/SD generation can take a long time
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
    const fileName = audioBlob?.name || `narration.${(audioBlob?.type || '').includes('ogg') ? 'ogg' : (audioBlob?.type || '').includes('mp4') ? 'm4a' : 'webm'}`;
    fd.append('audio', audioBlob, fileName);
    return pythonApi.post('/generate-from-audio', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Step 1b — Type text → attributes JSON (no audio needed)
  attributesFromText: (text) =>
    pythonApi.post('/extract-attributes', { text }),

  // Step 2 — Attributes JSON (+ optional refinement text) → face image PNG blob
  generateFromAttributes: (attrs, textHint = '') => {
    const attrText = Object.values(attrs || {}).filter(Boolean).join(', ');
    const mergedText = [attrText, textHint].filter(Boolean).join(', ');
    return pythonApi.post('/generate-from-text', { text: mergedText }, {
      responseType: 'blob', // CRITICAL — response is binary image
    });
  },

  // Full pipeline in one shot — audio → face image PNG blob
  generate: (audioBlob) => {
    const fd = new FormData();
    const fileName = audioBlob?.name || `narration.${(audioBlob?.type || '').includes('ogg') ? 'ogg' : (audioBlob?.type || '').includes('mp4') ? 'm4a' : 'webm'}`;
    fd.append('audio', audioBlob, fileName);
    return pythonApi.post('/generate-from-audio', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default pythonApi;