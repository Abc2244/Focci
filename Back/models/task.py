from pydantic import BaseModel
from datetime import datetime

class Task(BaseModel):
    user_id: str  # ID del usuario
    subject_id: str  # ID de la materia
    description: str
    due_date: datetime
    difficulty: int  # Dificultad determinada por BERT
