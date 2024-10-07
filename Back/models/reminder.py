from pydantic import BaseModel
from datetime import datetime

class Reminder(BaseModel):
    user_id: str  # ID del usuario
    task_id: str  # ID de la tarea
    reminder_date: datetime
    status: str  # Estado (pendiente, completado, etc.)
    priority: int  # Prioridad del recordatorio, 1-5
    insistence_level: int = 0  # Nivel de insistencia, puede incrementarse según la urgencia
