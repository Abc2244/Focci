from fastapi import HTTPException
import spacy
import nltk
from nltk.corpus import stopwords
from datetime import datetime, timezone
from typing import Dict, Optional
from services.task_prioritizer_service import TaskPrioritizer
from services.task_scheduler_service import TaskScheduler
from config.database import mongodb
from bson import ObjectId
from bson.errors import InvalidId

nltk.download('punkt')
nltk.download('stopwords')

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
            # Validar ObjectId
            try:
                user_id = ObjectId(user_id)
                subject_id = ObjectId(subject_id)
            except InvalidId:
                raise ValueError("ID de usuario o materia no válido")

            # Validar que el usuario y la materia existan
            user = await mongodb.get_collection("users").find_one({"_id": user_id})
            subject = await mongodb.get_collection("subjects").find_one({"_id": subject_id})
            
            if not user or not subject:
                raise ValueError("Usuario o materia no encontrados")

            # Determinar el tipo de tarea
            task_type = self._determine_task_type(task_description)
            
            # Calcular prioridad usando TaskPrioritizer
            base_priority = self.task_prioritizer.adjust_priority(
                task_description,
                subject_priority=subject.get('priority', 1)
            )
            
            # Ajustar prioridad final
            final_priority = self._adjust_priority_by_type_and_time(
                base_priority,
                task_type,
                estimated_time
            )

            # Procesar la fecha
            try:
                if isinstance(due_date, str):
                    due_date_dt = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                else:
                    due_date_dt = due_date

                if due_date_dt.tzinfo is None:
                    due_date_dt = due_date_dt.replace(tzinfo=timezone.utc)
            except Exception as e:
                raise ValueError(f"Error al procesar la fecha: {str(e)}")

            # Calcular nivel de insistencia
            urgent_keywords_detected = any(keyword in task_description.lower() for keyword in ["urgente", "importante", "crítico"])
            insistence_level = self.task_scheduler.calculate_insistence_level(
                final_priority,
                due_date_dt,
                urgent_keywords_detected
            )

            # Generar recordatorios
            reminders = self.task_scheduler.generate_advanced_reminders(
                task_description,
                final_priority,
                due_date_dt,
                insistence_level,
                task_type
            )

            # Crear el documento de la tarea
            task_data = {
                "user_id": str(user_id),
                "subject_id": str(subject_id),
                "description": task_description,
                "due_date": due_date_dt.isoformat(),
                "estimated_time": estimated_time,
                "completed": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "task_type": task_type,
                "priority": final_priority,
                "insistence_level": insistence_level,
                "reminders": reminders
            }

            # Insertar la tarea en la base de datos
            result = await mongodb.get_collection("tasks").insert_one(task_data)

            return {
                "task_id": result.inserted_id,
                "task_type": task_type,
                "adjusted_priority": final_priority,
                "insistence_level": insistence_level,
                "reminders": reminders
            }

        except ValueError as ve:
            raise ValueError(f"Error al procesar la tarea: {str(ve)}")
        except Exception as e:
            print(f"Error en process_task: {str(e)}")
            raise ValueError(f"Error al procesar la tarea: {str(e)}")

    def _determine_task_type(self, description: str) -> str:
        description_lower = description.lower()
        if any(word in description_lower for word in ["examen", "prueba", "test", "evaluación","parcial","quiz"]):
            return "examen"
        elif any(word in description_lower for word in ["proyecto", "trabajo", "investigación"]):
            return "proyecto"
        elif any(word in description_lower for word in ["leer", "lectura", "libro", "artículo"]):
            return "lectura"
        return "general"

    def _adjust_priority_by_type_and_time(self, base_priority: int, task_type: str, estimated_time: int) -> int:
        # Ajustar prioridad según el tipo de tarea
        type_priority_boost = {
            "examen": 2,
            "proyecto": 1,
            "lectura": 0,
            "general": 0
        }
        
        # Ajustar prioridad según tiempo estimado
        time_priority_boost = 0
        if estimated_time >= 120:
            time_priority_boost = 2
        elif estimated_time > 90:
            time_priority_boost = 1
        
        # Calcular prioridad final
        final_priority = base_priority + type_priority_boost.get(task_type, 0) + time_priority_boost
        
        # Asegurar que la prioridad esté entre 1 y 5
        return max(1, min(5, final_priority))

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
