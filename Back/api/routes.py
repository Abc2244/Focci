import datetime
from fastapi import APIRouter, HTTPException
from models.user import User
from models.subject import Subject
from models.task import Task
from models.reminder import Reminder
from config.database import mongodb
from bson import ObjectId
from pydantic import BaseModel
from models.user import User
from config.database import mongodb
from passlib.context import CryptContext
from bson import ObjectId
import jwt
from services.task_prioritizer_service import URGENT_KEYWORDS, TaskPrioritizer
from services.task_scheduler_service import TaskScheduler



router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "tu_clave_secreta"  # Asegúrate de almacenar esto de manera segura

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# Endpoint para registrar usuario
@router.post("/register/")
async def register_user(user: UserRegister):
    user_collection = mongodb.get_collection("users")
    # Verificar si el email ya está registrado
    existing_user = await user_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado.")
    
    hashed_password = pwd_context.hash(user.password)
    new_user = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "tasks": [],
        "subjects": [],
        "reminders": []
    }
    user_id = await user_collection.insert_one(new_user)
    return {"message": "Usuario registrado exitosamente", "user_id": str(user_id.inserted_id)}

# Endpoint para iniciar sesión
@router.post("/login/")
async def login_user(user: UserLogin):
    user_collection = mongodb.get_collection("users")
    user_record = await user_collection.find_one({"email": user.email})
    if not user_record or not pwd_context.verify(user.password, user_record["password"]):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos.")
    
    # Generar token JWT
    token = jwt.encode({"user_id": str(user_record["_id"])}, SECRET_KEY)
    return {"access_token": token, "token_type": "bearer"}



# Ruta para verificar si la API está corriendo
@router.get("/")
async def root():
    return {"message": "API is running!"}

# Obtener todos los usuarios
@router.get("/users/")
async def get_all_users():
    users = await mongodb.get_collection("users").find().to_list(length=100)
    return users

# Crear un usuario
@router.post("/users/")
async def create_user(user: User):
    user_data = user.dict()
    user_collection = mongodb.get_collection("users")
    user_id = await user_collection.insert_one(user_data)
    return {"message": "User created", "user_id": str(user_id.inserted_id)}


# Obtener un usuario por ID
@router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await mongodb.get_collection("users").find_one({"_id": ObjectId(user_id)})
    if user:
        return user
    raise HTTPException(status_code=404, detail="User not found")


# Crear una materia
@router.post("/subjects/")
async def create_subject(subject: Subject):
    subject_data = subject.dict()
    subject_id = await mongodb.get_collection("subjects").insert_one(subject_data)
    return {"message": "Subject created", "subject_id": str(subject_id.inserted_id)}


# Obtener las materias de un usuario


@router.get("/users/{user_id}/subjects")
async def get_user_subjects(user_id: str):
    subjects = await mongodb.get_collection("subjects").find({"user_id": user_id}).to_list(length=100)
    
    if subjects:
        # Convertir el ObjectId a string
        for subject in subjects:
            subject["_id"] = str(subject["_id"])  # Convertir ObjectId a string
            subject["user_id"] = str(subject["user_id"])  # Convertir ObjectId del usuario a string también
        
        return subjects
    
    raise HTTPException(status_code=404, detail="No subjects found for the user")

@router.post("/tasks/")
async def create_task(task: Task):
    task_data = task.dict()
    
    # Verificar que el usuario existe
    user = await mongodb.get_collection("users").find_one({"_id": ObjectId(task_data['user_id'])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verificar que la materia existe
    subject = await mongodb.get_collection("subjects").find_one({"_id": ObjectId(task_data['subject_id'])})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    try:
        # Si el due_date ya es un objeto datetime, no intentes convertirlo
        if isinstance(task_data['due_date'], str):
            task_data['due_date'] = datetime.datetime.strptime(task_data['due_date'], "%Y-%m-%d %H:%M:%S")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD HH:MM:SS.")
    
    # Insertar la tarea
    task_id = await mongodb.get_collection("tasks").insert_one(task_data)
    
    # Calcular la prioridad ajustada y el nivel de insistencia
    task_scheduler = TaskScheduler()
    task_prioritizer = TaskPrioritizer()
    
    # Ajustar la prioridad de la tarea basado en la descripción y prioridad de la materia
    adjusted_priority = task_prioritizer.adjust_priority(task_data['description'], subject['credits'])
    
    # Calcular el nivel de insistencia basado en la prioridad ajustada, la fecha de entrega, y si la tarea es urgente
    urgent_keywords_detected = any(keyword in task_data['description'].lower() for keyword in URGENT_KEYWORDS)
    insistence_level = task_scheduler.calculate_insistence_level(adjusted_priority, task_data['due_date'], urgent_keywords_detected)
    
    # Generar la fecha del recordatorio basada en el nivel de insistencia
    reminder_dates = task_scheduler.generate_advanced_reminders(task_data['description'], adjusted_priority, task_data['due_date'], insistence_level, "tarea")
    
    # Crear un recordatorio para cada fecha generada
    for reminder_date in reminder_dates:
        reminder_data = {
            "user_id": task_data['user_id'],
            "task_id": str(task_id.inserted_id),  # Vincular al ID de la tarea recién creada
            "reminder_date": reminder_date,
            "status": "pendiente",
            "priority": adjusted_priority,
            "insistence_level": insistence_level
        }
        await mongodb.get_collection("reminders").insert_one(reminder_data)

    return {"message": "Task created with reminders", "task_id": str(task_id.inserted_id)}



# Obtener las tareas de un usuario
@router.get("/users/{user_id}/tasks")
async def get_user_tasks(user_id: str):
    tasks = await mongodb.get_collection("tasks").find({"user_id": user_id}).to_list(length=100)
    if tasks:
        return tasks
    raise HTTPException(status_code=404, detail="No tasks found for the user")


# Crear un recordatorio
@router.post("/reminders/")
async def create_reminder(reminder: Reminder):
    reminder_data = reminder.dict()
    reminder_id = await mongodb.get_collection("reminders").insert_one(reminder_data)
    return {"message": "Reminder created", "reminder_id": str(reminder_id.inserted_id)}


# Obtener los recordatorios de un usuario
@router.get("/users/{user_id}/reminders")
async def get_user_reminders(user_id: str):
    reminders = await mongodb.get_collection("reminders").find({"user_id": user_id}).to_list(length=100)
    if reminders:
        return reminders
    raise HTTPException(status_code=404, detail="No reminders found for the user")


# Completar una tarea
@router.post("/tasks/complete/")
async def complete_task(task_id: str):
    """
    Marca una tarea como completada y elimina los recordatorios asociados.
    """
    task_collection = mongodb.get_collection("tasks")
    reminder_collection = mongodb.get_collection("reminders")
    
    # Actualizar el campo "completed" de la tarea
    result = await task_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"completed": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    # Eliminar los recordatorios asociados a la tarea
    await reminder_collection.delete_many({"task_id": task_id})

    return {"message": "Task marked as completed and reminders removed"}
