from services.task_service import TaskProcessor

def test_process_task():
    # Crear una instancia del TaskProcessor
    task_processor = TaskProcessor()

    # Ejemplo de descripción de una tarea regular
    task_description_normal = "Estudiar para el examen de matemáticas el próximo viernes."
    subject_priority_normal = 3
    due_date_normal = "2024-10-10 15:00:00"  # Fecha de entrega en formato YYYY-MM-DD HH:MM:SS
    
    # Ejemplo de descripción de una tarea urgente
    task_description_urgent = "¡Es urgente! Completar el proyecto de física antes del viernes."
    subject_priority_urgent = 2
    due_date_urgent = "2024-10-05 15:00:00"

    # Ejemplo de descripción de una tarea a largo plazo
    task_description_long = "Leer el libro de historia para el ensayo final."
    subject_priority_long = 1
    due_date_long = "2024-12-01 10:00:00"

    # Test 1: Procesar tarea normal
    print("\n=== Test 1: Procesando tarea normal ===")
    result_normal = task_processor.process_task(task_description_normal, subject_priority_normal, due_date_normal)
    if result_normal:
        mostrar_resultados(result_normal, task_processor)

    # Test 2: Procesar tarea urgente
    print("\n=== Test 2: Procesando tarea urgente ===")
    result_urgent = task_processor.process_task(task_description_urgent, subject_priority_urgent, due_date_urgent)
    if result_urgent:
        mostrar_resultados(result_urgent, task_processor)

    # Test 3: Procesar tarea a largo plazo
    print("\n=== Test 3: Procesando tarea a largo plazo ===")
    result_long = task_processor.process_task(task_description_long, subject_priority_long, due_date_long)
    if result_long:
        mostrar_resultados(result_long, task_processor)

def mostrar_resultados(result, task_processor):
    """
    Función para mostrar los resultados de la tarea procesada y marcar la tarea como completada.
    """
    # Mostrar el resultado
    print("\nResultados del procesamiento de la tarea:")
    print("Palabras clave extraídas:", result["keywords"])
    print("Prioridad ajustada:", result["adjusted_priority"])
    print("Recordatorios generados:")
    for reminder in result["reminders"]:
        print(reminder)

    # Marcar la tarea como completada
    task_id = result["task_id"]
    completion_message = task_processor.mark_task_completed(task_id)
    print("\nMensaje al completar la tarea:", completion_message)

if __name__ == "__main__":
    test_process_task()


import spacy
import nltk
from nltk.corpus import stopwords
import random
from datetime import datetime, timedelta
from typing import List, Dict, Optional

# Descargar stopwords de NLTK (si no lo has hecho ya)
nltk.download('punkt')
nltk.download('stopwords')

# Definir plantillas de recordatorios como constantes
EXAM_REMINDER_TEMPLATES = [
    "Recuerda estudiar para el examen de {task_description} antes de {reminder_time}.",
    "Tienes que repasar para el examen de {task_description}. No lo dejes para el último momento.",
    "No olvides que el examen de {task_description} está cerca. ¡Prepara tus apuntes!",
    "Es hora de repasar para el examen de {task_description}. La fecha límite se aproxima: {reminder_time}.",
    "Dedica algo de tiempo hoy a repasar para el examen de {task_description}. ¡No te retrases!",
    "La fecha del examen de {task_description} se acerca. Aprovecha el tiempo y repasa antes de {reminder_time}.",
    "No olvides que tienes el examen de {task_description}. Prepara tus materiales antes de {reminder_time}."
]

PROJECT_REMINDER_TEMPLATES = [
    "Asegúrate de avanzar en tu proyecto de {task_description}. Fecha límite: {reminder_time}.",
    "Tu proyecto de {task_description} es importante, organiza tu tiempo antes de {reminder_time}.",
    "Revisa tu progreso en el proyecto de {task_description} y completa los hitos antes de {reminder_time}.",
    "Es momento de avanzar en tu proyecto de {task_description}. No lo dejes para el último día.",
    "La fecha límite para el proyecto de {task_description} se acerca. ¡Pon manos a la obra!",
    "Divide el trabajo de tu proyecto de {task_description} y termina algunas tareas hoy. Fecha límite: {reminder_time}.",
    "Recuerda revisar los requisitos del proyecto de {task_description}. Fecha de entrega: {reminder_time}."
]

