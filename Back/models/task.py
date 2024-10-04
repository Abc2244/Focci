from pydantic import BaseModel
from datetime import datetime

class Task(BaseModel):
    subject_name: str
    description: str
    due_date: datetime
    difficulty: int  # Clasificado por BERT (0: fácil, 1: intermedio, 2: difícil)
