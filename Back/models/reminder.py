from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Reminder(BaseModel):
    user_id: str  # ID del usuario
    task_id: str  # ID de la tarea
    message: Optional[str] = ""  # Campo de mensaje opcional con valor predeterminado vacío
    reminder_date: datetime
    status: str  # Estado (pendiente, completado, etc.)
    priority: int  # Prioridad del recordatorio, 1-5
    insistence_level: int = 0  # Nivel de insistencia, puede incrementarse según la urgencia
    completed_date: Optional[datetime] = None  # Fecha de completado, si aplica
