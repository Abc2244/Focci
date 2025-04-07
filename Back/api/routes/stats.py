# routes/stats.py

from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime, timedelta
from config.database import mongodb

router = APIRouter(prefix="/stats", tags=["statistics"])


# --------- Utils: Rangos de fechas según periodo ---------
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


# --------- Endpoint: Estadísticas generales por periodo ---------
@router.get("/users/{user_id}/stats/{period}")
async def get_user_stats(user_id: str, period: str):
    try:
        # Obtener rango de fechas para el período
        start_date, end_date = get_date_range(period)
        
        # Convertir fechas a formato ISO para comparación
        start_date_iso = start_date.isoformat()
        end_date_iso = end_date.isoformat()
        
        # Obtener todas las tareas del usuario en el período
        tasks = await mongodb.get_collection("tasks").find({
            "user_id": user_id,
            "due_date": {"$gte": start_date_iso, "$lte": end_date_iso}
        }).to_list(length=None)
        
        # Calcular estadísticas de completado
        total_tasks = len(tasks)
        completed_tasks = sum(1 for task in tasks if task.get("completed", False))
        completion_percentage = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0)
        
        # Calcular estadísticas de puntualidad
        on_time = 0
        late = 0
        
        for task in tasks:
            if task.get("completed") and task.get("completed_date") and task.get("due_date"):
                completed_date = datetime.fromisoformat(task["completed_date"].replace('Z', '+00:00'))
                due_date = datetime.fromisoformat(task["due_date"].replace('Z', '+00:00'))
                if completed_date <= due_date:
                    on_time += 1
                else:
                    late += 1
        
        on_time_rate = round((on_time / completed_tasks * 100) if completed_tasks > 0 else 0)
        late_rate = round((late / completed_tasks * 100) if completed_tasks > 0 else 0)
        
        # Calcular distribución por materias
        subject_distribution = await calculate_subject_distribution(tasks)
        
        # Calcular actividad semanal
        weekly_activity = calculate_weekly_activity(tasks)
        
        return {
            "message": "Estadísticas calculadas correctamente",
            "user_id": user_id,
            "period": period,
            "data": {
                "task_completion": {
                    "total": total_tasks,
                    "completed": completed_tasks,
                    "percentage": completion_percentage
                },
                "punctuality": {
                    "on_time_rate": on_time_rate,
                    "late_rate": late_rate
                },
                "weekly_activity": weekly_activity,
                "subject_distribution": subject_distribution
            }
        }
    except Exception as e:
        # Capturar y devolver cualquier error para diagnóstico
        return {"error": str(e), "type": str(type(e))}


# --------- Endpoint: Tasa de puntualidad de tareas completadas ---------
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


# --------- Endpoint: Promedio de días para completar tareas ---------
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


# --------- Funciones auxiliares ---------

def calculate_weekly_activity(tasks):
    days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    activity = {day: 0 for day in days}

    for task in tasks:
        if task.get("completed") and task.get("completed_date"):
            completed_date = datetime.fromisoformat(task["completed_date"].replace('Z', '+00:00'))
            day = days[completed_date.weekday()]
            activity[day] += 1

    max_activity = max(activity.values()) if activity.values() else 1
    return [
        {"day": day, "percentage": round((count / max_activity * 100) if max_activity > 0 else 0)}
        for day, count in activity.items()
    ]


async def calculate_subject_distribution(tasks):
    subject_counts = {}
    total_tasks = len(tasks)
    
    if total_tasks == 0:
        return []

    for task in tasks:
        subject_id = task.get("subject_id")
        if subject_id:
            if subject_id not in subject_counts:
                subject = await mongodb.get_collection("subjects").find_one({"_id": ObjectId(subject_id)})
                subject_counts[subject_id] = {
                    "name": subject["name"] if subject else "Sin materia",
                    "color": subject["color"] if subject else "#808080",
                    "count": 0
                }
            subject_counts[subject_id]["count"] += 1

    return [
        {
            "name": data["name"],
            "color": data["color"],
            "percentage": round((data["count"] / total_tasks * 100) if total_tasks > 0 else 0)
        }
        for data in subject_counts.values()
    ]


@router.get("/test")
async def test_stats_router():
    return {"message": "Stats router is working"}