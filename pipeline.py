# ── 3B · Attribute → prompt maps ─────────────────────────────────
# Each key exactly matches your CSV column name.
# Each value maps a CSV label → the SD prompt phrase that produces
# the best photorealistic result for that attribute.

ATTR_TO_PROMPT = {

    # ── Core identity ────────────────────────────────────────────
    "gender": {
        "a male face"  : "man",
        "a female face": "woman",
    },
    "approx_age": {
        "a child face"      : "child, young face, 8 years old",
        "a teenage face"    : "teenager, 16 years old, adolescent",
        "a young adult face": "young adult, mid-twenties",
        "a middle aged face": "middle-aged person, forties",
        "an elderly face"   : "elderly person, seventies, senior, aged",
    },
    "ethnicity_complexion": {
        "an olive skin tone face": "olive skin, South Asian or Mediterranean complexion",
        "a medium skin tone face": "medium brown complexion",
        "a light skin tone face" : "fair skin, light complexion",
        "a dark skin tone face"  : "dark skin, deep brown complexion",
    },
    "facial_expression": {
        "a neutral face"   : "neutral calm expression",
        "a smiling face"   : "gentle natural smile",
        "an angry face"    : "angry stern expression, furrowed brow",
        "a frowning face"  : "frowning, downturned mouth",
        "a surprised face" : "surprised expression, raised eyebrows",
    },

    # ── Face geometry ────────────────────────────────────────────
    "face_shape": {
        "a face with a rectangular shape": "rectangular face shape",
        "a face with a diamond shape"    : "diamond shaped face",
        "a face with an oval shape"      : "oval face",
        "a face with a heart shape"      : "heart shaped face",
        "a face with a round shape"      : "round face",
        "a face with a square shape"     : "square jaw face",
    },
    "jaw_strength": {
        "a face with a strong jawline": "strong defined jawline",
        "a face with a soft jawline"  : "soft rounded jaw",
    },
    "jaw_width": {
        "a face with a wide jaw"  : "wide jaw",
        "a face with a narrow jaw": "narrow jaw",
    },
    "chin_shape": {
        "a face with a pointed chin" : "pointed chin",
        "a face with a rounded chin" : "rounded chin",
        "a face with a receding chin": "receding chin",
        "a face with a double chin"  : "double chin",
    },
    "cheekbones": {
        "a face with high cheekbones": "prominent high cheekbones",
        "a face with flat cheeks"    : "flat cheeks",
        "a face with full cheeks"    : "full cheeks",
        "a face with hollow cheeks"  : "hollow sunken cheeks",
    },
    "forehead_height": {
        "a face with a high forehead"  : "high forehead",
        "a face with a medium forehead": "medium forehead",
        "a face with a low forehead"   : "low forehead",
    },
    "forehead_width": {
        "a face with a wide forehead"  : "wide forehead",
        "a face with a narrow forehead": "narrow forehead",
    },

    # ── Eyes ─────────────────────────────────────────────────────
    "eye_size": {
        "a face with small eyes"       : "small eyes",
        "a face with medium sized eyes": "medium eyes",
        "a face with large eyes"       : "large eyes",
    },
    "eye_shape": {
        "a face with round eyes"        : "round eyes",
        "a face with almond shaped eyes": "almond shaped eyes",
        "a face with narrow eyes"       : "narrow hooded eyes",
    },
    "eye_spacing": {
        "a face with close set eyes": "close set eyes",
        "a face with wide set eyes" : "wide set eyes",
    },
    "eye_tilt": {
        "a face with upward slanted eyes"      : "upward slanted eyes",
        "a face with downward slanted eyes"    : "downward slanted eyes",
        "a face with horizontally aligned eyes": "straight horizontal eyes",
    },
    "eye_color": {
        "brown eyes": "warm brown eyes",
        "blue eyes" : "blue eyes",
        "green eyes": "green eyes",
        "dark eyes" : "dark brown eyes",
        "black eyes": "black eyes",
        "grey eyes" : "grey eyes",
    },

    # ── Nose ─────────────────────────────────────────────────────
    "nose_length": {
        "a face with a short nose"        : "short nose",
        "a face with a medium length nose": "medium length nose",
        "a face with a long nose"         : "long nose",
    },
    "nose_width": {
        "a face with a narrow nose": "narrow nose",
        "a face with a wide nose"  : "wide broad nose",
    },
    "nose_bridge": {
        "a face with a straight nose bridge": "straight nose bridge",
        "a face with a curved nose bridge"  : "curved nose bridge",
        "a face with a flat nose bridge"    : "flat nose bridge",
    },
    "nose_tip": {
        "a face with a pointed nose tip": "pointed nose tip",
        "a face with a round nose tip"  : "round nose tip",
        "a face with a bulbous nose tip": "bulbous nose tip",
    },

    # ── Mouth ────────────────────────────────────────────────────
    "mouth_width": {
        "a face with a narrow mouth": "narrow mouth",
        "a face with a wide mouth"  : "wide mouth",
    },
    "mouth_corners": {
        "a face with upturned mouth corners"  : "upturned mouth corners",
        "a face with downturned mouth corners": "downturned mouth corners",
    },
    "lip_ratio": {
        "a face with a larger upper lip": "fuller upper lip",
        "a face with a larger lower lip": "fuller lower lip",
        "a face with balanced lips"     : "balanced lips",
    },
    "lip_color": {
        "a face with pale lips" : "pale lips",
        "a face with pink lips" : "pink lips",
        "a face with dark lips" : "dark lips",
    },

    # ── Ears ─────────────────────────────────────────────────────
    "ear_size": {
        "a face with small ears": "small ears",
        "a face with large ears": "large ears",
    },
    "ear_position": {
        "a face with protruding ears": "protruding ears",
        "a face with flat ears"      : "flat ears",
    },

    # ── Hair ─────────────────────────────────────────────────────
    "hair_color": {
        "a person with black hair" : "black hair",
        "a person with brown hair" : "brown hair",
        "a person with blonde hair": "blonde hair",
        "a person with red hair"   : "red hair",
        "a person with gray hair"  : "gray hair",
    },
    "hair_length": {
        "a person with short hair" : "short hair",
        "a person with medium hair": "medium length hair",
        "a person with long hair"  : "long hair",
    },
    "hair_texture": {
        "a person with straight hair": "straight hair",
        "a person with wavy hair"    : "wavy hair",
        "a person with curly hair"   : "curly hair",
    },
    "hair_density": {
        "a person with thick hair"  : "thick dense hair",
        "a person with normal hair" : "normal hair",
        "a person with thin hair"   : "thin fine hair",
        "a person with sparse hair" : "thinning sparse hair",
    },
    "hairline": {
        "a person with a receding hairline"   : "receding hairline",
        "a person with a widow's peak hairline": "widows peak hairline",
    },

    # ── Facial hair ──────────────────────────────────────────────
    "facial_hair": {
        "a clean shaven face"   : "clean shaven",
        "a face with stubble"   : "light stubble",
        "a face with a mustache": "mustache",
        "a face with a beard"   : "beard",
        "none"                  : "",
    },
    "beard_style": {
        "a face with a goatee beard": "goatee",
        "a face with a full beard"  : "full beard",
        "none"                      : "",
    },
    "beard_density": {
        "a face with a dense beard"  : "dense thick beard",
        "a face with a sparse beard" : "sparse light beard",
        "a face with a patchy beard" : "patchy beard",
        "none"                       : "",
    },

    # ── Skin ─────────────────────────────────────────────────────
    "skin_texture": {
        "a face with smooth skin"      : "smooth clear skin",
        "a face with rough skin"       : "rough textured skin",
        "a face with acne scars"       : "acne scarred skin",
        "a face with visible pores"    : "visible pores on skin",
    },
    "wrinkles": {
        "visible": "visible wrinkles",
        "none"   : "",
    },

    # ── Distinguishing features ───────────────────────────────────
    "freckles": {
        "a face with freckles"   : "freckles on face",
        "a face without freckles": "",
    },
    "moles": {
        "a face with moles"   : "visible facial moles",
        "a face without moles": "",
    },
    "birthmarks": {
        "a face with birthmarks"   : "visible birthmark on face",
        "a face without birthmarks": "",
    },
    "scars"         : {"yes": "visible facial scar", "no": ""},
    "tattoos"       : {"yes": "face tattoo", "no": ""},
    "facial_injury" : {"yes": "facial injury marks", "no": ""},
    "lazy_eye"      : {"yes": "lazy eye, amblyopia", "no": ""},
    "crooked_nose"  : {"yes": "slightly crooked nose", "no": ""},
    "missing_tooth" : {"yes": "missing tooth visible", "no": ""},
    "piercings"     : {"yes": "facial piercings", "no": ""},
}

