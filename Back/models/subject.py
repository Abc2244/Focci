from pydantic import BaseModel
from typing import List

class Subject(BaseModel):
    user_id: str  # ID del usuario
    name: str
    credits: int
    schedule: List[str]  # Días de clase
