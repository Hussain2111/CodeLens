import base64
import binascii
import os
import re

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from google.genai import errors as genai_errors
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from gemini_client import extract_code_from_image
from models import ExtractRequest, ExtractResponse

load_dotenv()

app = FastAPI(title="Codesnap API")

DEFAULT_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
extra_origins = os.environ.get("FRONTEND_ORIGINS", "")
allow_origins = DEFAULT_ORIGINS + [o.strip() for o in extra_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Two tiers: a global cap protects the shared Gemini free-tier quota (10
# requests/minute, 250/day — see README) from being exhausted no matter how
# many different clients are calling; a per-IP cap stops one caller from
# using up most of that shared daily budget alone.
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def _global_key(request: Request) -> str:
    return "global"


MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8 MB

@app.get("/health")
def health():
    return {
        "status": "ok",
        "message": "codesnap-backend"
    }


DATA_URL_RE = re.compile(r"^data:(?P<mime>[\w/+.-]+);base64,")


def decode_image(data: str) -> tuple[bytes, str]:
    match = DATA_URL_RE.match(data)
    mime_type = match.group("mime") if match else "image/png"
    payload = data[match.end():] if match else data

    try:
        image_bytes = base64.b64decode(payload, validate=True)
    except binascii.Error:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Image data is empty")

    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image is too large (max {MAX_IMAGE_BYTES // (1024 * 1024)}MB)",
        )

    return image_bytes, mime_type


@app.post("/extract", response_model=ExtractResponse)
@limiter.limit("8/minute", key_func=_global_key)
@limiter.limit("20/day")
def extract(request: Request, body: ExtractRequest):
    image_bytes, mime_type = decode_image(body.image)

    try:
        result = extract_code_from_image(image_bytes, mime_type)
    except genai_errors.APIError as e:
        if e.code == 429:
            raise HTTPException(status_code=429, detail="Gemini rate limit exceeded, try again shortly")
        if e.code == 400:
            raise HTTPException(status_code=400, detail=f"Gemini rejected the image: {e.message}")
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e.message}")

    if not result.code.strip():
        raise HTTPException(status_code=422, detail="No code detected in the image")

    return result
