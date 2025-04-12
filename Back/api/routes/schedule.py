from bson import ObjectId
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import List, Optional

from config.database import mongodb
from models.schedule import ScheduleItem

router = APIRouter(prefix="/schedule", tags=["schedule"])

def serialize_mongo_document(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@router.post("/")
async def create_schedule_item(schedule_item: ScheduleItem):
    """Crea un nuevo elemento en el horario del usuario"""
    try:
        schedule_dict = schedule_item.dict()
        result = await mongodb.get_collection("schedule").insert_one(schedule_dict)
        return {"message": "Elemento de horario creado", "item_id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.get("/{item_id}")
async def get_schedule_item(item_id: str):
    """Obtiene un elemento específico del horario"""
    item = await mongodb.get_collection("schedule").find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Elemento de horario no encontrado")
    return serialize_mongo_document(item)

@router.put("/{item_id}")
async def update_schedule_item(item_id: str, schedule_item: ScheduleItem):
    """Actualiza un elemento del horario"""
    result = await mongodb.get_collection("schedule").update_one(
        {"_id": ObjectId(item_id)},
        {"$set": schedule_item.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Elemento de horario no encontrado")
    return {"message": "Elemento de horario actualizado"}

@router.delete("/{item_id}")
async def delete_schedule_item(item_id: str):
    """Elimina un elemento del horario"""
    result = await mongodb.get_collection("schedule").delete_one({"_id": ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Elemento de horario no encontrado")
    return {"message": "Elemento de horario eliminado"}

@router.get("/users/{user_id}")
async def get_user_schedule(user_id: str):
    """Obtiene todo el horario de un usuario"""
    items = await mongodb.get_collection("schedule").find({"user_id": user_id}).to_list(length=100)
    return [serialize_mongo_document(item) for item in items]

@router.get("/users/{user_id}/today")
async def get_today_schedule(user_id: str):
    """Obtiene el horario del usuario para el día actual"""
    today = datetime.now().strftime("%A").lower()
    items = await mongodb.get_collection("schedule").find({
        "user_id": user_id,
        "day": today
    }).to_list(length=100)
    return [serialize_mongo_document(item) for item in items]

@router.get("/users/{user_id}/free-slots")
async def get_free_slots(user_id: str, date: Optional[str] = None):
    """
    Encuentra espacios libres en el horario del usuario para un día específico
    Si no se proporciona fecha, se usa el día actual
    """
    try:
        # Determinar el día
        if date:
            target_date = datetime.fromisoformat(date)
            day_name = target_date.strftime("%A").lower()
        else:
            target_date = datetime.now()
            day_name = target_date.strftime("%A").lower()
        
        # Obtener todos los elementos del horario para ese día
        items = await mongodb.get_collection("schedule").find({
            "user_id": user_id,
            "day": day_name
        }).to_list(length=100)
        
        # Convertir a formato de hora
        busy_slots = []
        for item in items:
            start_time = datetime.strptime(item["startTime"], "%H:%M").time()
            end_time = datetime.strptime(item["endTime"], "%H:%M").time()
            
            # Crear objetos datetime completos para el día objetivo
            start_dt = datetime.combine(target_date.date(), start_time)
            end_dt = datetime.combine(target_date.date(), end_time)
            
            busy_slots.append({
                "start": start_dt.isoformat(),
                "end": end_dt.isoformat(),
                "title": item["title"],
                "type": item["type"]
            })
        
        # Ordenar por hora de inicio
        busy_slots.sort(key=lambda x: x["start"])
        
        # Encontrar espacios libres (entre 8 AM y 10 PM)
        day_start = datetime.combine(target_date.date(), datetime.strptime("08:00", "%H:%M").time())
        day_end = datetime.combine(target_date.date(), datetime.strptime("22:00", "%H:%M").time())
        
        free_slots = []
        current_time = day_start
        
        for slot in busy_slots:
            slot_start = datetime.fromisoformat(slot["start"])
            
            # Si hay espacio entre la hora actual y el inicio del siguiente evento
            if current_time < slot_start:
                # Solo considerar espacios de al menos 30 minutos
                if (slot_start - current_time).total_seconds() / 60 >= 30:
                    free_slots.append({
                        "start": current_time.isoformat(),
                        "end": slot_start.isoformat(),
                        "duration_minutes": int((slot_start - current_time).total_seconds() / 60)
                    })
            
            # Actualizar la hora actual al final del evento
            slot_end = datetime.fromisoformat(slot["end"])
            if slot_end > current_time:
                current_time = slot_end
        
        # Verificar si hay espacio después del último evento hasta el final del día
        if current_time < day_end:
            # Solo considerar espacios de al menos 30 minutos
            if (day_end - current_time).total_seconds() / 60 >= 30:
                free_slots.append({
                    "start": current_time.isoformat(),
                    "end": day_end.isoformat(),
                    "duration_minutes": int((day_end - current_time).total_seconds() / 60)
                })
        
        return {
            "day": day_name,
            "date": target_date.date().isoformat(),
            "busy_slots": busy_slots,
            "free_slots": free_slots
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular espacios libres: {str(e)}") 