const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/identifai.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    case_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','closed','pending')),
    investigator TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS faces (
    id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(id),
    identity_label TEXT,
    image_path TEXT,
    embedding_vector BLOB,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attributes (
    id TEXT PRIMARY KEY,
    face_id TEXT REFERENCES faces(id),
    gender TEXT,
    age_group TEXT,
    face_shape TEXT,
    nose_size TEXT,
    jaw_width TEXT,
    facial_hair TEXT,
    eye_shape TEXT,
    brow_type TEXT,
    skin_tone TEXT,
    hair_style TEXT,
    expression TEXT,
    scars_marks TEXT
  );

  CREATE TABLE IF NOT EXISTS narrations (
    id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(id),
    audio_path TEXT,
    transcribed_text TEXT,
    extracted_attributes TEXT,
    confidence_score REAL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sketches (
    id TEXT PRIMARY KEY,
    narration_id TEXT REFERENCES narrations(id),
    case_id TEXT REFERENCES cases(id),
    image_path TEXT,
    version INTEGER DEFAULT 1,
    approved INTEGER DEFAULT 0,
    refinement_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meshes (
    id TEXT PRIMARY KEY,
    narration_id TEXT REFERENCES narrations(id),
    case_id TEXT REFERENCES cases(id),
    sketch_id TEXT REFERENCES sketches(id),
    mesh_path TEXT,
    format TEXT DEFAULT 'obj',
    render_status TEXT DEFAULT 'pending',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
