from pydantic import BaseModel
from typing import List

class ScheduleItem(BaseModel):
    day: str  # Día de la semana (ej. "Lunes", "Martes", etc.)
    time: str  # Hora (ej. "4:00 PM", "8:00 AM", etc.)

class Subject(BaseModel):
    user_id: str  # ID del usuario
    name: str
    credits: int
    schedule: List[ScheduleItem]  # Lista de horarios con día y hora
