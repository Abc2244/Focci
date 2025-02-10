import os
from bson import ObjectId
from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from pydantic import BaseModel

from config.database import mongodb
from models.user import User

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def serialize_mongo_document(doc):
    doc["_id"] = str(doc["_id"])
    return doc

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
