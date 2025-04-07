# routes/stats.py

from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime, timedelta
from config.database import mongodb
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        logger.info(f"Calculando estadísticas para usuario {user_id}, período {period}")
        
        # Obtener rango de fechas para el período
        start_date, end_date = get_date_range(period)
        logger.info(f"Rango de fechas: {start_date} a {end_date}")
        
        # Obtener todas las tareas del usuario (sin filtro de fecha para pruebas)
        logger.info(f"Consultando tareas para usuario {user_id}")
        tasks = await mongodb.get_collection("tasks").find({
            "user_id": user_id
        }).to_list(length=None)
        
        logger.info(f"Se encontraron {len(tasks)} tareas para el usuario")
        
        # Calcular estadísticas de completado
        total_tasks = len(tasks)
        completed_tasks = sum(1 for task in tasks if task.get("completed", False))
        completion_percentage = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0)
        
        logger.info(f"Estadísticas de completado: {completed_tasks}/{total_tasks} ({completion_percentage}%)")
        
        # Calcular estadísticas de puntualidad
        on_time = 0
        late = 0
        completed_tasks_with_dates = 0
        
        for task in tasks:
            if task.get("completed") and task.get("completed_date") is not None and task.get("due_date") is not None:
                try:
                    # Imprimir los valores originales para depuración
                    logger.info(f"Procesando tarea {task.get('_id')}")
                    logger.info(f"  completed_date original: {task.get('completed_date')} ({type(task.get('completed_date'))})")
                    logger.info(f"  due_date original: {task.get('due_date')} ({type(task.get('due_date'))})")
                    
                    # Convertir fechas a formato datetime
                    completed_date = None
                    due_date = None
                    
                    # Manejar completed_date
                    if isinstance(task["completed_date"], str):
                        try:
                            # Intentar ISO format
                            if 'Z' in task["completed_date"]:
                                completed_date_str = task["completed_date"].replace('Z', '+00:00')
                            else:
                                completed_date_str = task["completed_date"]
                            completed_date = datetime.fromisoformat(completed_date_str)
                        except ValueError:
                            # Intentar formato alternativo
                            completed_date = datetime.strptime(task["completed_date"], "%Y-%m-%dT%H:%M:%S.%f")
                    else:
                        completed_date = task["completed_date"]
                    
                    # Manejar due_date
                    if isinstance(task["due_date"], str):
                        try:
                            # Intentar ISO format
                            if 'Z' in task["due_date"]:
                                due_date_str = task["due_date"].replace('Z', '+00:00')
                            else:
                                due_date_str = task["due_date"]
                            due_date = datetime.fromisoformat(due_date_str)
                        except ValueError:
                            # Intentar formato alternativo
                            due_date = datetime.strptime(task["due_date"], "%Y-%m-%dT%H:%M:%S.%f")
                    else:
                        due_date = task["due_date"]
                    
                    # Verificar que ambas fechas se hayan convertido correctamente
                    if completed_date and due_date:
                        # Asegurarse de que ambas fechas sean del mismo tipo (naive o aware)
                        if completed_date.tzinfo is None and due_date.tzinfo is not None:
                            # Convertir completed_date a aware usando la misma zona horaria que due_date
                            completed_date = completed_date.replace(tzinfo=due_date.tzinfo)
                        elif completed_date.tzinfo is not None and due_date.tzinfo is None:
                            # Convertir due_date a aware usando la misma zona horaria que completed_date
                            due_date = due_date.replace(tzinfo=completed_date.tzinfo)
                        
                        completed_tasks_with_dates += 1
                        logger.info(f"  Fechas convertidas: completed_date={completed_date}, due_date={due_date}")
                        
                        # Comparar fechas para determinar si se completó a tiempo
                        if completed_date <= due_date:
                            on_time += 1
                            logger.info(f"  ✓ Tarea completada A TIEMPO: {task.get('_id')}")
                        else:
                            late += 1
                            logger.info(f"  ✗ Tarea completada CON RETRASO: {task.get('_id')}")
                    else:
                        logger.error(f"  No se pudieron convertir ambas fechas para la tarea {task.get('_id')}")
                except Exception as e:
                    logger.error(f"Error al procesar fechas de tarea {task.get('_id')}: {str(e)}")
                    logger.error(f"Valores de fechas: completed_date={task.get('completed_date')}, due_date={task.get('due_date')}")
        
        # Imprimir resumen antes de calcular porcentajes
        logger.info(f"Resumen de puntualidad: {on_time} tareas a tiempo, {late} tareas con retraso, de un total de {completed_tasks_with_dates} tareas con fechas válidas")
        
        # Calcular porcentajes basados en tareas con fechas válidas
        if completed_tasks_with_dates > 0:
            on_time_rate = round((on_time / completed_tasks_with_dates) * 100)
            late_rate = round((late / completed_tasks_with_dates) * 100)
            
            # Asegurarse de que sumen 100%
            if on_time_rate + late_rate != 100:
                # Si hay discrepancia, ajustar para que sumen 100%
                if on_time_rate + late_rate > 100:
                    # Si suman más de 100, ajustar el mayor
                    if on_time_rate > late_rate:
                        on_time_rate = 100 - late_rate
                    else:
                        late_rate = 100 - on_time_rate
                else:
                    # Si suman menos de 100, distribuir la diferencia
                    diff = 100 - (on_time_rate + late_rate)
                    if on_time > 0 and late > 0:
                        # Si hay tareas en ambas categorías, distribuir proporcionalmente
                        on_time_rate += diff // 2
                        late_rate += diff - (diff // 2)
                    elif on_time > 0:
                        on_time_rate += diff
                    else:
                        late_rate += diff
        else:
            on_time_rate = 0
            late_rate = 0
        
        logger.info(f"Estadísticas de puntualidad finales: A tiempo {on_time}/{completed_tasks_with_dates} ({on_time_rate}%), Con retraso {late}/{completed_tasks_with_dates} ({late_rate}%)")
        
        # Calcular distribución por materias
        logger.info("Calculando distribución por materias")
        subject_distribution = await calculate_subject_distribution(tasks)
        
        # Calcular actividad semanal
        logger.info("Calculando actividad semanal")
        weekly_activity = calculate_weekly_activity(tasks)
        
        response_data = {
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
        
        logger.info("Estadísticas calculadas correctamente")
        return response_data
    except Exception as e:
        # Capturar y devolver cualquier error para diagnóstico
        logger.error(f"Error al calcular estadísticas: {str(e)}", exc_info=True)
        return {"error": str(e), "type": str(type(e))}


# --------- Endpoint: Tasa de puntualidad de tareas completadas ---------
@router.get("/users/{user_id}/completion")
async def get_completion_stats(user_id: str):
    try:
        logger.info(f"Calculando estadísticas de completado para usuario {user_id}")
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

        result = {
            "onTimeRate": round((on_time / total_completed * 100) if total_completed > 0 else 0, 2),
            "lateRate": round((late / total_completed * 100) if total_completed > 0 else 0, 2)
        }
        logger.info(f"Estadísticas de completado calculadas: {result}")
        return result
    except Exception as e:
        logger.error(f"Error al calcular estadísticas de completado: {str(e)}", exc_info=True)
        return {"error": str(e), "type": str(type(e))}


# --------- Endpoint: Promedio de días para completar tareas ---------
@router.get("/users/{user_id}/time")
async def get_time_stats(user_id: str):
    try:
        logger.info(f"Calculando estadísticas de tiempo para usuario {user_id}")
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

        result = {
            "averageDays": round(total_days / count if count > 0 else 0, 1)
        }
        logger.info(f"Estadísticas de tiempo calculadas: {result}")
        return result
    except Exception as e:
        logger.error(f"Error al calcular estadísticas de tiempo: {str(e)}", exc_info=True)
        return {"error": str(e), "type": str(type(e))}


# --------- Funciones auxiliares ---------

def calculate_weekly_activity(tasks):
    try:
        days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
        activity = {day: 0 for day in days}

        for task in tasks:
            if task.get("completed") and task.get("completed_date"):
                completed_date = datetime.fromisoformat(task["completed_date"].replace('Z', '+00:00'))
                day = days[completed_date.weekday()]
                activity[day] += 1

        max_activity = max(activity.values()) if activity.values() else 1
        result = [
            {"day": day, "percentage": round((count / max_activity * 100) if max_activity > 0 else 0)}
            for day, count in activity.items()
        ]
        logger.info(f"Actividad semanal calculada: {result}")
        return result
    except Exception as e:
        logger.error(f"Error al calcular actividad semanal: {str(e)}", exc_info=True)
        return []


async def calculate_subject_distribution(tasks):
    try:
        subject_counts = {}
        total_tasks = len(tasks)
        
        if total_tasks == 0:
            logger.info("No hay tareas para calcular distribución por materias")
            return []

        for task in tasks:
            subject_id = task.get("subject_id")
            if subject_id:
                if subject_id not in subject_counts:
                    logger.info(f"Buscando información de materia {subject_id}")
                    subject = await mongodb.get_collection("subjects").find_one({"_id": ObjectId(subject_id)})
                    if subject:
                        logger.info(f"Materia encontrada: {subject.get('name', 'Sin nombre')}")
                        # Usar un color predeterminado si no existe
                        color = subject.get("color", "#808080")
                        subject_counts[subject_id] = {
                            "name": subject.get("name", "Sin nombre"),
                            "color": color,
                            "count": 0
                        }
                    else:
                        logger.warning(f"No se encontró la materia con ID {subject_id}")
                        # Si no se encuentra la materia, usar valores predeterminados
                        subject_counts[subject_id] = {
                            "name": "Materia desconocida",
                            "color": "#808080",
                            "count": 0
                        }
                subject_counts[subject_id]["count"] += 1

        result = [
            {
                "name": data["name"],
                "color": data["color"],
                "percentage": round((data["count"] / total_tasks * 100) if total_tasks > 0 else 0)
            }
            for data in subject_counts.values()
        ]
        logger.info(f"Distribución por materias calculada: {result}")
        return result
    except Exception as e:
        logger.error(f"Error al calcular distribución por materias: {str(e)}", exc_info=True)
        return []


@router.get("/test")
async def test_stats_router():
    logger.info("Test de router de estadísticas")
    return {"message": "Stats router is working"}