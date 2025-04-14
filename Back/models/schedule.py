from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ScheduleItem(BaseModel):
    user_id: str
    title: str
    startTime: str
    endTime: str
    day: str
    type: str = Field(..., description="Tipo: 'class', 'activity', 'personal'")
    location: Optional[str] = None
    color: Optional[str] = None
    repeat: Optional[bool] = False
    subject_id: Optional[str] = None 