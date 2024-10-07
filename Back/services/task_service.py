import spacy
import nltk
from nltk.corpus import stopwords
from datetime import datetime
from typing import Dict, Optional
from services.task_prioritizer_service import TaskPrioritizer
from services.task_scheduler_service import TaskScheduler

nltk.download('punkt')
nltk.download('stopwords')

class TaskService:
    def __init__(self):
        self.nlp = spacy.load('es_core_news_sm')
        self.stop_words = set(stopwords.words('spanish'))
        self.tasks: Dict[int, Dict] = {}
        self.task_prioritizer = TaskPrioritizer()
        self.task_scheduler = TaskScheduler()

    def process_task(self, task_description: str, subject_priority: int, due_date: str) -> Optional[Dict]:
        if not task_description:
            print("Descripción de la tarea vacía.")
            return None

        try:
            due_date_dt = datetime.strptime(due_date, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            print("Formato de fecha inválido. Use YYYY-MM-DD HH:MM:SS")
            return None

        doc = self.nlp(task_description)
        keywords = self.extract_keywords(doc)
        task_type = self.classify_task_type(task_description)
        adjusted_priority = self.task_prioritizer.adjust_priority(task_description, subject_priority)
        reminders = self.task_scheduler.generate_advanced_reminders(task_description, adjusted_priority, due_date_dt, task_type)

        task_id = len(self.tasks) + 1
        self.tasks[task_id] = {
            "description": task_description,
            "reminders": reminders,
            "completed": False
        }

        return {
            "task_id": task_id,
            "keywords": keywords,
            "adjusted_priority": adjusted_priority,
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

    def mark_task_completed(self, task_id: int) -> str:
        if task_id in self.tasks:
            self.tasks[task_id]['completed'] = True
            self.tasks[task_id]['reminders'] = []  # Eliminar recordatorios
            return f"Tarea {task_id} marcada como completada y recordatorios eliminados."
        return f"Tarea {task_id} no encontrada."
