import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException

from config.database import mongodb
from models.task import Task
from services.task_service import TaskService

router = APIRouter()
task_service = TaskService()

def serialize_mongo_document(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@router.post("/tasks/", response_model=dict)
async def create_task(task: Task):
    try:
        if not task.user_id or not task.subject_id:
            raise HTTPException(
                status_code=400,
                detail="user_id y subject_id son requeridos"
            )

        # Validar ObjectIds
        try:
            user_id_obj = ObjectId(task.user_id)
            subject_id_obj = ObjectId(task.subject_id)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"ID inválido: {str(e)}"
            )

        # Procesar la tarea
        try:
            result = await task_service.process_task(
                user_id=str(user_id_obj),
                subject_id=str(subject_id_obj),
                task_description=task.description,
                due_date=task.due_date,
                estimated_time=task.estimated_time
            )
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )
        except Exception as e:
            print(f"Error inesperado: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error interno del servidor: {str(e)}"
            )

        if not result:
            raise HTTPException(
                status_code=400,
                detail="Error al procesar la tarea"
            )

        return {
            "message": "Tarea creada exitosamente",
            "task_id": str(result["task_id"]),
            "task_type": result["task_type"],
            "adjusted_priority": result["adjusted_priority"]
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error no manejado: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.patch("/tasks/{task_id}/complete/")
async def complete_task(task_id: str):
    result = await mongodb.get_collection("tasks").update_one(
        {"_id": ObjectId(task_id)},
        {
            "$set": {
                "completed": True,
                "completed_date": datetime.datetime.utcnow().isoformat()
            }
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return {"message": "Tarea marcada como completada"}

@router.patch("/tasks/{task_id}/uncomplete/")
async def uncomplete_task(task_id: str):
    result = await mongodb.get_collection("tasks").update_one(
        {"_id": ObjectId(task_id)},
        {
            "$set": {
                "completed": False,
                "completed_date": None  # Optionally clear the completed date
            }
        }
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return {"message": "Tarea marcada como incompleta"}

@router.get("/tasks/{task_id}/reminders/")
async def get_reminders_by_task(task_id: str):
    reminders = await mongodb.get_collection("reminders").find({"task_id": task_id}).to_list(length=100)
    if not reminders:
        raise HTTPException(status_code=404, detail="No se encontraron recordatorios para esta tarea")
    return [serialize_mongo_document(reminder) for reminder in reminders]

@router.put("/tasks/{task_id}/")
async def update_task(task_id: str, task: Task):
    task_data = {k: v for k, v in task.dict().items() if v is not None}
    result = await mongodb.get_collection("tasks").update_one({"_id": ObjectId(task_id)}, {"$set": task_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return {"message": "Tarea actualizada"}

@router.delete("/tasks/{task_id}/")
async def delete_task(task_id: str):
    # Primero eliminar los recordatorios asociados a la tarea
    reminder_result = await mongodb.get_collection("reminders").delete_many({"task_id": task_id})
    reminders_deleted = reminder_result.deleted_count
    
    # Luego eliminar la tarea
    task_result = await mongodb.get_collection("tasks").delete_one({"_id": ObjectId(task_id)})
    if task_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    return {
        "message": "Tarea eliminada con éxito",
        "details": {
            "task_deleted": True,
            "reminders_deleted": reminders_deleted
        }
    }

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

@router.get("/users/{user_id}/tasks/")
async def get_tasks_by_user(user_id: str):
    tasks = await mongodb.get_collection("tasks").find({"user_id": user_id}).to_list(length=100)
    return [serialize_mongo_document(task) for task in tasks]

@router.get("/subjects/{subject_id}/tasks/")
async def get_tasks_by_subject(subject_id: str):
    tasks = await mongodb.get_collection("tasks").find({"subject_id": subject_id}).to_list(length=100)
    return [serialize_mongo_document(task) for task in tasks]

@router.get("/users/{user_id}/tasks/completed/")
async def get_completed_tasks(user_id: str):
    tasks = await mongodb.get_collection("tasks").find({"user_id": user_id, "completed": True}).to_list(length=100)
    if not tasks:
        raise HTTPException(status_code=404, detail="No se encontraron tareas completadas")
    return [serialize_mongo_document(task) for task in tasks]

@router.delete("/users/{user_id}/tasks/completed/")
async def delete_completed_tasks(user_id: str):
    result = await mongodb.get_collection("tasks").delete_many({"user_id": user_id, "completed": True})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No se encontraron tareas completadas para eliminar")
    return {"message": f"{result.deleted_count} tareas completadas eliminadas"}
