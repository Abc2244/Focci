import datetime
from fastapi import APIRouter, HTTPException
from models.user import User
from models.subject import Subject
from models.task import Task
from models.reminder import Reminder
from config.database import mongodb
from bson import ObjectId

router = APIRouter()

# Ruta para verificar si la API está corriendo
@router.get("/")
async def root():
    return {"message": "API is running!"}


# Ruta para crear un usuario

@router.post("/users/")
async def create_user(user: User):
    user_data = user.dict()  # Convierte el modelo en un diccionario
    user_collection = mongodb.get_collection("users")  # Ya no es necesario usar await aquí
    user_id = await user_collection.insert_one(user_data)  # Se sigue usando await en las operaciones de MongoDB
    return {"message": "User created", "user_id": str(user_id.inserted_id)}


# Ruta para obtener un usuario por ID
@router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await mongodb.get_collection("users").find_one({"_id": ObjectId(user_id)})
    if user:
        return user
    raise HTTPException(status_code=404, detail="User not found")


# Ruta para crear una materia
@router.post("/subjects/")
async def create_subject(subject: Subject):
    subject_data = subject.dict()
    subject_id = await mongodb.get_collection("subjects").insert_one(subject_data)
    return {"message": "Subject created", "subject_id": str(subject_id.inserted_id)}


# Ruta para obtener las materias de un usuario
@router.get("/users/{user_id}/subjects")
async def get_user_subjects(user_id: str):
    subjects = await mongodb.get_collection("subjects").find({"user_id": user_id}).to_list(length=100)
    if subjects:
        return subjects
    raise HTTPException(status_code=404, detail="No subjects found for the user")




@router.post("/create-task")
async def create_task(task: Task):
    task_data = task.dict()
    # Asegurarte de que "due_date" sea una instancia de datetime
    task_data['due_date'] = datetime.strptime(task_data['due_date'], "%Y-%m-%d %H:%M:%S")
    
    task_id = await mongodb.get_collection("tasks").insert_one(task_data)
    return {"message": "Task created", "task_id": str(task_id.inserted_id)}
# Ruta para obtener las tareas de un usuario
@router.get("/users/{user_id}/tasks")
async def get_user_tasks(user_id: str):
    tasks = await mongodb.get_collection("tasks").find({"user_id": user_id}).to_list(length=100)
    if tasks:
        return tasks
    raise HTTPException(status_code=404, detail="No tasks found for the user")


# Ruta para crear un recordatorio para una tarea
@router.post("/reminders/")
async def create_reminder(reminder: Reminder):
    reminder_data = reminder.dict()
    reminder_id = await mongodb.get_collection("reminders").insert_one(reminder_data)
    return {"message": "Reminder created", "reminder_id": str(reminder_id.inserted_id)}


# Ruta para obtener los recordatorios de un usuario
@router.get("/users/{user_id}/reminders")
async def get_user_reminders(user_id: str):
    reminders = await mongodb.get_collection("reminders").find({"user_id": user_id}).to_list(length=100)
    if reminders:
        return reminders
    raise HTTPException(status_code=404, detail="No reminders found for the user")

