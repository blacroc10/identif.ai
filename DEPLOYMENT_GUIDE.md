# Identif.ai — Complete Setup Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Express)                  │
│  - Web UI for case management, audio narration, sketch approval │
│  - Express API server (port 5000)                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP Calls
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│              ML Backend (FastAPI) — Port 8000                   │
│  ✅ Whisper ASR (audio → text)                                  │
│  ✅ Attribute Extraction (text → facial attributes)             │
│  ✅ StableDiffusion from HuggingFace (attributes → face)       │
│  ✅ GFPGAN Restoration (enhance generated faces)               │
│  ✅ AWS Polly (text → speech synthesis)                        │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### System Requirements
- GPU with CUDA 11.8+ (NVIDIA A4000, L40, A100, H100 recommended)
- 16+ GB VRAM
- 100+ GB free disk space (for model downloads)
- Linux/macOS (Windows needs WSL2)

### Software
- Python 3.10+
- Node.js 18+
- Git

### API Credentials
1. **HuggingFace Token** — For loading your fine-tuned StableDiffusion model
   - Go to https://huggingface.co/settings/tokens
   - Create a token with `repo` read access
   - Copy token

2. **AWS Credentials** (optional, for Polly text-to-speech)
   - AWS Access Key ID
   - AWS Secret Access Key
   - Region (e.g., `us-east-1`)

---

## Step 1: Setup ML Backend

### 1a. Create Python environment

```bash
cd /home/CL502-30/identif.ai
python3 -m venv ml_env
source ml_env/bin/activate  # Linux/macOS
# or: ml_env\Scripts\activate  # Windows
```

### 1b. Install ML dependencies

```bash
pip install -r ml_requirements.txt
```

### 1c. Download spaCy model

```bash
python -m spacy download en_core_web_sm
```

### 1d. Create `.env` file for ML backend

```bash
cat > /home/CL502-30/identif.ai/.env << 'EOF'
# HuggingFace Model (your fine-tuned StableDiffusion)
HF_TOKEN=hf_your_actual_token_here
HF_REPO=your-username/your-repo-name

# AWS Polly (optional)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1

# Server
ML_BACKEND_PORT=8000
EOF
```

### 1e. Verify setup

```bash
python ml_backend.py &
# In another terminal:
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "service": "Identif.ai ML Backend",
  "models_ready": {
    "whisper": true,
    "spacy": true,
    "stablediffusion": true,
    "gfpgan": true,
    "polly": true
  }
}
```

---

## Step 2: Setup Frontend

### 2a. Navigate to frontend

```bash
cd /home/CL502-30/identif.ai/frontend
```

### 2b. Install frontend dependencies

```bash
npm install
cd server && npm install
cd ..
```

### 2c. Create frontend `.env` file

```bash
cat > /home/CL502-30/identif.ai/frontend/server/.env << 'EOF'
PORT=5000
ML_BACKEND_URL=http://localhost:8000
DATABASE_PATH=./db/identifai.db
EOF
```

### 2d. Run frontend

```bash
cd server
npm start
# Server runs on http://localhost:5000
```

---

## Step 3: Connect Frontend to ML Backend

The Express routes have been updated to automatically call the ML backend:

### Automatic Audio Processing

```javascript
// POST /api/narrations/upload?auto_process=true
// Automatically:
// 1. Transcribes audio with Whisper
// 2. Extracts facial attributes
// 3. Generates face with StableDiffusion
// 4. Restores with GFPGAN
```

### Manual Processing

```bash
# Process a narration (extract attributes + face)
curl -X POST http://localhost:5000/api/narrations/{narration_id}/process-ml
```

---

## Step 4: Run Both Services

### Terminal 1 — ML Backend

```bash
cd /home/CL502-30/identif.ai
source ml_env/bin/activate
python ml_backend.py
# Runs on http://localhost:8000
```

### Terminal 2 — Frontend

```bash
cd /home/CL502-30/identif.ai/frontend/server
npm start
# Runs on http://localhost:5000
```

### Terminal 3 — (Optional) React Client

