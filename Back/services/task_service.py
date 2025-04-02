from fastapi import HTTPException
import spacy
import nltk
from nltk.corpus import stopwords
from datetime import datetime
from typing import Dict, Optional
from services.task_prioritizer_service import TaskPrioritizer
from services.task_scheduler_service import TaskScheduler
from config.database import mongodb
from bson import ObjectId

nltk.download('punkt')
nltk.download('stopwords')

URGENT_KEYWORDS = ['urgente', 'importante', 'crítico', 'prioridad']

class TaskService:
    def __init__(self):
        self.nlp = spacy.load('es_core_news_sm')
        self.stop_words = set(stopwords.words('spanish'))
        self.tasks: Dict[int, Dict] = {}
        self.task_prioritizer = TaskPrioritizer()
        self.task_scheduler = TaskScheduler()


    async def process_task(
        self,
        user_id: str,
        subject_id: str,
        task_description: str,
        due_date: str,
        estimated_time: Optional[int] = 30
    ) -> dict:
        try:
            # Validar que el usuario y la materia existan
            user = await mongodb.get_collection("users").find_one({"_id": ObjectId(user_id)})
            subject = await mongodb.get_collection("subjects").find_one({"_id": ObjectId(subject_id)})
            
            if not user or not subject:
                raise ValueError("Usuario o materia no encontrados")

            # Crear la tarea base
            task_data = {
                "user_id": user_id,
                "subject_id": subject_id,
                "description": task_description,
                "due_date": due_date,
                "estimated_time": estimated_time,
                "completed": False,
                "created_at": datetime.utcnow().isoformat(),
                "task_type": "general",
                "priority": 1,
                "reminders": []
            }

            # Insertar la tarea en la base de datos
            result = await mongodb.get_collection("tasks").insert_one(task_data)
            
            if not result.inserted_id:
                raise ValueError("Error al insertar la tarea en la base de datos")

            # Determinar el tipo de tarea y prioridad basado en la descripción
            task_type = self._determine_task_type(task_description)
            priority = self._calculate_priority(task_description, estimated_time)
            
            # Actualizar la tarea con el tipo y prioridad calculados
            await mongodb.get_collection("tasks").update_one(
                {"_id": result.inserted_id},
                {
                    "$set": {
                        "task_type": task_type,
                        "priority": priority
                    }
                }
            )

            return {
                "task_id": result.inserted_id,
                "task_type": task_type,
                "adjusted_priority": priority,
                "reminders": []
            }

        except Exception as e:
            print(f"Error en process_task: {str(e)}")
            raise ValueError(f"Error al procesar la tarea: {str(e)}")

    def _determine_task_type(self, description: str) -> str:
        description_lower = description.lower()
        if any(word in description_lower for word in ["examen", "prueba", "test"]):
            return "examen"
        elif any(word in description_lower for word in ["proyecto", "trabajo"]):
            return "proyecto"
        elif any(word in description_lower for word in ["leer", "lectura"]):
            return "lectura"
        return "general"

    def _calculate_priority(self, description: str, estimated_time: int) -> int:
        # Lógica simple de prioridad basada en tiempo estimado
        if estimated_time > 120:
            return 5
        elif estimated_time > 90:
            return 4
        elif estimated_time > 60:
            return 3
        elif estimated_time > 30:
            return 2
        return 1

    def extract_keywords(self, doc) -> list:
        return [token.text for token in doc if not token.is_stop and not token.is_punct]

    def classify_task_type(self, task_description: str) -> str:
        exam_keywords = ['examen', 'prueba', 'evaluación']
        project_keywords = ['proyecto', 'tarea', 'trabajo']
        reading_keywords = ['lectura', 'libro', 'capítulo', 'artículo']

        doc = self.nlp(task_description.lower())

        if any(token.text in exam_keywords for token in doc):
            return "examen"
        elif any(token.text in project_keywords for token in doc):
            return "proyecto"
        elif any(token.text in reading_keywords for token in doc):
            return "lectura"
        return "general"
