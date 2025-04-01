from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Task(BaseModel):
    user_id: str  # ID del usuario
    subject_id: str  # ID de la materia
    description: str  # Descripción de la tarea
    due_date: str  # Fecha de entrega
    completed: bool = False  # Estado de la tarea
    completed_date: Optional[str] = None
    estimated_time: Optional[int] = None
    task_type: Optional[str] = None
    priority: Optional[int] = None
    reminders: Optional[list] = None
