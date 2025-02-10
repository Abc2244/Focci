import datetime
import os
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from fastapi.security import OAuth2PasswordBearer
from config.database import mongodb
import jwt
from models.subject import Subject
from models.user import User
from models.task import Task
from models.reminder import Reminder

# Configuración
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_key")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login/")

# Función auxiliar para convertir ObjectId a string
def serialize_mongo_document(doc):
    doc["_id"] = str(doc["_id"])
    return doc

# CRUD Usuarios
@router.post("/register/")
async def register_user(user: User):
    user_collection = mongodb.get_collection("users")
    if await user_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="El email ya está registrado.")
    hashed_password = pwd_context.hash(user.password)
    new_user = {"username": user.username, "email": user.email, "password": hashed_password}
    user_id = await user_collection.insert_one(new_user)
    return {"message": "Usuario registrado", "user_id": str(user_id.inserted_id)}


class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/login/")
async def login_user(user: UserLogin):
    user_collection = mongodb.get_collection("users")
    user_record = await user_collection.find_one({"email": user.email})

    if not user_record or not pwd_context.verify(user.password, user_record["password"]):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos.")

    token = jwt.encode(
        {"user_id": str(user_record["_id"]), "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
        SECRET_KEY,
        algorithm="HS256"
    )
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me/")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        user = await mongodb.get_collection("users").find_one({"_id": ObjectId(user_id)})

        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        return serialize_mongo_document(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.put("/users/{user_id}/")
async def update_user(user_id: str, user: User):
    user_data = {k: v for k, v in user.dict().items() if v is not None}
    result = await mongodb.get_collection("users").update_one({"_id": ObjectId(user_id)}, {"$set": user_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"message": "Usuario actualizado"}


@router.delete("/users/{user_id}/")
async def delete_user(user_id: str):
    result = await mongodb.get_collection("users").delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"message": "Usuario eliminado"}

@router.delete("/users/{user_id}/clean/")
async def delete_user_data(user_id: str):
    tasks_result = await mongodb.get_collection("tasks").delete_many({"user_id": user_id})
    reminders_result = await mongodb.get_collection("reminders").delete_many({"user_id": user_id})

    return {
        "message": f"Se eliminaron {tasks_result.deleted_count} tareas y {reminders_result.deleted_count} recordatorios del usuario"
    }

class UpdatePassword(BaseModel):
    old_password: str
    new_password: str

@router.put("/users/{user_id}/update-password/")
async def update_password(user_id: str, data: UpdatePassword):
    user_collection = mongodb.get_collection("users")
    user = await user_collection.find_one({"_id": ObjectId(user_id)})

    if not user or not pwd_context.verify(data.old_password, user["password"]):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    hashed_password = pwd_context.hash(data.new_password)
    result = await user_collection.update_one({"_id": ObjectId(user_id)}, {"$set": {"password": hashed_password}})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {"message": "Contraseña actualizada correctamente"}

# CRUD Materias
@router.post("/subjects/")
async def create_subject(subject: Subject):
    subject_id = await mongodb.get_collection("subjects").insert_one(subject.dict())
    return {"message": "Materia creada", "subject_id": str(subject_id.inserted_id)}

@router.get("/subjects/{subject_id}/")
async def get_subject(subject_id: str):
    subject = await mongodb.get_collection("subjects").find_one({"_id": ObjectId(subject_id)})
    if not subject:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    return serialize_mongo_document(subject)

@router.put("/subjects/{subject_id}/")
async def update_subject(subject_id: str, subject: Subject):
    result = await mongodb.get_collection("subjects").update_one({"_id": ObjectId(subject_id)}, {"$set": subject.dict()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    return {"message": "Materia actualizada"}


@router.delete("/subjects/{subject_id}/")
async def delete_subject(subject_id: str):
    related_tasks = await mongodb.get_collection("tasks").count_documents({"subject_id": subject_id})

    if related_tasks > 0:
        raise HTTPException(status_code=400, detail="No puedes eliminar una materia con tareas asociadas")

    result = await mongodb.get_collection("subjects").delete_one({"_id": ObjectId(subject_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Materia no encontrada")

    return {"message": "Materia eliminada"}

# CRUD Tareas
@router.post("/tasks/")
async def create_task(task: Task):
    task_id = await mongodb.get_collection("tasks").insert_one(task.dict())
    return {"message": "Tarea creada", "task_id": str(task_id.inserted_id)}

@router.patch("/tasks/{task_id}/complete/")
async def complete_task(task_id: str):
    result = await mongodb.get_collection("tasks").update_one(
        {"_id": ObjectId(task_id)}, {"$set": {"completed": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return {"message": "Tarea marcada como completada"}

@router.get("/tasks/{task_id}/reminders/")
async def get_reminders_by_task(task_id: str):
    reminders = await mongodb.get_collection("reminders").find({"task_id": task_id}).to_list(length=100)
    if not reminders:
        raise HTTPException(status_code=404, detail="No se encontraron recordatorios para esta tarea")
    return [serialize_mongo_document(reminder) for reminder in reminders]

@router.put("/tasks/{task_id}/")
async def update_task(task_id: str, task: Task):
    task_data = {k: v for k, v in task.dict().items() if v is not None}  # Evita sobreescribir con `None`
    result = await mongodb.get_collection("tasks").update_one({"_id": ObjectId(task_id)}, {"$set": task_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return {"message": "Tarea actualizada"}

@router.delete("/tasks/{task_id}/")
async def delete_task(task_id: str):
    result = await mongodb.get_collection("tasks").delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return {"message": "Tarea eliminada"}

@router.get("/tasks/{task_id}/")
async def get_task(task_id: str):
    task = await mongodb.get_collection("tasks").find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return serialize_mongo_document(task)

@router.get("/users/{user_id}/tasks/pending/")
async def get_pending_tasks(user_id: str):
    tasks = await mongodb.get_collection("tasks").find({"user_id": user_id, "completed": False}).to_list(length=100)
    if not tasks:
        raise HTTPException(status_code=404, detail="No se encontraron tareas pendientes")
    return [serialize_mongo_document(task) for task in tasks]

# CRUD Recordatorios
@router.post("/reminders/")
async def create_reminder(reminder: Reminder):
    reminder_id = await mongodb.get_collection("reminders").insert_one(reminder.dict())
    return {"message": "Recordatorio creado", "reminder_id": str(reminder_id.inserted_id)}

@router.put("/reminders/{reminder_id}/")
async def update_reminder(reminder_id: str, reminder: Reminder):
    result = await mongodb.get_collection("reminders").update_one({"_id": ObjectId(reminder_id)}, {"$set": reminder.dict()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado")
    return {"message": "Recordatorio actualizado"}

@router.delete("/reminders/{reminder_id}/")
async def delete_reminder(reminder_id: str):
    result = await mongodb.get_collection("reminders").delete_one({"_id": ObjectId(reminder_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado")
    return {"message": "Recordatorio eliminado"}

# Endpoints útiles para la aplicación Focci
@router.get("/users/{user_id}/tasks/")
async def get_tasks_by_user(user_id: str):
    tasks = await mongodb.get_collection("tasks").find({"user_id": user_id}).to_list(length=100)
    return [serialize_mongo_document(task) for task in tasks]

@router.get("/subjects/{subject_id}/tasks/")
async def get_tasks_by_subject(subject_id: str):
    tasks = await mongodb.get_collection("tasks").find({"subject_id": subject_id}).to_list(length=100)
    return [serialize_mongo_document(task) for task in tasks]

@router.get("/users/{user_id}/reminders/upcoming/")
async def get_upcoming_reminders(user_id: str):
    reminders = await mongodb.get_collection("reminders").find({"user_id": user_id, "reminder_date": {"$gte": datetime.datetime.utcnow()}}).to_list(length=100)
    return [serialize_mongo_document(reminder) for reminder in reminders]

@router.get("/users/{user_id}/subjects/")
async def get_subjects_by_user(user_id: str):
    subjects = await mongodb.get_collection("subjects").find({"user_id": user_id}).to_list(length=100)
    if not subjects:
        raise HTTPException(status_code=404, detail="No se encontraron materias para este usuario")
    return [serialize_mongo_document(subject) for subject in subjects]

@router.get("/users/{user_id}/tasks/completed/")
async def get_completed_tasks(user_id: str):
    tasks = await mongodb.get_collection("tasks").find({"user_id": user_id, "completed": True}).to_list(length=100)
    if not tasks:
        raise HTTPException(status_code=404, detail="No se encontraron tareas completadas")
    return [serialize_mongo_document(task) for task in tasks]

@router.get("/users/{user_id}/reminders/priority/{level}/")
async def get_reminders_by_priority(user_id: str, level: int):
    reminders = await mongodb.get_collection("reminders").find({"user_id": user_id, "priority": level}).to_list(length=100)
    if not reminders:
        raise HTTPException(status_code=404, detail="No se encontraron recordatorios con esta prioridad")
    return [serialize_mongo_document(reminder) for reminder in reminders]

@router.delete("/users/{user_id}/tasks/completed/")
async def delete_completed_tasks(user_id: str):
    result = await mongodb.get_collection("tasks").delete_many({"user_id": user_id, "completed": True})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No se encontraron tareas completadas para eliminar")
    return {"message": f"{result.deleted_count} tareas completadas eliminadas"}
