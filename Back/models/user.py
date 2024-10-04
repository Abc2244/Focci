from pydantic import BaseModel, EmailStr
from typing import List

class User(BaseModel):
    username: str
    email: EmailStr
    password: str
    tasks: List[str] = []  # IDs de tareas
    subjects: List[str] = []  # IDs de materias
    reminders: List[str] = []  # IDs de recordatorios
