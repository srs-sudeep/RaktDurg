import uuid
from datetime import datetime

from pydantic import BaseModel


class MessageResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list
