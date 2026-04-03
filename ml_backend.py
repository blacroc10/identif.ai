#!/usr/bin/env python3
"""
Identif.ai ML Backend
FastAPI server connecting Whisper ASR, StableDiffusion, GFPGAN, and Polly
Models load from HuggingFace (not locally) for efficient deployment
"""

import os
import io
import torch
import whisper
import librosa
import soundfile as sf
import spacy
import re
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Optional
import boto3
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler, AutoencoderKL
from gfpgan import GFPGANer
from huggingface_hub import login
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Initialize FastAPI ──────────────────────────────────────────
app = FastAPI(
    title="Identif.ai ML Backend",
    description="ASR → Attributes → StableDiffusion → GFPGAN → Polly",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Environment Setup ───────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv()

HF_REPO = os.getenv("HF_REPO", "")
HF_TOKEN = os.getenv("HF_TOKEN", "")
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

if HF_TOKEN:
    login(token=HF_TOKEN)

# ── Initialize AWS Polly ────────────────────────────────────────
try:
    polly_client = boto3.client(
        'polly',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY
    ) if AWS_ACCESS_KEY else None
    if polly_client:
        logger.info("✅ Polly client initialized")
except Exception as e:
    logger.warning(f"⚠ Polly not configured: {e}")
    polly_client = None

# ── Load ML Models (LAZY - only on startup) ─────────────────────
logger.info("Loading ML models...")

# Whisper ASR
whisper_model = whisper.load_model("medium")
logger.info("✅ Whisper loaded")

# spaCy NLP
nlp = spacy.load("en_core_web_sm")
logger.info("✅ spaCy loaded")

# StableDiffusion from HuggingFace (NOT local)
if HF_REPO:
    logger.info(f"Loading StableDiffusion from HuggingFace: {HF_REPO}")
    pipe = StableDiffusionPipeline.from_pretrained(
        HF_REPO,
        torch_dtype=torch.float16,
        safety_checker=None,
        requires_safety_checker=False,
    )
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(
        pipe.scheduler.config,
        use_karras_sigmas=True,
        algorithm_type="dpmsolver++"
    )
    pipe = pipe.to("cuda")
    try:
        pipe.enable_xformers_memory_efficient_attention()
        logger.info("✅ xformers attention enabled")
    except Exception as e:
        logger.warning(f"⚠ xformers not available, using default attention: {e}")
    pipe.enable_attention_slicing()
    logger.info("✅ StableDiffusion loaded from HuggingFace")
else:
    logger.warning("⚠ HF_REPO not set — face generation will not work")
    pipe = None

# GFPGAN Face Restoration
restorer = GFPGANer(
    model_path="https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth",
    upscale=1,
    arch="clean",
    channel_multiplier=2,
    bg_upsampler=None,
)
logger.info("✅ GFPGAN restorer loaded")

# ── Helper Functions ────────────────────────────────────────────

NEGATIVE_PROMPT = (
    "cartoon, anime, manga, illustration, painting, drawing, sketch, "
    "3d render, cgi, doll, plastic skin, wax figure, video game, "
    "blurry, out of focus, low quality, low resolution, jpeg artifacts, "
    "watermark, text, logo, signature, username, border, frame, "
    "deformed, disfigured, mutated, bad anatomy, extra limbs, "
    "extra fingers, missing fingers, fused fingers, "
    "asymmetric eyes, cross eyed, lazy eye, wall eye, "
    "bad teeth, missing teeth, gums showing, "
    "double face, cloned face, duplicate, "
    "overexposed, underexposed, oversaturated, "
    "unnatural skin color, orange skin, grey skin, green tint, "
    "ugly, disgusting, worst quality, normal quality"
)

ATTRIBUTE_KEYS = [
    "gender",
    "approx_age",
    "ethnicity_complexion",
    "skin_tone",
    "facial_expression",
    "clothing",
    "uniform",
    "face_shape",
    "jaw_strength",
    "jaw_width",
    "chin_shape",
    "cheekbones",
    "eye_size",
    "eye_shape",
    "eye_spacing",
    "eye_tilt",
    "nose_length",
    "nose_width",
    "nose_bridge",
    "nose_tip",
    "mouth_width",
    "mouth_corners",
    "lip_ratio",
    "ear_size",
    "ear_position",
    "earlobes",
    "forehead_height",
    "forehead_width",
    "hair_color",
    "hair_length",
    "hair_texture",
    "hair_density",
    "hair_parting",
    "hairline",
    "facial_hair",
    "beard_style",
    "beard_density",
    "eye_color",
    "sideburns",
    "lip_color",
    "skin_texture",
    "wrinkles",
    "freckles",
    "moles",
    "birthmarks",
    "allow_beard",
    "allow_wrinkles",
    "allow_parting",
    "scars",
    "tattoos",
    "facial_injury",
    "lazy_eye",
    "crooked_nose",
    "missing_tooth",
    "piercings",
]

ATTRIBUTE_KEYWORDS = {
    "gender": ["a male face", "a female face", "man", "woman"],
    "approx_age": [
        "a child face", "a teenage face", "a young adult face",
        "a middle aged face", "an elderly face"
    ],
    "ethnicity_complexion": [
        "a light skin tone face", "a medium skin tone face",
        "a dark skin tone face", "an olive skin tone face"
    ],
    "skin_tone": [
        "dark skin", "fair skin", "olive skin", "medium skin", "light skin",
        "pale skin"
    ],
    "facial_expression": [
        "a smiling face", "a neutral face", "a frowning face",
        "a surprised face", "an angry face"
    ],
    "clothing": ["formal clothing", "casual clothing", "clothes", "attire"],
    "uniform": ["wearing a uniform", "not wearing a uniform"],
    "face_shape": [
        "a face with a rectangular shape", "a face with a diamond shape",
        "a face with an oval shape", "a face with a heart shape",
        "a face with a round shape", "a face with a square shape"
    ],
    "jaw_strength": ["a face with a strong jawline", "a face with a soft jawline"],
    "jaw_width": ["a face with a wide jaw", "a face with a narrow jaw"],
    "chin_shape": [
        "a face with a pointed chin", "a face with a rounded chin",
        "a face with a receding chin", "a face with a double chin"
    ],
    "cheekbones": [
        "a face with high cheekbones", "a face with flat cheeks",
        "a face with full cheeks", "a face with hollow cheeks"
    ],
    "eye_size": ["a face with small eyes", "a face with medium sized eyes", "a face with large eyes"],
    "eye_shape": ["a face with round eyes", "a face with almond shaped eyes", "a face with narrow eyes", "a face with deep set eyes"],
    "eye_spacing": ["a face with close set eyes", "a face with wide set eyes"],
    "eye_tilt": ["a face with upward slanted eyes", "a face with downward slanted eyes", "a face with horizontally aligned eyes"],
    "nose_length": ["a face with a short nose", "a face with a medium length nose", "a face with a long nose"],
    "nose_width": ["a face with a narrow nose", "a face with a wide nose"],
    "nose_bridge": ["a face with a straight nose bridge", "a face with a curved nose bridge", "a face with a flat nose bridge"],
    "nose_tip": ["a face with a pointed nose tip", "a face with a round nose tip", "a face with a bulbous nose tip"],
    "mouth_width": ["a face with a narrow mouth", "a face with a wide mouth"],
    "mouth_corners": ["a face with upturned mouth corners", "a face with downturned mouth corners"],
    "lip_ratio": ["a face with a larger upper lip", "a face with a larger lower lip", "a face with balanced lips"],
    "ear_size": ["a face with small ears", "a face with large ears"],
    "ear_position": ["a face with protruding ears", "a face with flat ears"],
    "earlobes": ["a face with detached earlobes", "a face with attached earlobes"],
    "forehead_height": ["a face with a high forehead", "a face with a medium forehead", "a face with a low forehead"],
    "forehead_width": ["a face with a wide forehead", "a face with a narrow forehead"],
    "hair_color": ["a person with black hair", "a person with brown hair", "a person with blonde hair", "a person with red hair", "a person with gray hair"],
    "hair_length": ["a person with short hair", "a person with medium hair", "a person with long hair"],
    "hair_texture": ["a person with straight hair", "a person with wavy hair", "a person with curly hair"],
    "hair_density": ["a person with thick hair", "a person with normal hair", "a person with thin hair", "a person with sparse hair"],
    "hair_parting": ["a person with a middle part", "a person with a side part"],
    "hairline": ["a person with a receding hairline", "a person with a widow's peak hairline"],
    "facial_hair": ["a clean shaven face", "a face with stubble", "a face with a mustache", "a face with a beard", "none"],
    "beard_style": ["a face with a goatee beard", "a face with a full beard", "none"],
    "beard_density": ["a face with a dense beard", "a face with a sparse beard", "a face with a patchy beard", "none"],
    "eye_color": ["brown eyes", "blue eyes", "green eyes", "hazel eyes", "dark eyes", "black eyes", "grey eyes"],
    "sideburns": ["a face with sideburns", "none"],
    "lip_color": ["a face with pale lips", "a face with pink lips", "a face with dark lips"],
    "skin_texture": ["a face with smooth skin", "a face with rough skin", "a face with visible pores", "a face with acne scars"],
    "wrinkles": ["visible", "none","has wrinkles","no wrinkles","wrinkles on the forehead","wrinkles around the eyes","wrinkles around the mouth"],
    "freckles": ["a face with freckles", "a face without freckles"],
    "moles": ["a face with moles", "a face without moles"],
    "birthmarks": ["a face with birthmarks", "a face without birthmarks"," a birthmark on the face","birthmark on the left cheek","birthmark on the right cheek","birthmark on the forehead","birthmark on the nose"],
    "allow_beard": ["True", "False","has beard","no beard","Thick beard","Sparse beard","Patchy beard"],
    "allow_wrinkles": ["True", "False","has wrinkles","no wrinkles","visible wrinkles","smooth skin"],
    "allow_parting": ["True", "False"],
    "scars": ["yes", "no","has scars","no scars","a scar on the face","a scar on the left cheek","a scar on the right cheek","a scar on the forehead","a scar on the nose"],
    "tattoos": ["yes", "no","has tattoos","no tattoos","a tattoo on the face","a tattoo on the left cheek","a tattoo on the right cheek","a tattoo on the forehead","a tattoo on the nose"],
    "facial_injury": ["yes", "no","has facial injury","no facial injury","a facial injury on the left cheek","a facial injury on the right cheek","a facial injury on the forehead","a facial injury on the nose"],
    "lazy_eye": ["yes", "no","has lazy eye","no lazy eye","a lazy eye on the left","a lazy eye on the right"],
    "crooked_nose": ["yes", "no","has a crooked nose","no crooked nose","a crooked nose on the left","a crooked nose on the right"],
    "missing_tooth": ["yes", "no","has a missing tooth","no missing tooth","a missing tooth on the upper left","a missing tooth on the upper right","a missing tooth on the lower left","a missing tooth on the lower right"],
    "piercings": ["yes", "no","has piercings","no piercings","a piercing on the left ear","a piercing on the right ear","a piercing on the nose","a piercing on the eyebrow"],
}

def preprocess_audio(audio_path: str) -> str:
    """Normalize audio to 16kHz mono."""
    audio, sr = librosa.load(audio_path, sr=16000)
    peak = np.max(np.abs(audio))
    if peak > 0:
        audio = audio / peak
    output_path = "temp_clean.wav"
    sf.write(output_path, audio, 16000)
    return output_path

def speech_to_text(audio_path: str) -> str:
    """Transcribe audio using Whisper."""
    logger.info(f"Transcribing: {audio_path}")
    result = whisper_model.transcribe(audio_path, language="en")
    return result["text"].strip()

def clean_text(text: str) -> str:
    """Basic text cleaning."""
    text = text.lower()
    text = text.replace(",", "").replace(".", "")
    return text

def normalize_text_for_matching(value: str) -> str:
    """Normalize text for attribute matching."""
    value = (value or "").lower()
    value = value.replace("'", "")
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value

def extract_attributes(text: str) -> dict:
    """Extract facial attributes from text using phrase matching + spaCy."""
    safe_text = text or ""
    cleaned = clean_text(safe_text)
    normalized = normalize_text_for_matching(cleaned)

    attributes = {key: None for key in ATTRIBUTE_KEYS}

    # Phrase-first matching
    for attr, values in ATTRIBUTE_KEYWORDS.items():
        for phrase in values:
            norm_phrase = normalize_text_for_matching(phrase)
            if norm_phrase and norm_phrase in normalized:
                attributes[attr] = phrase
                break

    # spaCy token fallback
    doc = nlp(cleaned)
    token_set = {normalize_text_for_matching(t.text) for t in doc if not t.is_space}
    token_set |= {normalize_text_for_matching(t.lemma_) for t in doc if not t.is_space}

    stop_tokens = {"a", "an", "the", "with", "without", "face", "person", "of", "and", "to", "in"}

    for attr, values in ATTRIBUTE_KEYWORDS.items():
        if attributes[attr] is not None:
            continue
        for phrase in values:
            norm_phrase = normalize_text_for_matching(phrase)
            phrase_tokens = [t for t in norm_phrase.split() if t and t not in stop_tokens]
            if phrase_tokens and all(tok in token_set for tok in phrase_tokens):
                attributes[attr] = phrase
                break

    return attributes

def build_prompt(attributes: dict) -> str:
    """Build Stable Diffusion prompt from attributes."""
    parts = []
    gender = attributes.get("gender", "person")
    age = attributes.get("approx_age", "adult")
    parts.append(f"RAW photo, portrait of a {age} {gender}")

    for key in ATTRIBUTE_KEYS:
        if key in {"gender", "approx_age"}:
            continue
        value = attributes.get(key)
        if value is None:
            continue
        if isinstance(value, str) and value.strip().lower() in {"", "none", "no", "false", "not detected"}:
            continue
        parts.append(str(value))

    parts.append(
        "photorealistic, hyperdetailed face, DSLR photo, "
        "85mm portrait lens, professional studio lighting, "
        "sharp focus on face, skin pore detail, "
        "subsurface scattering, natural skin texture, "
        "8k uhd, high resolution, masterpiece"
    )

    return ", ".join(p for p in parts if p)

def generate_face(attributes: dict, seed: int = 42) -> Image.Image:
    """Generate face using StableDiffusion from HuggingFace."""
    if not pipe:
        raise RuntimeError("StableDiffusion model not loaded")

    prompt = build_prompt(attributes)
    logger.info(f"Generating face with prompt: {prompt[:100]}...")

    generator = torch.Generator("cuda").manual_seed(seed)
    with torch.autocast("cuda"):
        result = pipe(
            prompt=prompt,
            negative_prompt=NEGATIVE_PROMPT,
            generator=generator,
            num_inference_steps=35,
            guidance_scale=7.5,
            height=512,
            width=512,
        )

    image = result.images[0]

    # GFPGAN restoration
    img_bgr = np.array(image)[:, :, ::-1]
    _, _, restored_bgr = restorer.enhance(
        img_bgr,
        has_aligned=False,
        only_center_face=True,
        paste_back=True,
    )
    image = Image.fromarray(restored_bgr[:, :, ::-1])

    return image

def synthesize_speech(text: str, voice_id: str = "Joanna") -> bytes:
    """Synthesize speech using AWS Polly."""
    if not polly_client:
        logger.warning("Polly not available")
        return None

    try:
        response = polly_client.synthesize_speech(
            Text=text,
            OutputFormat='mp3',
            VoiceId=voice_id,
            Engine='neural'
        )
        return response['AudioStream'].read()
    except Exception as e:
        logger.error(f"Polly synthesis failed: {e}")
        return None

# ── API Endpoints ───────────────────────────────────────────────

class TextInput(BaseModel):
    text: str
    seed: Optional[int] = 42

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "service": "Identif.ai ML Backend",
        "models_ready": {
            "whisper": True,
            "spacy": True,
            "stablediffusion": pipe is not None,
            "gfpgan": True,
            "polly": polly_client is not None,
        }
    }

