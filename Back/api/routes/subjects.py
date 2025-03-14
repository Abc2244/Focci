from bson import ObjectId
from fastapi import APIRouter, HTTPException

from config.database import mongodb
from models.subject import Subject

router = APIRouter()

def serialize_mongo_document(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@router.post("/subjects/")
async def create_subject(subject: Subject):
    try:
        subject_dict = subject.dict()
        subject_id = await mongodb.get_collection("subjects").insert_one(subject_dict)
        return {"message": "Materia creada", "subject_id": str(subject_id.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

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

@router.get("/users/{user_id}/subjects/")
async def get_subjects_by_user(user_id: str):
    subjects = await mongodb.get_collection("subjects").find({"user_id": user_id}).to_list(length=100)
    if not subjects:
        raise HTTPException(status_code=404, detail="No se encontraron materias para este usuario")
    return [serialize_mongo_document(subject) for subject in subjects]
