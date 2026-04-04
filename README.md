# IDENTIF.AI — Forensic 3D Face Construction Frontend

> AI-powered forensic tool — eyewitness verbal narration → 2D composite → 3D face model


---

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, React Router v6, Framer Motion, Recharts |
| Backend   | Node.js, Express 4, better-sqlite3 |
| Styling   | Custom CSS (dark-techno design system, CSS variables) |
| Fonts     | Share Tech Mono, Barlow / Barlow Condensed |
| Auth      | None (add JWT layer when deploying) |
| DB        | SQLite3 (via better-sqlite3) |

---

## Project Structure

```
identifai/
├── package.json                  ← Root runner (concurrently)
│
├── server/                       ← Express API
│   ├── index.js                  ← App entry, middleware, routes
│   ├── .env.example
│   ├── db/
│   │   └── database.js           ← SQLite schema (5 tables)
│   └── routes/
│       ├── cases.js              ← /api/cases       CRUD
│       ├── narrations.js         ← /api/narrations  upload/text/process
│       ├── sketches.js           ← /api/sketches    upload/approve/refine
│       ├── meshes.js             ← /api/meshes      upload/list
│       └── dashboard.js          ← /api/dashboard/stats
│
└── client/                       ← React app
    └── src/
        ├── context/AppContext.js ← Global active case state
        ├── hooks/useApi.js       ← Generic async data hook
        ├── services/api.js       ← Axios API layer (all endpoints)
        ├── components/
        │   ├── Sidebar.js/css    ← Collapsible animated sidebar
        │   ├── TopBar.js/css     ← Breadcrumbs, search, clock
        │   └── UI.js/css         ← Design system components
        └── pages/
            ├── Dashboard.js              ← Overview, charts, recent cases
            ├── InvestigationDashboard.js ← Case cards, pipeline progress, health
            ├── Cases.js                  ← Full CRUD case management
            ├── NarrationInput.js         ← Audio upload + text + attribute extraction
            ├── SketchViewer.js           ← 2D composite viewer, zoom, approve, refine
            ├── Model3D.js                ← 3D wireframe viewer, multi-angle, export
            └── AuditLog.js              ← Unified forensic event timeline
```

---

## Quick Start

### 1. Install dependencies

```bash
cd identifai
npm run install:all
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Edit PORT, CLIENT_URL if needed
```

### 3. Run development servers

```bash
npm run dev
```

This starts:
- **React** at `http://localhost:3000`
- **Express API** at `http://localhost:5000`

---

## API Endpoints

### Cases
| Method | Endpoint             | Description              |
|--------|----------------------|--------------------------|
| GET    | /api/cases           | List all cases           |
| GET    | /api/cases/:id       | Get case with all data   |
| POST   | /api/cases           | Create new case          |
| PATCH  | /api/cases/:id       | Update case              |
| DELETE | /api/cases/:id       | Delete case              |

### Narrations
| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| GET    | /api/narrations                 | List narrations (filter by case)   |
| POST   | /api/narrations/upload          | Upload .wav/.mp3 audio             |
| POST   | /api/narrations/text            | Submit text narration directly     |
| PATCH  | /api/narrations/:id/process     | Store pipeline output (from Python)|

### Sketches
| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| GET    | /api/sketches                   | List sketches                      |
| POST   | /api/sketches/upload            | Upload sketch image (from Python)  |
| PATCH  | /api/sketches/:id/approve       | Witness approval                   |
| POST   | /api/sketches/:id/refine        | Submit refinement notes            |

### Meshes
| Method | Endpoint          | Description                          |
|--------|-------------------|--------------------------------------|
| GET    | /api/meshes       | List meshes                          |
| POST   | /api/meshes/upload| Upload .obj/.ply mesh (from Python)  |

### Dashboard
| Method | Endpoint               | Description    |
|--------|------------------------|----------------|
| GET    | /api/dashboard/stats   | System metrics |

---

## Connecting the Python Pipeline

The Node API is designed as the **bridge** between the React UI and the Python ML pipeline.

### Flow:
```
React UI
  → POST /api/narrations/upload        (submit audio)
  → Python: Whisper STT + spaCy NER   (runs separately)
  → PATCH /api/narrations/:id/process  (Python stores results)
  → React UI polls / refreshes         (displays attributes)
  → POST /api/sketches/upload          (Python uploads generated sketch)
  → PATCH /api/sketches/:id/approve    (witness approves)
  → POST /api/meshes/upload            (Python uploads 3D mesh)
  → React UI loads 3D viewer
```

### Python side — call the API like this:

```python
import requests

# After Whisper + spaCy processing:
requests.patch(f"http://localhost:5000/api/narrations/{narration_id}/process", json={
    "transcribed_text": transcribed,
    "extracted_attributes": attributes_dict,
    "confidence_score": 0.82
})

# After OpenCV sketch generation:
with open("sketch.png", "rb") as f:
    requests.post("http://localhost:5000/api/sketches/upload", files={"sketch": f}, data={
        "case_id": case_id,
        "narration_id": narration_id,
        "version": 1
    })

# After 3DDFA mesh generation:
with open("face.obj", "rb") as f:
    requests.post("http://localhost:5000/api/meshes/upload", files={"mesh": f}, data={
        "case_id": case_id,
        "narration_id": narration_id,
        "format": "obj"
    })
```

---

## SQLite Schema

```sql
cases       (id, case_number, title, description, status, investigator, created_at)
faces       (id, case_id, identity_label, image_path, embedding_vector BLOB)
attributes  (id, face_id, gender, age_group, face_shape, nose_size, jaw_width, ...)
narrations  (id, case_id, audio_path, transcribed_text, extracted_attributes JSON, confidence_score, status)
sketches    (id, case_id, narration_id, image_path, version, approved, refinement_notes)
meshes      (id, case_id, narration_id, sketch_id, mesh_path, format, render_status)
```

---

## Pages

| Route          | Page                     | Description                                      |
|----------------|--------------------------|--------------------------------------------------|
| `/`            | Dashboard                | Stats, activity chart, recent cases table        |
| `/investigate` | Investigation Dashboard  | Case cards with pipeline progress + health       |
| `/cases`       | Cases                    | Full CRUD — create, edit, delete, expand         |
| `/narration`   | Narration Input          | Audio upload + text entry + attribute viewer     |
| `/sketch`      | 2D Sketch Viewer         | Composite viewer, zoom, approve, refine          |
| `/model3d`     | 3D Model Viewer          | Wireframe viewer, multi-angle, export            |
| `/history`     | Audit Log                | Unified forensic event timeline + CSV export     |

---

## Design System

All design tokens are in `client/src/index.css`:

```css
--bg-void, --bg-deep, --bg-panel, --bg-raised   /* Backgrounds */
--cyan, --cyan-bright, --cyan-dim, --cyan-glow   /* Primary accent */
--amber, --green, --red                          /* Status colors */
--font-mono: 'Share Tech Mono'                   /* Code / labels */
--font-display: 'Barlow Condensed'               /* Headings */
--font-body: 'Barlow'                            /* Body text */
```

---

## Team

| Member              | Role                          |
|---------------------|-------------------------------|
| Aarvee Wadhwa       | ML / NLP Pipeline             |
| Yashraj Shrivastava | 3D Reconstruction             |
| Shubhankar Sarangi  | Speech Processing             |
| Raghav Dhoot        | Face Detection & Embeddings   |