```bash
cd /home/CL502-30/identif.ai/frontend/client
npm start
# Runs on http://localhost:3000
```

---

## API Endpoints

### ML Backend (FastAPI)

#### Health Check
```bash
GET http://localhost:8000/health
```

#### Generate Face from Audio
```bash
curl -X POST http://localhost:8000/generate-from-audio \
  -F "audio=@narration.wav"
```

**Returns:**
```json
{
  "success": true,
  "transcription": "young blonde woman...",
  "attributes": {
    "gender": "a female face",
    "approx_age": "a young adult face",
    "hair_color": "a person with blonde hair"
  },
  "image_url": "/generated_face.png",
  "speech_available": true
}
```

#### Generate Face from Text
```bash
curl -X POST http://localhost:8000/generate-from-text \
  -H "Content-Type: application/json" \
  -d '{"text": "30 year old man with dark hair", "seed": 42}'
```

**Returns:** PNG image (binary)

#### Extract Attributes
```bash
curl -X POST http://localhost:8000/extract-attributes \
  -H "Content-Type: application/json" \
  -d '{"text": "young blonde woman"}'
```

#### Synthesize Speech (Polly)
```bash
curl -X POST http://localhost:8000/synthesize-speech \
  -H "Content-Type: application/json" \
  -d '{"text": "The suspect is a 30-year-old male"}'
```

**Returns:** MP3 audio (binary)

### Frontend Express API

#### Upload Audio Narration
```bash
curl -X POST http://localhost:5000/api/narrations/upload \
  -F "audio=@recording.wav" \
  -F "case_id=case123" \
  -F "auto_process=true"
```

#### Process Narration with ML
```bash
curl -X POST http://localhost:5000/api/narrations/{id}/process-ml
```

#### Get Narration with Extracted Attributes
```bash
curl http://localhost:5000/api/narrations/{id}
```

---

## Troubleshooting

### "ML Backend not responding"

```bash
# Check if backend is running:
curl http://localhost:8000/health

# If not, check logs:
python ml_backend.py  # Watch for errors
```

### "Model loading failed"

```bash
# Check HF_REPO and HF_TOKEN are set:
echo $HF_TOKEN
echo $HF_REPO

# Re-login to HuggingFace:
huggingface-cli login
# Then paste your token
```

### "CUDA out of memory"

```bash
# Set batch size to 1 (in ml_backend.py):
# guidance_scale=1.0  # Lower from 7.5
# num_inference_steps=15  # Lower from 35
```

### "Audio file not found"

```bash
# Check uploads directory:
ls /home/CL502-30/identif.ai/frontend/server/uploads/audio/

# Check file permissions:
chmod 755 /home/CL502-30/identif.ai/frontend/server/uploads/audio
```

---

## Performance Tips

| Setting | Default | Fast Mode | Quality Mode |
|---------|---------|-----------|--------------|
| Inference Steps | 35 | 15 | 50 |
| Guidance Scale | 7.5 | 1.0 | 12.0 |
| Model Precision | fp16 | fp16 | fp32 |
| Time per image | ~4s | ~2s | ~8s |

---

## Deployment to Production

### Option 1: Local Server (Development)
- Use this setup as-is
- Good for testing, not for public access

### Option 2: Cloud Deployment (Recommended)
- Keep Frontend + Backend separate
- Use AWS/GCP/Azure for GPU inference
- Deploy Frontend to Vercel/Netlify

### Option 3: Replicate + Cog
- Already set up in your project!
- Use your Cog model on Replicate
- Call via API from frontend

---

## Next Steps

1. ✅ **Test the pipeline locally** — Record audio, see faces generate
2. ✅ **Optimize performance** — Adjust inference steps for speed/quality
3. ✅ **Add database persistence** — Store generated faces + sketch versions
4. ✅ **Deploy to production** — Push to Replicate or cloud provider

---

## Support

For issues, check:
- ML Backend logs: `python ml_backend.py`
- Express logs: `npm start`
- Browser console: F12 → Console tab
- Database: `/frontend/server/db/identifai.db`

