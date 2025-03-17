from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime, timedelta
from config.database import mongodb

router = APIRouter(prefix="/stats", tags=["statistics"])

def get_date_range(period: str) -> tuple:
    now = datetime.utcnow()
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "semester":
        start_date = now - timedelta(days=180)
    else:
        raise HTTPException(status_code=400, detail="Período inválido")
    return start_date, now

@router.get("/users/{user_id}/tasks/{period}")
async def get_tasks_stats(user_id: str, period: str):
    start_date, end_date = get_date_range(period)
    
    # Obtener tareas del período
    tasks = await mongodb.get_collection("tasks").find({
        "user_id": user_id,
        "created_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(length=None)
    
    total_tasks = len(tasks)
    completed_tasks = sum(1 for task in tasks if task.get("completed", False))
    
    return {
        "created": total_tasks,
        "completed": completed_tasks,
        "completionRate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2)
    }

@router.get("/users/{user_id}/completion")
async def get_completion_stats(user_id: str):
    tasks = await mongodb.get_collection("tasks").find({
        "user_id": user_id,
        "completed": True
    }).to_list(length=None)
    
    total_completed = len(tasks)
    on_time = 0
    late = 0
    
    for task in tasks:
        if task.get("completed_date") and task.get("due_date"):
            completed_date = datetime.fromisoformat(task["completed_date"].replace('Z', '+00:00'))
            due_date = datetime.fromisoformat(task["due_date"].replace('Z', '+00:00'))
            if completed_date <= due_date:
                on_time += 1
            else:
                late += 1
    
    return {
        "onTimeRate": round((on_time / total_completed * 100) if total_completed > 0 else 0, 2),
        "lateRate": round((late / total_completed * 100) if total_completed > 0 else 0, 2)
    }

@router.get("/users/{user_id}/time")
async def get_time_stats(user_id: str):
    tasks = await mongodb.get_collection("tasks").find({
        "user_id": user_id,
        "completed": True
    }).to_list(length=None)
    
    total_days = 0
    count = 0
    
    for task in tasks:
        if task.get("created_at") and task.get("completed_date"):
            created_date = datetime.fromisoformat(task["created_at"].replace('Z', '+00:00'))
            completed_date = datetime.fromisoformat(task["completed_date"].replace('Z', '+00:00'))
            days = (completed_date - created_date).days
            total_days += days
            count += 1
    
    return {
        "averageDays": round(total_days / count if count > 0 else 0, 1)
    } 