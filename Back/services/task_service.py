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
        estimated_time: Optional[int] = None
    ) -> Optional[Dict]:
        """
        Procesa una tarea, ajusta la prioridad según la descripción y la materia, genera recordatorios, etc.
        """
        if not task_description:
            print("Descripción de la tarea vacía.")
            return None

        try:
            due_date_dt = datetime.strptime(due_date, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            print("Formato de fecha inválido. Use YYYY-MM-DD HH:MM:SS")
            return None

        # Obtener información de la materia
        subject = await mongodb.get_collection("subjects").find_one({"_id": ObjectId(subject_id)})
        if not subject:
            raise HTTPException(status_code=404, detail="Materia no encontrada")

        subject_priority = subject['credits']  # Ejemplo: la prioridad se basa en los créditos

        # Procesar la descripción de la tarea
        doc = self.nlp(task_description)
        keywords = self.extract_keywords(doc)
        task_type = self.classify_task_type(task_description)

        # Ajustar la prioridad de la tarea según la descripción y la materia
        adjusted_priority = self.task_prioritizer.adjust_priority(task_description, subject_priority)

        # Detectar si hay palabras clave urgentes
        urgent_keywords_detected = any(keyword in task_description.lower() for keyword in URGENT_KEYWORDS)

        # Calcular nivel de insistencia
        insistence_level = self.task_scheduler.calculate_insistence_level(adjusted_priority, due_date_dt, urgent_keywords_detected)

        # Generar recordatorios
        reminders = self.task_scheduler.generate_advanced_reminders(task_description, adjusted_priority, due_date_dt, insistence_level, task_type)

        # Guardar la tarea en la base de datos
        task_data = {
            "user_id": user_id,
            "subject_id": subject_id,
            "description": task_description,
            "due_date": due_date_dt,
            "completed": False,
            "task_type": task_type,
            "priority": adjusted_priority,
            "estimated_time": estimated_time
        }
        task_id = await mongodb.get_collection("tasks").insert_one(task_data)

        # Guardar cada recordatorio en la colección de recordatorios
        for reminder_date in reminders:
            reminder_data = {
                "user_id": user_id,
                "task_id": str(task_id.inserted_id),
                "reminder_date": reminder_date,
                "status": "pendiente",
                "priority": adjusted_priority,
                "insistence_level": insistence_level
            }
            await mongodb.get_collection("reminders").insert_one(reminder_data)

        return {
            "task_id": str(task_id.inserted_id),
            "keywords": keywords,
            "adjusted_priority": adjusted_priority,
            "insistence_level": insistence_level,
            "task_type": task_type,
            "reminders": reminders
        }

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
