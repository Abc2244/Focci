from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class Task(BaseModel):
    user_id: str
    subject_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: datetime
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_date: Optional[datetime] = None