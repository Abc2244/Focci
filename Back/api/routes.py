from fastapi import APIRouter
from services.pdf_reader import extract_subject_info_from_pdf
from models.subject import Subject
from models.task import Task
from services.bert_service import BERTService

router = APIRouter()

# Ruta para extraer materias desde PDF
@router.post("/subjects/")
async def read_pdf_and_get_subjects(pdf_path: str):
    subjects = await extract_subject_info_from_pdf(pdf_path)
    return {"subjects": subjects}

# Ruta para asignar tareas a materias
@router.post("/tasks/")
async def assign_task_to_subject(task: Task):
    bert_service = BERTService()
    difficulty = await bert_service.classify_task(task.description)
    # Aquí podrías crear un recordatorio o guardar la tarea en MongoDB
    return {"task": task, "difficulty": difficulty}
