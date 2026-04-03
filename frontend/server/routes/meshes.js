const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

const uploadDir = path.join(__dirname, '../uploads/meshes');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const { case_id } = req.query;
  const rows = case_id
    ? db.prepare('SELECT * FROM meshes WHERE case_id = ? ORDER BY timestamp DESC').all(case_id)
    : db.prepare('SELECT * FROM meshes ORDER BY timestamp DESC').all();
  res.json({ success: true, data: rows });
});

router.post('/upload', upload.single('mesh'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No mesh file' });
  const { case_id, narration_id, sketch_id, format } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO meshes (id, case_id, narration_id, sketch_id, mesh_path, format, render_status) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, case_id, narration_id, sketch_id, `/uploads/meshes/${req.file.filename}`, format || 'obj', 'ready');
  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM meshes WHERE id = ?').get(id) });
});

module.exports = router;
