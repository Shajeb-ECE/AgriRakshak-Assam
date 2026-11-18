from typing import Literal, Optional
from pydantic import BaseModel, Field

class ObservationCreate(BaseModel):
    field_name: str = Field(min_length=1, max_length=100)
    crop: Literal["rice", "tea", "mustard", "other"]
    growth_stage: Literal["nursery", "vegetative", "flowering", "reproductive", "maturity", "unknown"] = "unknown"
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = Field(default=None, ge=0, le=100)
    rainfall_7d_mm: Optional[float] = Field(default=None, ge=0)
    ndvi: Optional[float] = Field(default=None, ge=-1, le=1)
    previous_ndvi: Optional[float] = Field(default=None, ge=-1, le=1)
    notes: Optional[str] = None