# ── Negative prompt — always appended ────────────────────────────
NEGATIVE = (
    # Style blockers — most important
    "cartoon, anime, manga, illustration, painting, drawing, sketch, "
    "3d render, cgi, doll, plastic skin, wax figure, video game, "
    # Quality blockers
    "blurry, out of focus, low quality, low resolution, jpeg artifacts, "
    "watermark, text, logo, signature, username, border, frame, "
    # Anatomy blockers
    "deformed, disfigured, mutated, bad anatomy, extra limbs, "
    "extra fingers, missing fingers, fused fingers, "
    "asymmetric eyes, cross eyed, lazy eye, wall eye, "
    "bad teeth, missing teeth, gums showing, "
    "double face, cloned face, duplicate, "
    # Color / exposure blockers
    "overexposed, underexposed, oversaturated, "
    "unnatural skin color, orange skin, grey skin, green tint, "
    # General quality
    "ugly, disgusting, worst quality, normal quality"
)

print("✅ Attribute maps loaded.")
print(f"   Covers {len(ATTR_TO_PROMPT)} attribute columns from your dataset.")

# ── 3C · Prompt builder function ─────────────────────────────────
# Takes ONE row (dict or pd.Series) → full SD prompt string
# Works with: dataset rows AND ASR extract_attributes() output

