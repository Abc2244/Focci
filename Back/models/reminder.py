from pydantic import BaseModel
from datetime import datetime

class Reminder(BaseModel):
    user_id: str  # ID del usuario
    task_id: str  # ID de la tarea
    reminder_date: datetime
    status: str  # Estado (pendiente, completado, etc.)