@app.post("/generate-from-audio")
async def generate_from_audio(audio: UploadFile = File(...)):
    """
    Full pipeline: Audio → Whisper → Attributes → StableDiffusion → GFPGAN
    Returns: JSON with transcription, attributes, and PNG image
    """
    try:
        # Save uploaded audio
        audio_path = f"temp_{audio.filename}"
        with open(audio_path, "wb") as f:
            f.write(await audio.read())

        # Preprocess & transcribe
        clean_path = preprocess_audio(audio_path)
        transcription = speech_to_text(clean_path)
        logger.info(f"Transcribed: {transcription}")

        # Extract attributes
        attributes = extract_attributes(transcription)
        logger.info(f"Extracted attributes: {attributes}")

        # Generate face
        if not pipe:
            raise HTTPException(status_code=503, detail="StableDiffusion model not loaded")

        image = generate_face(attributes)

        # Save image to bytes
        img_bytes = io.BytesIO()
        image.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        # Generate speech from transcription
        audio_response = synthesize_speech(transcription)

        # Cleanup
        os.remove(audio_path)
        os.remove(clean_path)

        return {
            "success": True,
            "transcription": transcription,
            "attributes": attributes,
            "image_url": "/generated_face.png",
            "speech_available": audio_response is not None,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Pipeline error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-from-text")
async def generate_from_text(payload: TextInput):
    """
    Text → Attributes → StableDiffusion → GFPGAN
    Returns: PNG image as bytes
    """
    try:
        attributes = extract_attributes(payload.text)
        image = generate_face(attributes, seed=payload.seed)

        img_bytes = io.BytesIO()
        image.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        return StreamingResponse(img_bytes, media_type="image/png")

    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-attributes")
async def extract_attributes_endpoint(payload: TextInput):
    """Extract facial attributes from text."""
    try:
        attributes = extract_attributes(payload.text)
        return {"success": True, "attributes": attributes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/synthesize-speech")
async def synthesize_speech_endpoint(payload: TextInput):
    """Synthesize speech from text using AWS Polly."""
    try:
        audio_bytes = synthesize_speech(payload.text)
        if not audio_bytes:
            raise HTTPException(status_code=503, detail="Polly not available")

        return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    """API documentation."""
    return {
        "name": "Identif.ai ML Backend",
        "version": "1.0.0",
        "endpoints": {
            "POST /generate-from-audio": "Audio narration → Face generation",
            "POST /generate-from-text": "Text → Face generation",
            "POST /extract-attributes": "Text → Facial attributes",
            "POST /synthesize-speech": "Text → MP3 speech",
            "GET /health": "Check service health",
        },
        "models": {
            "asr": "OpenAI Whisper (medium)",
            "face_generation": f"StableDiffusion from {HF_REPO}",
            "face_restoration": "GFPGAN v1.4",
            "text_to_speech": "AWS Polly (Neural)",
            "nlp": "spaCy en_core_web_sm",
        },
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