def build_prompt(row):
    if hasattr(row, "to_dict"):
        row = row.to_dict()

    parts = []

    # ── Core identity (always first for SD attention) ──────────
    gender = ATTR_TO_PROMPT["gender"].get(str(row.get("gender", "")), "person")
    age    = ATTR_TO_PROMPT["approx_age"].get(str(row.get("approx_age", "")), "adult")
    parts.append(f"RAW photo, portrait of a {age} {gender}")

    # ── Ethnicity ───────────────────────────────────────────────
    eth = ATTR_TO_PROMPT["ethnicity_complexion"].get(
        str(row.get("ethnicity_complexion", "")), ""
    )
    if eth: parts.append(eth)

    # ── Expression ──────────────────────────────────────────────
    expr = ATTR_TO_PROMPT["facial_expression"].get(
        str(row.get("facial_expression", "")), "neutral expression"
    )
    parts.append(expr)

    # ── Face geometry ───────────────────────────────────────────
    for col in ["face_shape","jaw_strength","jaw_width","chin_shape",
                "cheekbones","forehead_height","forehead_width"]:
        val = ATTR_TO_PROMPT.get(col, {}).get(str(row.get(col, "")), "")
        if val: parts.append(val)

    # ── Eyes ────────────────────────────────────────────────────
    for col in ["eye_size","eye_shape","eye_spacing","eye_tilt","eye_color"]:
        val = ATTR_TO_PROMPT.get(col, {}).get(str(row.get(col, "")), "")
        if val: parts.append(val)

    # ── Nose ────────────────────────────────────────────────────
    for col in ["nose_length","nose_width","nose_bridge","nose_tip"]:
        val = ATTR_TO_PROMPT.get(col, {}).get(str(row.get(col, "")), "")
        if val: parts.append(val)

    # ── Mouth ───────────────────────────────────────────────────
    for col in ["mouth_width","mouth_corners","lip_ratio","lip_color"]:
        val = ATTR_TO_PROMPT.get(col, {}).get(str(row.get(col, "")), "")
        if val: parts.append(val)

    # ── Ears ────────────────────────────────────────────────────
    for col in ["ear_size","ear_position"]:
        val = ATTR_TO_PROMPT.get(col, {}).get(str(row.get(col, "")), "")
        if val: parts.append(val)

    # ── Hair ────────────────────────────────────────────────────
    h_color   = ATTR_TO_PROMPT["hair_color"].get(str(row.get("hair_color","")), "")
    h_length  = ATTR_TO_PROMPT["hair_length"].get(str(row.get("hair_length","")), "")
    h_texture = ATTR_TO_PROMPT["hair_texture"].get(str(row.get("hair_texture","")), "")
    h_density = ATTR_TO_PROMPT["hair_density"].get(str(row.get("hair_density","")), "")
    hair_str  = " ".join(filter(None, [h_length, h_texture, h_color, h_density])).strip()
    if hair_str: parts.append(hair_str)

    hairline = ATTR_TO_PROMPT["hairline"].get(str(row.get("hairline","")), "")
    if hairline: parts.append(hairline)

    # ── Facial hair (only if not blocked by rule) ────────────────
    if row.get("allow_beard", True):
        for col in ["facial_hair","beard_style","beard_density"]:
            val = ATTR_TO_PROMPT.get(col, {}).get(str(row.get(col, "")), "")
            if val: parts.append(val)

    # ── Skin ────────────────────────────────────────────────────
    for col in ["skin_texture","wrinkles"]:
        val = ATTR_TO_PROMPT.get(col, {}).get(str(row.get(col, "")), "")
        if val: parts.append(val)

    # ── Distinguishing / forensic features ──────────────────────
    for col in ["freckles","moles","birthmarks","scars","tattoos",
                "facial_injury","lazy_eye","crooked_nose",
                "missing_tooth","piercings"]:
        val = ATTR_TO_PROMPT.get(col, {}).get(str(row.get(col, "")), "")
        if val: parts.append(val)

    # ── Quality boosters — always last ──────────────────────────
    parts.append(
        "photorealistic, hyperdetailed face, DSLR photo, "
        "85mm portrait lens, professional studio lighting, "
        "sharp focus on face, skin pore detail, "
        "subsurface scattering, natural skin texture, "
        "8k uhd, high resolution, masterpiece"
    )

    return ", ".join(p for p in parts if p.strip())


