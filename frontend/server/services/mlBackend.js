/**
 * ML Backend Service
 * Communicates with FastAPI backend for face generation, ASR, etc.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const logger = console;

const normalizeBackendUrl = (raw) => {
  const value = (raw || '').trim();
  if (!value) return 'http://localhost:8000';
  if (/^https?:\/\//i.test(value)) return value;
  return `http://${value}`;
};

const ML_BACKEND_URL = normalizeBackendUrl(process.env.ML_BACKEND_URL);
const TIMEOUT = 120000; // 2 minutes for generation

/**
 * Health check — verify backend is running
 */
async function checkHealth() {
  try {
    const response = await axios.get(`${ML_BACKEND_URL}/health`, { timeout: 5000 });
    logger.log('✅ ML Backend is healthy:', response.data);
    return response.data;
  } catch (error) {
    logger.error('❌ ML Backend health check failed:', error.message);
    throw error;
  }
}

/**
 * Generate face from audio narration
 * Sends audio file, receives face image + transcription + attributes
 */
async function generateFromAudio(audioPath) {
  try {
    logger.log(`📥 Sending audio to ML Backend: ${audioPath}`);

    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioPath));

    const response = await axios.post(
      `${ML_BACKEND_URL}/generate-from-audio`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: TIMEOUT,
        maxContentLength: 50 * 1024 * 1024,
      }
    );

    logger.log('✅ Face generation complete');
    return {
      success: true,
      data: response.data,
      headers: response.headers,
    };
  } catch (error) {
    logger.error('❌ Audio generation failed:', error.message);
    throw new Error(`ML Backend error: ${error.message}`);
  }
}

/**
 * Generate face from text description
 */
async function generateFromText(text, seed = 42) {
  try {
    logger.log(`📝 Generating face from text: "${text.substring(0, 50)}..."`);

    const response = await axios.post(
      `${ML_BACKEND_URL}/generate-from-text`,
      { text, seed },
      {
        timeout: TIMEOUT,
        responseType: 'arraybuffer',
        maxContentLength: 50 * 1024 * 1024,
      }
    );

    logger.log('✅ Face generation from text complete');
    return {
      success: true,
      data: response.data,
      headers: response.headers,
    };
  } catch (error) {
    logger.error('❌ Text generation failed:', error.message);
    throw new Error(`ML Backend error: ${error.message}`);
  }
}

/**
 * Extract facial attributes from text
 */
async function extractAttributes(text) {
  try {
    logger.log(`🔍 Extracting attributes from: "${text.substring(0, 50)}..."`);

    const response = await axios.post(
      `${ML_BACKEND_URL}/extract-attributes`,
      { text },
      { timeout: 15000 }
    );

    logger.log('✅ Attributes extracted:', response.data.attributes);
    return response.data.attributes;
  } catch (error) {
    logger.error('❌ Attribute extraction failed:', error.message);
    throw new Error(`ML Backend error: ${error.message}`);
  }
}

/**
 * Synthesize speech from text using AWS Polly
 */
async function synthesizeSpeech(text, voiceId = 'Joanna') {
  try {
    logger.log(`🔊 Synthesizing speech: "${text.substring(0, 50)}..."`);

    const response = await axios.post(
      `${ML_BACKEND_URL}/synthesize-speech`,
      { text },
      {
        timeout: TIMEOUT,
        responseType: 'arraybuffer',
        maxContentLength: 50 * 1024 * 1024,
      }
    );

    logger.log('✅ Speech synthesis complete');
    return {
      success: true,
      data: response.data, // MP3 bytes
      headers: response.headers,
    };
  } catch (error) {
    logger.error('❌ Speech synthesis failed:', error.message);
    throw new Error(`ML Backend error: ${error.message}`);
  }
}

module.exports = {
  checkHealth,
  generateFromAudio,
  generateFromText,
  extractAttributes,
  synthesizeSpeech,
  ML_BACKEND_URL,
};