READING_REMINDER_TEMPLATES = [
    "Recuerda terminar la lectura de {task_description} antes de {reminder_time}.",
    "Tómate un momento para leer el capítulo de {task_description}. No lo dejes pasar.",
    "Tu lectura de {task_description} debe estar lista para {reminder_time}. Aprovecha tu tiempo libre para leer.",
    "Es hora de leer el capítulo de {task_description}. ¡Disfruta la lectura antes de {reminder_time}!",
    "Asegúrate de completar la lectura de {task_description} a tiempo. Fecha límite: {reminder_time}.",
    "Divide tu lectura de {task_description} y termina algunos capítulos hoy antes de {reminder_time}.",
    "Aprovecha tu descanso para avanzar en la lectura de {task_description}. No te retrases."
]

GENERAL_REMINDER_TEMPLATES = [
    "Recuerda {task_description} antes de {reminder_time}.",
    "Tienes que {task_description}. La fecha límite es {reminder_time}.",
    "No olvides {task_description}, te queda poco tiempo antes de {reminder_time}.",
    "No dejes de lado {task_description}. Fecha límite: {reminder_time}.",
    "Organiza tu tiempo para {task_description} y completa la tarea antes de {reminder_time}.",
    "El tiempo se acaba para {task_description}. Asegúrate de completarla antes de {reminder_time}.",
    "Asegúrate de revisar todos los detalles para {task_description}. Fecha límite: {reminder_time}."
]

# Palabras clave para detectar urgencia
URGENT_KEYWORDS = ['urgente', 'importante', 'inmediato', 'crítico', 'prioridad']

