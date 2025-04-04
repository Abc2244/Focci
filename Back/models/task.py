from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List

class Task(BaseModel):
    user_id: str  # ID del usuario
    subject_id: str  # ID de la materia
    description: str  # Descripción de la tarea
    due_date: str  # Fecha de entrega
    completed: bool = False  # Estado de la tarea
    completed_date: Optional[str] = None
    estimated_time: Optional[int] = Field(default=30, ge=0)
    task_type: Optional[str] = Field(default="general")
    priority: Optional[int] = Field(default=1, ge=1, le=5)
    reminders: Optional[List[str]] = Field(default_factory=list)

    @validator('due_date')
    def validate_due_date(cls, v):
        try:
            # Intentar parsear la fecha
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except Exception as e:
            raise ValueError(f'Formato de fecha inválido: {str(e)}')

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "subject_id": "subject456",
                "description": "Completar tarea de matemáticas",
                "due_date": "2024-03-20T14:00:00Z",
                "estimated_time": 30
            }
        }
