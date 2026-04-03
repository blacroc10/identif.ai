const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const mlBackend = require('../services/mlBackend');

const router = express.Router();
const upload = multer({ dest: path.join(os.tmpdir(), 'identifai-ml') });

router.get('/health', async (req, res, next) => {
  try {
    const data = await mlBackend.checkHealth();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/extract-attributes', async (req, res, next) => {
  try {
    const text = req.body?.text || '';
    const attributes = await mlBackend.extractAttributes(text);
    res.json({ success: true, attributes });
  } catch (error) {
    next(error);
  }
});

router.post('/generate-from-text', async (req, res, next) => {
  try {
    const text = req.body?.text || '';
    const seed = Number.isFinite(req.body?.seed) ? req.body.seed : 42;
    const result = await mlBackend.generateFromText(text, seed);
    res.setHeader('Content-Type', 'image/png');
    res.send(Buffer.from(result.data));
  } catch (error) {
    next(error);
  }
});

router.post('/generate-from-audio', upload.single('audio'), async (req, res, next) => {
  const tempPath = req.file?.path;
  try {
    if (!tempPath) {
      return res.status(400).json({ error: 'Audio file is required' });
    }
    const result = await mlBackend.generateFromAudio(tempPath);
    res.json(result.data);
  } catch (error) {
    next(error);
  } finally {
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
});

module.exports = router;
