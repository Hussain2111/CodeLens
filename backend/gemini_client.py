import os

from google import genai
from google.genai import types

from models import ExtractResponse

MODEL = "gemini-3.6-flash"

EXTRACTION_PROMPT = (
    "You are given a photo of a screen or document showing source code. "
    "Transcribe the code exactly as written, preserving indentation and line breaks. "
    "Then identify the programming language. "
    "If no code is visible in the image, respond with an empty string for code and "
    "'unknown' for language."
)

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY environment variable is not set")
        _client = genai.Client(api_key=api_key)
    return _client


def extract_code_from_image(image_bytes: bytes, mime_type: str) -> ExtractResponse:
    client = get_client()

    response = client.models.generate_content(
        model=MODEL,
        contents=[
            EXTRACTION_PROMPT,
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_json_schema=ExtractResponse.model_json_schema(),
        ),
    )

    return ExtractResponse.model_validate_json(response.text)