class TaskProcessor:
    def __init__(self):
        # Cargar el modelo de spaCy en español
        self.nlp = spacy.load('es_core_news_sm')
        self.stop_words = set(stopwords.words('spanish'))
        self.tasks: Dict[int, Dict] = {}  # Almacenar las tareas y sus recordatorios

    def process_task(self, task_description: str, subject_priority: int, due_date: str) -> Optional[Dict]:
        """
        Procesa la descripción de la tarea usando spaCy y NLTK para extraer información útil,
        generar recordatorios basados en la prioridad de la materia y la fecha de entrega.
        """
        if not task_description:
            print("Descripción de la tarea vacía.")
            return None

        try:
            # Convertir la fecha de entrega a un objeto datetime
            due_date_dt = datetime.strptime(due_date, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            print("Formato de fecha inválido. Use YYYY-MM-DD HH:MM:SS")
            return None

        # Análisis de la descripción de la tarea con spaCy
        doc = self.nlp(task_description)

        # Extraer palabras clave y entidades relevantes con spaCy
        keywords = self.extract_keywords(doc)

        # Clasificar el tipo de tarea para personalizar los recordatorios
        task_type = self.classify_task_type(task_description)

        # Ajustar la prioridad automáticamente según la descripción y analizar urgencia
        adjusted_priority = self.adjust_priority(task_description, subject_priority)

        # Generar recordatorios automáticos basados en la prioridad ajustada y la fecha de entrega
        reminders = self.generate_advanced_reminders(task_description, adjusted_priority, due_date_dt, task_type)

        # Almacenar la tarea y sus recordatorios para futuros seguimientos
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

    def extract_keywords(self, doc) -> List[str]:
        """
        Extrae palabras clave eliminando stop words y puntuación usando spaCy.
        """
        keywords = [token.text for token in doc if not token.is_stop and not token.is_punct]
        return keywords

    def classify_task_type(self, task_description: str) -> str:
        """
        Clasifica el tipo de tarea (examen, proyecto, lectura, etc.) basado en palabras clave y entidades.
        """
        exam_keywords = ['examen', 'prueba', 'evaluación']
        project_keywords = ['proyecto', 'tarea', 'trabajo']
        reading_keywords = ['lectura', 'libro', 'capítulo', 'artículo']

        doc = self.nlp(task_description.lower())

        # Clasificar según palabras clave
        if any(token.text in exam_keywords for token in doc):
            return "examen"
        elif any(token.text in project_keywords for token in doc):
            return "proyecto"
        elif any(token.text in reading_keywords for token in doc):
            return "lectura"

        return "general"

    def adjust_priority(self, task_description: str, subject_priority: int) -> int:
        """
        Ajusta la prioridad de la tarea según la descripción. Se incrementa si se encuentran palabras
        que sugieren urgencia.
        """
        doc = self.nlp(task_description.lower())
        if any(token.text in URGENT_KEYWORDS for token in doc):
            print("Tarea marcada como urgente.")
            return min(subject_priority + 2, 5)  # Aumenta más si es urgente, la prioridad máxima es 5
        return subject_priority

    def generate_advanced_reminders(self, task_description: str, priority: int, due_date_dt: datetime, task_type: str) -> List[str]:
        """
        Genera una lista de recordatorios basados en el tipo de tarea, la prioridad y la fecha de entrega.
        """
        reminders = []
        current_date = datetime.now()

        # Calcular el número de días disponibles antes de la fecha de entrega
        delta_days = (due_date_dt - current_date).days

        if delta_days <= 0:
            return ["La tarea ya está vencida o es para hoy."]

        # Aumentar la frecuencia de recordatorios a medida que se acerca la fecha límite
        num_reminders = max(1, priority)
        if delta_days <= 3:  # Generar más recordatorios en los últimos días
            num_reminders += 2

        # Distribuir recordatorios de manera dinámica: más frecuentes al final
        reminder_dates = self._distribute_reminders(num_reminders, delta_days, current_date)

        # Seleccionar las plantillas de recordatorios adecuadas según el tipo de tarea
        reminder_templates = self._get_reminder_templates(task_type)

        # Generar recordatorios basados en plantillas
        for reminder_time in reminder_dates:
            reminder_template = random.choice(reminder_templates)
            reminder = reminder_template.format(task_description=task_description.lower(), reminder_time=reminder_time)
            reminders.append(reminder)

        return reminders

    def _distribute_reminders(self, num_reminders: int, delta_days: int, current_date: datetime) -> List[str]:
        """
        Distribuye los recordatorios de manera no uniforme, haciendo que los recordatorios sean más frecuentes al acercarse la fecha límite.
        """
        reminder_dates = []
        for i in range(num_reminders):
            # Incrementa la frecuencia en los últimos días
            if i == num_reminders - 1:
                # Último recordatorio en el día final
                reminder_time = current_date + timedelta(days=delta_days)
            else:
                reminder_time = current_date + timedelta(days=(i * delta_days // num_reminders))
            reminder_dates.append(reminder_time.strftime("%Y-%m-%d %H:%M:%S"))
        return reminder_dates

    def _get_reminder_templates(self, task_type: str) -> List[str]:
        """
        Devuelve el conjunto adecuado de plantillas de recordatorios según el tipo de tarea.
        """
        if task_type == "examen":
            return EXAM_REMINDER_TEMPLATES
        elif task_type == "proyecto":
            return PROJECT_REMINDER_TEMPLATES
        elif task_type == "lectura":
            return READING_REMINDER_TEMPLATES
        else:
            return GENERAL_REMINDER_TEMPLATES

    def mark_task_completed(self, task_id: int) -> str:
        """
        Marca una tarea como completada y elimina los recordatorios asociados.
        """
        if task_id in self.tasks:
            self.tasks[task_id]['completed'] = True
            self.tasks[task_id]['reminders'] = []  # Eliminar recordatorios
            return f"Tarea {task_id} marcada como completada y recordatorios eliminados."
        return f"Tarea {task_id} no encontrada."
