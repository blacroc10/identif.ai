const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

// GET all cases
router.get('/', (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM cases';
  const params = [];
  const conditions = [];
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (search) { conditions.push('(title LIKE ? OR case_number LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC';
  const cases = db.prepare(query).all(...params);
  res.json({ success: true, data: cases });
});

// GET single case with all linked data
router.get('/:id', (req, res) => {
  const case_ = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!case_) return res.status(404).json({ success: false, error: 'Case not found' });
  const narrations = db.prepare('SELECT * FROM narrations WHERE case_id = ? ORDER BY created_at DESC').all(req.params.id);
  const sketches = db.prepare('SELECT * FROM sketches WHERE case_id = ? ORDER BY version DESC').all(req.params.id);
  const meshes = db.prepare('SELECT * FROM meshes WHERE case_id = ? ORDER BY timestamp DESC').all(req.params.id);
  res.json({ success: true, data: { ...case_, narrations, sketches, meshes } });
});

// POST create case
router.post('/', (req, res) => {
  const { title, description, investigator } = req.body;
  if (!title) return res.status(400).json({ success: false, error: 'Title is required' });
  const id = uuidv4();
  const case_number = `CASE-${Date.now().toString().slice(-6)}`;
  db.prepare('INSERT INTO cases (id, case_number, title, description, investigator) VALUES (?, ?, ?, ?, ?)')
    .run(id, case_number, title, description || '', investigator || 'Unknown');
  const created = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
  res.status(201).json({ success: true, data: created });
});

// PATCH update case
router.patch('/:id', (req, res) => {
  const { title, description, status, investigator } = req.body;
  const existing = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Case not found' });
  db.prepare('UPDATE cases SET title=?, description=?, status=?, investigator=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(title ?? existing.title, description ?? existing.description, status ?? existing.status, investigator ?? existing.investigator, req.params.id);
  res.json({ success: true, data: db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id) });
});

// DELETE case
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM cases WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ success: false, error: 'Case not found' });
  res.json({ success: true, message: 'Case deleted' });
});

module.exports = router;