# ── Quick test on first dataset row ──────────────────────────────
sample_row    = original_df.iloc[0]
sample_prompt = build_prompt(sample_row)
print("Sample prompt:")
print(sample_prompt)
print(f"\nLength: {len(sample_prompt)} chars  |  Parts: {sample_prompt.count(',')}")

# ── 4C · Your attribute_keywords dict (unchanged from ASR) ───────

attribute_keywords = {
    "gender": ["a male face", "a female face"],
    "approx_age": [
        "a child face", "a teenage face", "a young adult face",
        "a middle aged face", "an elderly face"
    ],
    "ethnicity_complexion": [
        "a light skin tone face", "a medium skin tone face",
        "a dark skin tone face", "an olive skin tone face"
    ],
    "skin_tone": ["fair skin", "medium skin", "dark skin", "olive skin"],
    "facial_expression": [
        "a smiling face", "a neutral face", "a frowning face",
        "a surprised face", "an angry face"
    ],
    "clothing" : ["casual clothing", "formal clothing"],
    "face_shape": [
        "a face with an oval shape", "a face with a round shape",
        "a face with a square shape", "a face with a rectangular shape",
        "a face with a heart shape", "a face with a diamond shape"
    ],
    "jaw_strength"  : ["a face with a strong jawline", "a face with a soft jawline"],
    "jaw_width"     : ["a face with a wide jaw", "a face with a narrow jaw"],
    "chin_shape"    : [
        "a face with a pointed chin", "a face with a rounded chin",
        "a face with a receding chin", "a face with a double chin"
    ],
    "cheekbones"    : [
        "a face with high cheekbones", "a face with flat cheeks",
        "a face with full cheeks", "a face with hollow cheeks"
    ],
    "eye_size"  : [
        "a face with small eyes", "a face with medium sized eyes",
        "a face with large eyes"
    ],
    "eye_shape" : [
        "a face with round eyes", "a face with almond shaped eyes",
        "a face with narrow eyes"
    ],
    "eye_spacing": ["a face with close set eyes", "a face with wide set eyes"],
    "eye_tilt"   : [
        "a face with upward slanted eyes", "a face with downward slanted eyes",
        "a face with horizontally aligned eyes"
    ],
    "nose_length" : [
        "a face with a short nose", "a face with a medium length nose",
        "a face with a long nose"
    ],
    "nose_width"  : ["a face with a narrow nose", "a face with a wide nose"],
    "nose_bridge" : [
        "a face with a straight nose bridge", "a face with a curved nose bridge",
        "a face with a flat nose bridge"
    ],
    "nose_tip"    : [
        "a face with a pointed nose tip", "a face with a round nose tip",
        "a face with a bulbous nose tip"
    ],
    "mouth_width"   : ["a face with a narrow mouth", "a face with a wide mouth"],
    "mouth_corners" : [
        "a face with upturned mouth corners",
        "a face with downturned mouth corners"
    ],
    "lip_ratio"     : [
        "a face with a larger upper lip", "a face with a larger lower lip",
        "a face with balanced lips"
    ],
    "ear_size"      : ["a face with small ears", "a face with large ears"],
    "ear_position"  : ["a face with protruding ears", "a face with flat ears"],
    "earlobes"      : ["a face with attached earlobes", "a face with detached earlobes"],
    "forehead_height": [
        "a face with a high forehead", "a face with a medium forehead",
        "a face with a low forehead"
    ],
    "forehead_width": ["a face with a wide forehead", "a face with a narrow forehead"],
    "hair_color"    : [
        "a person with black hair", "a person with brown hair",
        "a person with blonde hair", "a person with red hair",
        "a person with gray hair"
    ],
    "hair_length"   : [
        "a person with short hair", "a person with medium hair",
        "a person with long hair"
    ],
    "hair_texture"  : [
        "a person with straight hair", "a person with wavy hair",
        "a person with curly hair"
    ],
    "hair_density"  : [
        "a person with thick hair", "a person with normal hair",
        "a person with thin hair", "a person with sparse hair"
    ],
    "hair_parting"  : [
        "a person with a middle part hairstyle",
        "a person with a side part hairstyle"
    ],
    "hairline"      : [
        "a person with a receding hairline",
        "a person with a widow's peak hairline"
    ],
    "facial_hair"   : [
        "a clean shaven face", "a face with stubble",
        "a face with a mustache", "a face with a beard", "none"
    ],
    "beard_style"   : ["a face with a goatee beard", "a face with a full beard", "none"],
    "beard_density" : [
        "a face with a dense beard", "a face with a sparse beard",
        "a face with a patchy beard", "none"
    ],
    "eye_color"     : [
        "brown eyes", "blue eyes", "green eyes", "dark eyes", "black eyes", "grey eyes"
    ],
    "sideburns"     : ["none", "short", "long"],
    "lip_color"     : [
        "a face with pale lips", "a face with pink lips", "a face with dark lips"
    ],
    "skin_texture"  : [
        "a face with smooth skin", "a face with rough skin",
        "a face with acne scars", "a face with visible pores"
    ],
    "wrinkles"      : ["a face with visible wrinkles", "a face with smooth skin"],
    "freckles"      : ["a face with freckles", "a face without freckles"],
    "moles"         : ["a face with moles", "a face without moles"],
    "birthmarks"    : ["a face with birthmarks", "a face without birthmarks"],
    "scars"         : ["yes", "no"],
    "tattoos"       : ["yes", "no"],
    "facial_injury" : ["yes", "no"],
    "lazy_eye"      : ["yes", "no"],
    "crooked_nose"  : ["yes", "no"],
    "missing_tooth" : ["yes", "no"],
    "piercings"     : ["yes", "no"],
}
print(f"✅ attribute_keywords loaded — {len(attribute_keywords)} attributes")

