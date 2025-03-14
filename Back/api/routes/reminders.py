import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException

from config.database import mongodb
from models.reminder import Reminder

router = APIRouter()

def serialize_mongo_document(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@router.post("/reminders/")
async def create_reminder(reminder: Reminder):
    # Asegurarse de que el campo message existe
    if not hasattr(reminder, 'message') or reminder.message is None:
        reminder.message = ""
    
    reminder_id = await mongodb.get_collection("reminders").insert_one(reminder.dict())
    return {"message": "Recordatorio creado", "reminder_id": str(reminder_id.inserted_id)}

@router.put("/reminders/{reminder_id}/")
async def update_reminder(reminder_id: str, reminder: Reminder):
    # Asegurarse de que el campo message existe
    if not hasattr(reminder, 'message') or reminder.message is None:
        reminder.message = ""
        
    result = await mongodb.get_collection("reminders").update_one(
        {"_id": ObjectId(reminder_id)},
        {"$set": reminder.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado")
    return {"message": "Recordatorio actualizado"}

@router.delete("/reminders/{reminder_id}/")
async def delete_reminder(reminder_id: str):
    result = await mongodb.get_collection("reminders").delete_one({"_id": ObjectId(reminder_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado")
    return {"message": "Recordatorio eliminado"}

@router.get("/users/{user_id}/reminders/upcoming/")
async def get_upcoming_reminders(user_id: str):
    print(f"Buscando recordatorios para el usuario: {user_id}")
    current_time = datetime.datetime.utcnow()
    print(f"Fecha actual: {current_time}")
    
    reminders = await mongodb.get_collection("reminders").find({
        "user_id": user_id,
        "reminder_date": {"$gte": current_time}
    }).to_list(length=100)
    
    print(f"Recordatorios encontrados: {len(reminders)}")
    return [serialize_mongo_document(reminder) for reminder in reminders]

@router.get("/users/{user_id}/reminders/priority/{level}/")
async def get_reminders_by_priority(user_id: str, level: int):
    reminders = await mongodb.get_collection("reminders").find({"user_id": user_id, "priority": level}).to_list(length=100)
    if not reminders:
        raise HTTPException(status_code=404, detail="No se encontraron recordatorios con esta prioridad")
    return [serialize_mongo_document(reminder) for reminder in reminders]

@router.get("/users/{user_id}/tasks/")
async def get_tasks(user_id: str):
    tasks = await mongodb.get_collection("tasks").find({"user_id": user_id}).to_list(length=100)
    if not tasks:
        raise HTTPException(status_code=404, detail="No se encontraron tareas para este usuario")
    return [serialize_mongo_document(task) for task in tasks]
