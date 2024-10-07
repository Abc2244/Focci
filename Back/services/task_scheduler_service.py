import random
from datetime import datetime, timedelta

# Definir plantillas de recordatorios como constantes
EXAM_REMINDER_TEMPLATES = [
    "Recuerda estudiar para el examen de {task_description} antes de {reminder_time}.",
    "Tienes que repasar para el examen de {task_description}. No lo dejes para el último momento.",
]

PROJECT_REMINDER_TEMPLATES = [
    "Asegúrate de avanzar en tu proyecto de {task_description}. Fecha límite: {reminder_time}.",
]

READING_REMINDER_TEMPLATES = [
    "Recuerda terminar la lectura de {task_description} antes de {reminder_time}.",
]

GENERAL_REMINDER_TEMPLATES = [
    "Recuerda {task_description} antes de {reminder_time}.",
]

class TaskScheduler:
    def generate_advanced_reminders(self, task_description: str, priority: int, due_date_dt: datetime, insistence_level: int, task_type: str) -> list:
        """
        Genera una lista de recordatorios basados en el nivel de insistencia, prioridad y fecha de vencimiento.
        """
        reminders = []
        current_date = datetime.now()

        delta_days = (due_date_dt - current_date).days

        if delta_days <= 0:
            return ["La tarea ya está vencida o es para hoy."]

        # Generar más recordatorios a medida que aumenta la insistencia
        num_reminders = max(1, priority + insistence_level)

        # Distribuir recordatorios de manera más frecuente si la insistencia es alta
        reminder_dates = self._distribute_reminders(num_reminders, delta_days, current_date)
        reminder_templates = self._get_reminder_templates(task_type)

        for reminder_time in reminder_dates:
            reminder_template = random.choice(reminder_templates)
            reminder = reminder_template.format(task_description=task_description.lower(), reminder_time=reminder_time)
            reminders.append(reminder)

        return reminders

    def _distribute_reminders(self, num_reminders: int, delta_days: int, current_date: datetime) -> list:
        """
        Distribuye los recordatorios de manera uniforme, pero más frecuentes si la fecha de vencimiento está cerca.
        """
        reminder_dates = []
        for i in range(num_reminders):
            if i == num_reminders - 1:
                reminder_time = current_date + timedelta(days=delta_days)
            else:
                # Distribuir los recordatorios según la cantidad total de días disponibles y el número de recordatorios
                reminder_time = current_date + timedelta(days=(i * delta_days // num_reminders))
            reminder_dates.append(reminder_time.strftime("%Y-%m-%d %H:%M:%S"))
        return reminder_dates

    def _get_reminder_templates(self, task_type: str) -> list:
        """
        Selecciona las plantillas de recordatorios basadas en el tipo de tarea (examen, proyecto, lectura, etc.)
        """
        if task_type == "examen":
            return EXAM_REMINDER_TEMPLATES
        elif task_type == "proyecto":
            return PROJECT_REMINDER_TEMPLATES
        elif task_type == "lectura":
            return READING_REMINDER_TEMPLATES
        else:
            return GENERAL_REMINDER_TEMPLATES

    def calculate_insistence_level(self, priority: int, due_date_dt: datetime, urgent_keywords_detected: bool) -> int:
        """
        Calcula el nivel de insistencia en función de la prioridad, fecha de vencimiento y palabras clave urgentes.
        """
        current_date = datetime.now()
        delta_days = (due_date_dt - current_date).days

        # Nivel base de insistencia basado en la prioridad
        insistence_level = priority  # Mayor prioridad = mayor insistencia

        # Incrementar insistencia si la fecha de vencimiento está cerca
        if delta_days <= 3:
            insistence_level += 2  # Aumenta mucho la insistencia cuando faltan pocos días
        elif delta_days <= 7:
            insistence_level += 1  # Aumenta ligeramente si la fecha está dentro de una semana

        # Si se detectaron palabras clave urgentes, incrementar la insistencia
        if urgent_keywords_detected:
            insistence_level += 1

        # Limitar el nivel de insistencia entre 1 y 5
        return min(insistence_level, 5)
