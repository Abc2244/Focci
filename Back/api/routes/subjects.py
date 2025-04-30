from bson import ObjectId
from fastapi import APIRouter, HTTPException
from datetime import datetime
from config.database import mongodb
from models.subject import Subject

router = APIRouter()

def serialize_mongo_document(doc):
    doc["_id"] = str(doc["_id"])
    # Convertir la fecha a string ISO para JSON
    if "end_date" in doc:
        doc["end_date"] = doc["end_date"].isoformat()
    return doc

async def check_and_delete_expired_subjects():
    current_date = datetime.now()
    # Buscar materias vencidas
    expired_subjects = await mongodb.get_collection("subjects").find({
        "end_date": {"$lt": current_date}
    }).to_list(length=None)
    
    for subject in expired_subjects:
        subject_id = str(subject["_id"])
        # Eliminar tareas asociadas
        tasks = await mongodb.get_collection("tasks").find({"subject_id": subject_id}).to_list(length=1000)
        task_ids = [str(task["_id"]) for task in tasks]
        
        # Eliminar recordatorios asociados
        if task_ids:
            await mongodb.get_collection("reminders").delete_many({"task_id": {"$in": task_ids}})
        
        # Eliminar tareas
        await mongodb.get_collection("tasks").delete_many({"subject_id": subject_id})
        
        # Eliminar la materia
        await mongodb.get_collection("subjects").delete_one({"_id": subject["_id"]})

@router.post("/subjects/")
async def create_subject(subject: Subject):
    try:
        subject_dict = subject.dict()
        # Asegurar que end_date sea un objeto datetime
        if isinstance(subject_dict["end_date"], str):
            subject_dict["end_date"] = datetime.fromisoformat(subject_dict["end_date"].replace("Z", "+00:00"))
        subject_id = await mongodb.get_collection("subjects").insert_one(subject_dict)
        return {"message": "Materia creada", "subject_id": str(subject_id.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.get("/subjects/{subject_id}/")
async def get_subject(subject_id: str):
    await check_and_delete_expired_subjects()  # Verificar materias vencidas
    subject = await mongodb.get_collection("subjects").find_one({"_id": ObjectId(subject_id)})
    if not subject:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    return serialize_mongo_document(subject)

@router.put("/subjects/{subject_id}/")
async def update_subject(subject_id: str, subject: Subject):
    subject_dict = subject.dict()
    # Asegurar que end_date sea un objeto datetime
    if isinstance(subject_dict["end_date"], str):
        subject_dict["end_date"] = datetime.fromisoformat(subject_dict["end_date"].replace("Z", "+00:00"))
    result = await mongodb.get_collection("subjects").update_one(
        {"_id": ObjectId(subject_id)},
        {"$set": subject_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    return {"message": "Materia actualizada"}

@router.delete("/subjects/{subject_id}/")
async def delete_subject(subject_id: str):
    # Primero obtener todas las tareas asociadas a la materia
    tasks = await mongodb.get_collection("tasks").find({"subject_id": subject_id}).to_list(length=1000)
    task_ids = [str(task["_id"]) for task in tasks]
    
    # Eliminar los recordatorios asociados a esas tareas
    if task_ids:
        reminder_result = await mongodb.get_collection("reminders").delete_many({"task_id": {"$in": task_ids}})
        reminders_deleted = reminder_result.deleted_count
    else:
        reminders_deleted = 0
    
    # Eliminar las tareas asociadas a la materia
    tasks_result = await mongodb.get_collection("tasks").delete_many({"subject_id": subject_id})
    tasks_deleted = tasks_result.deleted_count
    
    # Finalmente, eliminar la materia
    subject_result = await mongodb.get_collection("subjects").delete_one({"_id": ObjectId(subject_id)})
    if subject_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    
    return {
        "message": "Materia eliminada con éxito",
        "details": {
            "subject_deleted": True,
            "tasks_deleted": tasks_deleted,
            "reminders_deleted": reminders_deleted
        }
    }

@router.get("/users/{user_id}/subjects/")
async def get_subjects_by_user(user_id: str):
    await check_and_delete_expired_subjects()  # Verificar materias vencidas
    subjects = await mongodb.get_collection("subjects").find({"user_id": user_id}).to_list(length=100)
    if not subjects:
        raise HTTPException(status_code=404, detail="No se encontraron materias para este usuario")
    return [serialize_mongo_document(subject) for subject in subjects]
