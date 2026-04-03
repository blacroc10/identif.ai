const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

const uploadDir = path.join(__dirname, '../uploads/sketches');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// GET sketches (optionally by case or narration)
router.get('/', (req, res) => {
  const { case_id, narration_id } = req.query;
  let query = 'SELECT * FROM sketches WHERE 1=1';
  const params = [];
  if (case_id) { query += ' AND case_id = ?'; params.push(case_id); }
  if (narration_id) { query += ' AND narration_id = ?'; params.push(narration_id); }
  query += ' ORDER BY version DESC';
  res.json({ success: true, data: db.prepare(query).all(...params) });
});

// POST upload sketch (from Python pipeline)
router.post('/upload', upload.single('sketch'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded' });
  const { case_id, narration_id, version, refinement_notes } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO sketches (id, case_id, narration_id, image_path, version, refinement_notes) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, case_id, narration_id, `/uploads/sketches/${req.file.filename}`, version || 1, refinement_notes || '');
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM sketches WHERE id = ?').get(id) });
});

// PATCH approve sketch
router.patch('/:id/approve', (req, res) => {
  db.prepare('UPDATE sketches SET approved = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST refinement request (re-runs pipeline with notes)
router.post('/:id/refine', (req, res) => {
  const { refinement_notes } = req.body;
  const sketch = db.prepare('SELECT * FROM sketches WHERE id = ?').get(req.params.id);
  if (!sketch) return res.status(404).json({ success: false, error: 'Sketch not found' });
  // Create new version placeholder — Python pipeline will fill image_path
  const id = uuidv4();
  db.prepare('INSERT INTO sketches (id, case_id, narration_id, version, refinement_notes) VALUES (?, ?, ?, ?, ?)')
    .run(id, sketch.case_id, sketch.narration_id, (sketch.version || 1) + 1, refinement_notes);
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM sketches WHERE id = ?').get(id) });
});

module.exports = router;
