const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const mlBackend = require('../services/mlBackend');

const uploadDir = path.join(__dirname, '../uploads/audio');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowed = ['.wav', '.mp3', '.m4a', '.ogg', '.webm'];
  cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
}});

// GET narrations (optionally by case)
router.get('/', (req, res) => {
  const { case_id } = req.query;
  const query = case_id
    ? 'SELECT * FROM narrations WHERE case_id = ? ORDER BY created_at DESC'
    : 'SELECT * FROM narrations ORDER BY created_at DESC';
  const rows = case_id ? db.prepare(query).all(case_id) : db.prepare(query).all();
  res.json({ success: true, data: rows.map(r => ({ ...r, extracted_attributes: r.extracted_attributes ? JSON.parse(r.extracted_attributes) : null })) });
});

// GET single narration
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM narrations WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Narration not found' });
  res.json({ success: true, data: { ...row, extracted_attributes: row.extracted_attributes ? JSON.parse(row.extracted_attributes) : null } });
});

// POST upload audio narration
router.post('/upload', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No audio file uploaded' });
  const { case_id, auto_process } = req.body;
  const narration_id = uuidv4();
  const full_audio_path = path.join(__dirname, '../uploads/audio', req.file.filename);

  db.prepare('INSERT INTO narrations (id, case_id, audio_path, status) VALUES (?, ?, ?, ?)')
    .run(narration_id, case_id || null, `/uploads/audio/${req.file.filename}`, 'processing');

  const narration = db.prepare('SELECT * FROM narrations WHERE id = ?').get(narration_id);

  // ── Auto-process if requested ──────────────────────────────────
  if (auto_process === 'true' || auto_process === true) {
    setImmediate(async () => {
      try {
        console.log(`🎤 Processing audio: ${narration_id}`);
        const response = await mlBackend.generateFromAudio(full_audio_path);

        // Extract metadata from response
        const responseData = response.data;
        const transcription = responseData.transcription || '';
        const attributes = responseData.attributes || {};

        // ── Update narration record ────────────────────────────
        db.prepare('UPDATE narrations SET transcribed_text=?, extracted_attributes=?, status=? WHERE id=?')
          .run(transcription, JSON.stringify(attributes), 'completed', narration_id);

        console.log(`✅ Audio processed: ${narration_id}`);
      } catch (error) {
        console.error(`❌ Audio processing failed: ${error.message}`);
        db.prepare('UPDATE narrations SET status=? WHERE id=?')
          .run('error', narration_id);
      }
    });
  }

  res.status(201).json({ success: true, data: narration });
});


// POST process narration with ML backend (extract attributes from audio/text)
router.post('/:id/process-ml', async (req, res) => {
  try {
    const narration = db.prepare('SELECT * FROM narrations WHERE id = ?').get(req.params.id);
    if (!narration) return res.status(404).json({ success: false, error: 'Narration not found' });

    const full_audio_path = path.join(__dirname, '../uploads/audio', path.basename(narration.audio_path || ''));

    // ── Check if audio file exists ────────────────────────
    if (narration.audio_path && fs.existsSync(full_audio_path)) {
      console.log(`🎤 Processing audio with ML Backend: ${narration.id}`);
      const response = await mlBackend.generateFromAudio(full_audio_path);
      const transcription = response.data.transcription || '';
      const attributes = response.data.attributes || {};

      db.prepare('UPDATE narrations SET transcribed_text=?, extracted_attributes=?, status=? WHERE id=?')
        .run(transcription, JSON.stringify(attributes), 'completed', req.params.id);

      return res.json({
        success: true,
        data: db.prepare('SELECT * FROM narrations WHERE id = ?').get(req.params.id)
      });
    }

    // ── Fall back to text processing ───────────────────────
    if (narration.transcribed_text) {
      console.log(`📝 Extracting attributes from text: ${narration.id}`);
      const attributes = await mlBackend.extractAttributes(narration.transcribed_text);

      db.prepare('UPDATE narrations SET extracted_attributes=?, status=? WHERE id=?')
        .run(JSON.stringify(attributes), 'completed', req.params.id);

      return res.json({
        success: true,
        data: db.prepare('SELECT * FROM narrations WHERE id = ?').get(req.params.id)
      });
    }

    return res.status(400).json({ success: false, error: 'No audio or text to process' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST submit text narration directly
router.post('/text', (req, res) => {
  const { case_id, transcribed_text } = req.body;
  if (!transcribed_text) return res.status(400).json({ success: false, error: 'Text is required' });
  const id = uuidv4();
  db.prepare('INSERT INTO narrations (id, case_id, transcribed_text, status) VALUES (?, ?, ?, ?)')
    .run(id, case_id || null, transcribed_text, 'pending');
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM narrations WHERE id = ?').get(id) });
});

// PATCH update narration with transcription / attributes (called by Python pipeline)
router.patch('/:id/process', (req, res) => {
  const { transcribed_text, extracted_attributes, confidence_score } = req.body;
  const existing = db.prepare('SELECT * FROM narrations WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Not found' });
  db.prepare('UPDATE narrations SET transcribed_text=?, extracted_attributes=?, confidence_score=?, status=? WHERE id=?')
    .run(transcribed_text, JSON.stringify(extracted_attributes), confidence_score, 'completed', req.params.id);
  res.json({ success: true, data: db.prepare('SELECT * FROM narrations WHERE id = ?').get(req.params.id) });
});

module.exports = router;
