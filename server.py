"""
PromptLens OCR Backend
FastAPI server using system Tesseract OCR (no internet downloads needed)
"""
import os
import io
import base64
import json
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

# Add Tesseract to PATH
TESSERACT_BIN = r"C:\Program Files\Tesseract-OCR"
os.environ["PATH"] = TESSERACT_BIN + os.pathsep + os.environ.get("PATH", "")

TESSERACT_EXE = os.path.join(TESSERACT_BIN, "tesseract.exe")

import pytesseract
pytesseract.pytesseract.tesseract_cmd = TESSERACT_EXE

app = FastAPI(
    title="PromptLens OCR API",
    description="Local OCR using system Tesseract — fast, no internet needed",
)

# Allow CORS for Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LIBRARY_FILE = Path(__file__).parent / "library.json"


def load_library():
    if LIBRARY_FILE.exists():
        with open(LIBRARY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_library(data):
    with open(LIBRARY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def make_thumbnail(image_data: str) -> str:
    """Convert a data URL or raw base64 image to a centered 200x200 thumbnail."""
    try:
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]
        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes))

        # Resize to fit within 200x200 without cropping
        img.thumbnail((200, 200), Image.LANCZOS)

        # Center on white canvas
        canvas = Image.new("RGB", (200, 200), (255, 255, 255))
        x = (200 - img.width) // 2
        y = (200 - img.height) // 2
        canvas.paste(img, (x, y))

        buf = io.BytesIO()
        canvas.save(buf, format="JPEG", quality=75)
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    except Exception:
        return ""


@app.get("/")
async def root():
    return {"status": "ok", "service": "PromptLens OCR", "version": "1.0.0"}


@app.post("/ocr")
async def ocr_image(file: UploadFile = File(...)):
    """Accept image, return full plain text + JSON."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # Convert to RGB if needed
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")

        # OCR — full text, no truncation
        text = pytesseract.image_to_string(
            image,
            lang="eng+ara",
            config="--psm 3"
        ).strip()

        # Get confidence
        try:
            data = pytesseract.image_to_data(
                image,
                lang="eng+ara",
                output_type=pytesseract.Output.DICT
            )
            conf_key = "conf" if "conf" in data else "word_conf"
            if conf_key in data:
                confidences = [c for c in data[conf_key] if isinstance(c, (int, float)) and c > 0]
                avg_confidence = sum(confidences) / len(confidences) / 100 if confidences else 0.5
            else:
                avg_confidence = 0.5
        except Exception:
            avg_confidence = 0.5

        # Detect dominant language
        arabic_chars = sum(1 for c in text if "\u0600" <= c <= "\u06FF")
        total_chars = len(text.replace(" ", "").replace("\n", ""))
        lang = "ara" if total_chars > 0 and arabic_chars / total_chars > 0.3 else "eng"

        return JSONResponse({
            "text": text,
            "language": lang,
            "confidence": round(avg_confidence, 3),
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")


@app.post("/save")
async def save_prompt(data: dict):
    """Save a new prompt to the library."""
    library = load_library()

    # Generate thumbnail
    raw_image = data.get("imageThumbnail", "") or data.get("imageBase64", "")
    thumbnail = make_thumbnail(raw_image) if raw_image else ""

    entry = {
        "id": data.get("id", ""),
        "plainText": data.get("plainText", ""),
        "jsonText": data.get("jsonText", ""),
        "imageThumbnail": thumbnail,
        "language": data.get("language", "unknown"),
        "confidence": data.get("confidence", 0),
        "createdAt": data.get("createdAt", datetime.now().isoformat()),
    }

    # Remove old entry with same id if exists
    library = [p for p in library if p.get("id") != entry["id"]]
    library.insert(0, entry)
    save_library(library)

    return {"status": "saved", "id": entry["id"]}


@app.put("/library/{prompt_id}")
async def update_prompt(prompt_id: str, data: dict):
    """Update an existing prompt — text and/or image."""
    library = load_library()

    # Find existing entry
    idx = None
    for i, p in enumerate(library):
        if p.get("id") == prompt_id:
            idx = i
            break

    if idx is None:
        raise HTTPException(status_code=404, detail="Prompt not found")

    existing = library[idx]

    # Regenerate thumbnail if image changed
    new_image = data.get("imageThumbnail", "") or data.get("imageBase64", "")
    if new_image:
        thumbnail = make_thumbnail(new_image)
    else:
        thumbnail = existing.get("imageThumbnail", "")

    updated = {
        "id": prompt_id,
        "plainText": data.get("plainText", existing.get("plainText", "")),
        "jsonText": data.get("jsonText", existing.get("jsonText", "")),
        "imageThumbnail": thumbnail,
        "language": data.get("language", existing.get("language", "unknown")),
        "confidence": data.get("confidence", existing.get("confidence", 0)),
        "createdAt": existing.get("createdAt"),
        "updatedAt": datetime.now().isoformat(),
    }

    library[idx] = updated
    save_library(library)

    return {"status": "updated", "prompt": updated}


@app.get("/library/{prompt_id}")
async def get_prompt(prompt_id: str):
    """Get a single prompt by ID."""
    library = load_library()
    for p in library:
        if p.get("id") == prompt_id:
            return JSONResponse(p)
    raise HTTPException(status_code=404, detail="Prompt not found")


@app.get("/library")
async def get_library():
    """Get all saved prompts."""
    return JSONResponse(load_library())


@app.delete("/library/{prompt_id}")
async def delete_prompt(prompt_id: str):
    """Delete a prompt by ID."""
    library = load_library()
    original_len = len(library)
    library = [p for p in library if p.get("id") != prompt_id]

    if len(library) == original_len:
        raise HTTPException(status_code=404, detail="Prompt not found")

    save_library(library)
    return {"status": "deleted"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3457, reload=False)
