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
async def get_tasks_stats(user_id: str, period: str):
    print(f"Recibida solicitud para stats de usuario {user_id}, periodo {period}")
    start_date, end_date = get_date_range(period)

    # Modificamos la consulta para obtener todas las tareas del usuario
    # sin filtrar por created_at ya que ese campo no existe en el modelo
    tasks = await mongodb.get_collection("tasks").find({
        "user_id": user_id
    }).to_list(length=None)
    
    print(f"Tareas encontradas: {len(tasks)}")
    
    # Filtramos las tareas por fecha de creación si tienen ese campo
    # o por due_date si no tienen created_at
    filtered_tasks = []
    for task in tasks:
        # Usamos due_date como referencia temporal si no hay created_at
        task_date = None
        if "created_at" in task:
            try:
                task_date = datetime.fromisoformat(task["created_at"].replace('Z', '+00:00'))
            except:
                pass
                
        if not task_date and "due_date" in task:
            try:
                task_date = datetime.fromisoformat(task["due_date"].replace('Z', '+00:00'))
            except:
                pass
                
        if task_date and start_date <= task_date <= end_date:
            filtered_tasks.append(task)
    
    print(f"Tareas filtradas por periodo: {len(filtered_tasks)}")
    
    # Usamos las tareas filtradas para las estadísticas
    total_tasks = len(filtered_tasks)
    completed_tasks = sum(1 for task in filtered_tasks if task.get("completed", False))
    on_time = 0
    late = 0

    for task in filtered_tasks:
        if task.get("completed") and task.get("completed_date") and task.get("due_date"):
            try:
                completed_date = datetime.fromisoformat(task["completed_date"].replace('Z', '+00:00'))
                due_date = datetime.fromisoformat(task["due_date"].replace('Z', '+00:00'))
                if completed_date <= due_date:
                    on_time += 1
                else:
                    late += 1
            except Exception as e:
                print(f"Error procesando fechas: {e}")

    weekly_activity = calculate_weekly_activity(filtered_tasks)
    subject_distribution = await calculate_subject_distribution(filtered_tasks)

    stats_result = {
        "tasksCreated": total_tasks,
        "tasksCompleted": completed_tasks,
        "completionRate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2),
        "onTimeRate": round((on_time / completed_tasks * 100) if completed_tasks > 0 else 0, 2),
        "lateRate": round((late / completed_tasks * 100) if completed_tasks > 0 else 0, 2),
        "weeklyActivity": weekly_activity,
        "subjectDistribution": subject_distribution
    }
    
    print(f"Estadísticas calculadas: {stats_result}")
    return stats_result


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