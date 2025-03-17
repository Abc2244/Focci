from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Task(BaseModel):
    user_id: str  # ID del usuario
    subject_id: str  # ID de la materia
    description: str  # Descripción de la tarea
    due_date: datetime  # Fecha de entrega
    completed: bool = False  # Estado de la tarea
    completed_date: Optional[datetime] = None
