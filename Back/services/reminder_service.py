import schedule
import time

async def create_reminder(task, subject):
    # Guardar en MongoDB o lanzar recordatorio
    print(f"Creando recordatorio para {task['description']} de {subject['name']}")