# ── 4D · Your extract_attributes function (unchanged from ASR) ───

def _normalize_text_for_matching(value):
    value = (value or "").lower()
    value = value.replace("'", "")
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value

def extract_attributes(text):
    safe_text  = text or ""
    cleaned    = clean_text(safe_text)
    normalized = _normalize_text_for_matching(cleaned)

    attributes = {key: None for key in attribute_keywords.keys()}

    # Phrase-first matching
    for attr, values in attribute_keywords.items():
        for phrase in values:
            norm_phrase = _normalize_text_for_matching(phrase)
            if norm_phrase and norm_phrase in normalized:
                attributes[attr] = phrase
                break

    # spaCy token fallback
    doc = nlp(cleaned)
    token_set = {_normalize_text_for_matching(t.text)  for t in doc if not t.is_space}
    token_set |= {_normalize_text_for_matching(t.lemma_) for t in doc if not t.is_space}

    stop_tokens = {"a","an","the","with","without","face","person","of","and","to","in"}

    for attr, values in attribute_keywords.items():
        if attributes[attr] is not None:
            continue
        for phrase in values:
            norm_phrase   = _normalize_text_for_matching(phrase)
            phrase_tokens = [t for t in norm_phrase.split() if t and t not in stop_tokens]
            if phrase_tokens and all(tok in token_set for tok in phrase_tokens):
                attributes[attr] = phrase
                break

    return attributes

print("✅ extract_attributes() ready")
# ── 4B · Your audio processing functions (unchanged from ASR) ────

def preprocess_audio(input_file):
    audio, sr = librosa.load(input_file, sr=16000)
    peak = np.max(np.abs(audio))
    if peak > 0:
        audio = audio / peak
    output_file = "clean_audio.wav"
    sf.write(output_file, audio, sr)
    return output_file

def speech_to_text(audio_path):
    print("Transcribing audio...")
    audio, _ = librosa.load(audio_path, sr=16000, mono=True)
    result = whisper_model.transcribe(audio, language="en")
    return result["text"].strip()

def clean_text(text):
    text = text.lower()
    text = text.replace(",", "").replace(".", "")
    return text
