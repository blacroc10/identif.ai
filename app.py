from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import io, shutil, os, torch, numpy as np, whisper, librosa, soundfile as sf
import spacy, re
from PIL import Image
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler, AutoencoderKL
from gfpgan import GFPGANer

app = FastAPI(title="Forensic Face Generation API")

# Allow your frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # replace * with your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load models at startup (runs once) ───────────────────────────
print("Loading models...")

vae = AutoencoderKL.from_pretrained("stabilityai/sd-vae-ft-mse", torch_dtype=torch.float16)
pipe = StableDiffusionPipeline.from_pretrained(
    "SG161222/Realistic_Vision_V5.1_noVAE",
    vae=vae, torch_dtype=torch.float16,
    safety_checker=None, requires_safety_checker=False,
)
pipe.scheduler = DPMSolverMultistepScheduler.from_config(
    pipe.scheduler.config, use_karras_sigmas=True, algorithm_type="dpmsolver++"
)
pipe = pipe.to("cuda")
pipe.enable_xformers_memory_efficient_attention()

whisper_model = whisper.load_model("medium")
nlp           = spacy.load("en_core_web_sm")
restorer      = GFPGANer(
    model_path="https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth",
    upscale=1, arch="clean", channel_multiplier=2, bg_upsampler=None
)

print("All models loaded. API ready.")

# ── Import your pipeline functions (from this notebook exported) ──
# from pipeline import build_prompt, extract_attributes, NEGATIVE, ATTR_TO_PROMPT, attribute_keywords, clean_text, _normalize_text_for_matching

@app.post("/generate")
async def generate(audio: UploadFile = File(...)):
    # Save uploaded audio temporarily
    tmp_path = f"/tmp/{audio.filename}"
    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    # ASR
    wav, _ = librosa.load(tmp_path, sr=16000, mono=True)
    result = whisper_model.transcribe(wav, language="en")
    text   = clean_text(result["text"])
    attrs  = extract_attributes(text)

    # Generate
    prompt    = build_prompt(attrs)
    generator = torch.Generator("cuda").manual_seed(42)
    with torch.autocast("cuda"):
        image = pipe(
            prompt=prompt, negative_prompt=NEGATIVE,
            generator=generator,
            num_inference_steps=35, guidance_scale=7.5,
            height=512, width=512,
        ).images[0]

    # GFPGAN restore
    img_bgr = np.array(image)[:, :, ::-1]
    _, _, restored = restorer.enhance(img_bgr, has_aligned=False,
                                       only_center_face=True, paste_back=True)
    image = Image.fromarray(restored[:, :, ::-1])

    # Return image
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    buf.seek(0)

    os.remove(tmp_path)
    return StreamingResponse(buf, media_type="image/png")


@app.get("/health")
async def health():
    return {"status": "ok", "gpu": torch.cuda.get_device_name(0)}