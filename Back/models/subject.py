from pydantic import BaseModel
from typing import List

class Subject(BaseModel):
    name: str
    credits: int
    schedule: List[str]  # Días de la semana que se dicta la materia
