from fastapi import HTTPException
import spacy
import nltk
from nltk.corpus import stopwords
from datetime import datetime, timezone
from typing import Dict, Optional
from services.task_prioritizer_service import TaskPrioritizer
from services.task_scheduler_service import TaskScheduler
from services.task_classifier_service import TaskClassifier
from config.database import mongodb
from bson import ObjectId
from bson.errors import InvalidId
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

nltk.download('punkt')
nltk.download('stopwords')

class TaskService:
    def __init__(self):
        self.nlp = spacy.load('es_core_news_sm')
        self.stop_words = set(stopwords.words('spanish'))
        self.tasks: Dict[int, Dict] = {}
        self.task_prioritizer = TaskPrioritizer()
        self.task_scheduler = TaskScheduler()
        self.task_classifier = TaskClassifier()

    async def initialize(self):
        """Inicializa el servicio y sus dependencias"""
        await self.task_classifier.initialize()
        logger.info("✅ TaskService inicializado correctamente")

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
                user_oid = ObjectId(user_id)
                subject_oid = ObjectId(subject_id)
            except InvalidId:
                raise ValueError("ID de usuario o materia no válido")

            # Validar que el usuario y la materia existan
            user = await mongodb.get_collection("users").find_one({"_id": user_oid})
            subject = await mongodb.get_collection("subjects").find_one({"_id": subject_oid})
            
            if not user or not subject:
                raise ValueError("Usuario o materia no encontrados")

            # Clasificar la tarea usando el nuevo clasificador
            classification_result = await self.task_classifier.classify_task(task_description)
            task_type = classification_result['task_type']
            classification_confidence = classification_result['classification_confidence']
            
            # Calcular prioridad usando TaskPrioritizer
            base_priority = self.task_prioritizer.adjust_priority(
                task_description,
                subject_priority=subject.get('priority', 1)
            )

            # Detectar palabras clave de urgencia en la descripción
            urgency_keywords = ["urgente", "inmediata", "crítico", "crucial", "importante"]
            urgency_boost = 2 if any(keyword in task_description.lower() for keyword in urgency_keywords) else 0
            
            # Ajustar prioridad final considerando la confianza de la clasificación
            confidence_boost = classification_confidence * 0.5
            final_priority = self._adjust_priority_by_type_and_time(
                base_priority + urgency_boost,  # Añadir el boost por urgencia
                task_type,
                estimated_time,
                confidence_boost
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
                "user_id": str(user_oid),
                "subject_id": str(subject_oid),
                "description": task_description,
                "due_date": due_date_dt.isoformat(),
                "estimated_time": estimated_time,
                "completed": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "task_type": task_type,
                "priority": final_priority,
                "insistence_level": insistence_level,
                "reminders": reminders,
                "classification_confidence": classification_confidence,
                "classification_scores": classification_result.get('all_scores', {})
            }

            # Insertar la tarea en la base de datos
            result = await mongodb.get_collection("tasks").insert_one(task_data)
            
            logger.info(f"✅ Tarea creada: {result.inserted_id}")
            logger.info(f"Tipo: {task_type}, Confianza: {classification_confidence:.2f}")

            return {
                "task_id": result.inserted_id,
                "task_type": task_type,
                "adjusted_priority": final_priority,
                "insistence_level": insistence_level,
                "reminders": reminders,
                "classification_confidence": classification_confidence
            }

        except ValueError as ve:
            logger.error(f"❌ Error de validación: {str(ve)}")
            raise ValueError(f"Error al procesar la tarea: {str(ve)}")
        except Exception as e:
            logger.error(f"❌ Error general: {str(e)}")
            raise ValueError(f"Error al procesar la tarea: {str(e)}")

    def _adjust_priority_by_type_and_time(
        self,
        base_priority: int,
        task_type: str,
        estimated_time: int,
        confidence_boost: float = 0.0
    ) -> int:
        # Ajustar prioridad según el tipo de tarea
        type_priority_boost = {
            "examen": 2,
            "proyecto": 1,
            "lectura": 0,
            "general": 0,
            "taller": 1
        }
        
        # Ajustar prioridad según tiempo estimado
        time_priority_boost = 0
        if estimated_time >= 120:
            time_priority_boost = 2
        elif estimated_time > 90:
            time_priority_boost = 1
        
        # Palabras clave de urgencia
        urgency_keywords = ["urgente", "inmediata", "crítico", "crucial", "importante"]
        urgency_boost = 0
        
        # Verificar si hay palabras clave de urgencia en la descripción
        if any(keyword in task_type.lower() for keyword in urgency_keywords):
            urgency_boost = 2
        
        # Calcular prioridad final incluyendo todos los factores
        final_priority = (
            base_priority +
            type_priority_boost.get(task_type, 0) +
            time_priority_boost +
            urgency_boost +
            confidence_boost
        )
        
        # Asegurar que la prioridad esté entre 1 y 5
        return max(1, min(5, int(round(final_priority))))

    def extract_keywords(self, doc) -> list:
        return [token.text for token in doc if not token.is_stop and not token.is_punct]

    def _determine_task_type(self, task_description: str) -> str:
        """Determina el tipo de tarea basado en palabras clave en la descripción."""
        exam_keywords = ['examen', 'prueba', 'evaluación', 'test', 'quiz']
        project_keywords = ['proyecto', 'trabajo', 'desarrollo', 'implementación']
        reading_keywords = ['lectura', 'leer', 'libro', 'capítulo', 'artículo']

        description_lower = task_description.lower()

        if any(keyword in description_lower for keyword in exam_keywords):
            return "examen"
        elif any(keyword in description_lower for keyword in project_keywords):
            return "proyecto"
        elif any(keyword in description_lower for keyword in reading_keywords):
            return "lectura"
        return "general"
