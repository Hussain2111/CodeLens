from pydantic import BaseModel, Field


class ExtractRequest(BaseModel):
    image: str = Field(..., description="Base64-encoded image, optionally prefixed with a data URL header")


class ExtractResponse(BaseModel):
    code: str
    language: str
