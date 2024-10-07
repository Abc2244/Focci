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
    def generate_advanced_reminders(self, task_description: str, priority: int, due_date_dt: datetime, task_type: str) -> list:
        reminders = []
        current_date = datetime.now()

        delta_days = (due_date_dt - current_date).days

        if delta_days <= 0:
            return ["La tarea ya está vencida o es para hoy."]

        num_reminders = max(1, priority)
        if delta_days <= 3:
            num_reminders += 2

        reminder_dates = self._distribute_reminders(num_reminders, delta_days, current_date)
        reminder_templates = self._get_reminder_templates(task_type)

        for reminder_time in reminder_dates:
            reminder_template = random.choice(reminder_templates)
            reminder = reminder_template.format(task_description=task_description.lower(), reminder_time=reminder_time)
            reminders.append(reminder)

        return reminders

    def _distribute_reminders(self, num_reminders: int, delta_days: int, current_date: datetime) -> list:
        """Distribuye los recordatorios uniformemente hasta la fecha límite."""
        reminder_dates = []
        for i in range(num_reminders):
            if i == num_reminders - 1:
                reminder_time = current_date + timedelta(days=delta_days)
            else:
                reminder_time = current_date + timedelta(days=(i * delta_days // num_reminders))
            reminder_dates.append(reminder_time.strftime("%Y-%m-%d %H:%M:%S"))
        return reminder_dates

    def _get_reminder_templates(self, task_type: str) -> list:
        """Obtiene las plantillas de recordatorios según el tipo de tarea."""
        if task_type == "examen":
            return EXAM_REMINDER_TEMPLATES
        elif task_type == "proyecto":
            return PROJECT_REMINDER_TEMPLATES
        elif task_type == "lectura":
            return READING_REMINDER_TEMPLATES
        else:
            return GENERAL_REMINDER_TEMPLATES
