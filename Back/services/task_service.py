import spacy
import nltk
from nltk.corpus import stopwords
from datetime import datetime
from typing import Dict, Optional
from services.task_prioritizer_service import TaskPrioritizer
from services.task_scheduler_service import TaskScheduler

nltk.download('punkt')
nltk.download('stopwords')

# Palabras clave que se consideran urgentes
URGENT_KEYWORDS = ['urgente', 'importante', 'crítico', 'prioridad']

class TaskService:
    def __init__(self):
        # Cargar modelos de procesamiento de lenguaje natural y servicios de priorización y recordatorios
        self.nlp = spacy.load('es_core_news_sm')
        self.stop_words = set(stopwords.words('spanish'))
        self.tasks: Dict[int, Dict] = {}
        self.task_prioritizer = TaskPrioritizer()
        self.task_scheduler = TaskScheduler()

    def process_task(self, task_description: str, subject_priority: int, due_date: str) -> Optional[Dict]:
        """
        Procesa una tarea, ajusta la prioridad según la descripción, calcula el nivel de insistencia y genera recordatorios.
        """
        if not task_description:
            print("Descripción de la tarea vacía.")
            return None

        # Verificar formato de fecha
        try:
            due_date_dt = datetime.strptime(due_date, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            print("Formato de fecha inválido. Use YYYY-MM-DD HH:MM:SS")
            return None

        # Procesar la descripción de la tarea con spaCy para análisis de texto
        doc = self.nlp(task_description)
        keywords = self.extract_keywords(doc)
        task_type = self.classify_task_type(task_description)
        
        # Ajustar la prioridad de la tarea según palabras clave detectadas
        adjusted_priority = self.task_prioritizer.adjust_priority(task_description, subject_priority)
        
        # Detectar si hay palabras clave urgentes en la tarea
        urgent_keywords_detected = any(keyword in task_description.lower() for keyword in URGENT_KEYWORDS)

        # Calcular el nivel de insistencia basado en prioridad, urgencia y fecha límite
        insistence_level = self.task_scheduler.calculate_insistence_level(adjusted_priority, due_date_dt, urgent_keywords_detected)

        # Generar los recordatorios basados en la descripción, prioridad ajustada, fecha límite y nivel de insistencia
        reminders = self.task_scheduler.generate_advanced_reminders(task_description, adjusted_priority, due_date_dt, insistence_level, task_type)

        # Registrar la tarea y devolver los detalles
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
            "insistence_level": insistence_level,
            "task_type": task_type,
            "reminders": reminders
        }

    def extract_keywords(self, doc) -> list:
        """
        Extrae palabras clave eliminando stopwords y puntuación.
        """
        return [token.text for token in doc if not token.is_stop and not token.is_punct]

    def classify_task_type(self, task_description: str) -> str:
        """
        Clasifica la tarea en examen, proyecto, lectura u otra categoría general.
        """
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
        """
        Marca una tarea como completada y elimina los recordatorios asociados.
        """
        if task_id in self.tasks:
            self.tasks[task_id]['completed'] = True
            self.tasks[task_id]['reminders'] = []  # Eliminar los recordatorios asociados
            return f"Tarea {task_id} marcada como completada y recordatorios eliminados."
        return f"Tarea {task_id} no encontrada."
