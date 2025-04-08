import random
from datetime import datetime, timedelta
import pytest
from bson import ObjectId
from services.task_service import TaskService
from services.task_prioritizer_service import TaskPrioritizer
from services.task_scheduler_service import TaskScheduler

# Definir plantillas de recordatorios como constantes
EXAM_REMINDER_TEMPLATES = [
    "Recuerda estudiar para el examen de {task_description} antes de {reminder_time}.",
    "Tienes que repasar para el examen de {task_description}. No lo dejes para el último momento.",
]

PROJECT_REMINDER_TEMPLATES = [
    "Asegúrate de avanzar en tu proyecto de {task_description}. Fecha límite: {reminder_time}.",
]

READING_REMINDER_TEMPLATES = [
    "Recuerda terminar la lectura de {task_description} antes de {reminder_time}.",
]

GENERAL_REMINDER_TEMPLATES = [
    "Recuerda {task_description} antes de {reminder_time}.",
]

class TaskScheduler:
    def generate_advanced_reminders(self, task_description: str, priority: int, due_date_dt: datetime, task_type: str) -> list:
        reminders = []
        current_date = datetime.now()

        delta_days = (due_date_dt - current_date).days

        if delta_days <= 0:
            return ["La tarea ya está vencida o es para hoy."]

        num_reminders = max(1, priority)
        if delta_days <= 3:
            num_reminders += 2

        reminder_dates = self._distribute_reminders(num_reminders, delta_days, current_date)
        reminder_templates = self._get_reminder_templates(task_type)

        for reminder_time in reminder_dates:
            reminder_template = random.choice(reminder_templates)
            reminder = reminder_template.format(task_description=task_description.lower(), reminder_time=reminder_time)
            reminders.append(reminder)

        return reminders

    def _distribute_reminders(self, num_reminders: int, delta_days: int, current_date: datetime) -> list:
        """Distribuye los recordatorios uniformemente hasta la fecha límite."""
        reminder_dates = []
        for i in range(num_reminders):
            if i == num_reminders - 1:
                reminder_time = current_date + timedelta(days=delta_days)
            else:
                reminder_time = current_date + timedelta(days=(i * delta_days // num_reminders))
            reminder_dates.append(reminder_time.strftime("%Y-%m-%d %H:%M:%S"))
        return reminder_dates

    def _get_reminder_templates(self, task_type: str) -> list:
        """Obtiene las plantillas de recordatorios según el tipo de tarea."""
        if task_type == "examen":
            return EXAM_REMINDER_TEMPLATES
        elif task_type == "proyecto":
            return PROJECT_REMINDER_TEMPLATES
        elif task_type == "lectura":
            return READING_REMINDER_TEMPLATES
        else:
            return GENERAL_REMINDER_TEMPLATES

@pytest.fixture
def task_service():
    return TaskService()

@pytest.fixture
def mock_user():
    return {
        "_id": ObjectId(),
        "username": "test_user",
        "email": "test@example.com"
    }

@pytest.fixture
def mock_subject():
    return {
        "_id": ObjectId(),
        "name": "Test Subject",
        "priority": 2
    }

class TestTaskService:
    # Test de clasificación de tipos de tarea
    @pytest.mark.parametrize("description,expected_type", [
        ("Examen de matemáticas", "examen"),
        ("Proyecto final de programación", "proyecto"),
        ("Leer capítulo 5", "lectura"),
        ("Hacer ejercicios", "general")
    ])
    def test_determine_task_type(self, task_service, description, expected_type):
        assert task_service._determine_task_type(description) == expected_type

    # Test de ajuste de prioridad
    @pytest.mark.parametrize("base_priority,task_type,estimated_time,expected_priority", [
        (1, "examen", 130, 5),    # base(1) + tipo(2) + tiempo(2) = 5
        (2, "proyecto", 100, 4),   # base(2) + tipo(1) + tiempo(1) = 4
        (1, "lectura", 60, 1),     # base(1) + tipo(0) + tiempo(0) = 1
        (3, "general", 120, 5)     # base(3) + tipo(0) + tiempo(2) = 5
    ])
    def test_adjust_priority_by_type_and_time(
        self, task_service, base_priority, task_type, estimated_time, expected_priority
    ):
        result = task_service._adjust_priority_by_type_and_time(
            base_priority, task_type, estimated_time
        )
        assert result == expected_priority, f"Expected {expected_priority} but got {result} for {base_priority}, {task_type}, {estimated_time}"

    # Test de procesamiento completo de tarea
    @pytest.mark.asyncio
    async def test_process_task(self, task_service, mock_user, mock_subject, monkeypatch):
        # Mock para la colección
        class MockCollection:
            async def find_one(self, query, *args, **kwargs):
                if "_id" in query:
                    if str(query["_id"]) == str(mock_user["_id"]):
                        return mock_user
                    elif str(query["_id"]) == str(mock_subject["_id"]):
                        return mock_subject
                return None

            async def insert_one(self, data):
                return MockInsertResult()

        class MockInsertResult:
            @property
            def inserted_id(self):
                return ObjectId()

        # Aplicar mock
        monkeypatch.setattr(
            "config.database.mongodb.get_collection",
            lambda x: MockCollection()
        )

        # Datos de prueba
        task_data = {
            "user_id": str(mock_user["_id"]),
            "subject_id": str(mock_subject["_id"]),
            "task_description": "Examen importante de matemáticas",
            "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "estimated_time": 120
        }

        # Ejecutar el proceso
        result = await task_service.process_task(**task_data)

        # Verificaciones
        assert result["task_type"] == "examen"
        assert isinstance(result["adjusted_priority"], int)
        assert 1 <= result["adjusted_priority"] <= 5
        assert isinstance(result["reminders"], list)
        assert len(result["reminders"]) > 0

    # Test de manejo de errores
    @pytest.mark.asyncio
    async def test_process_task_invalid_user(self, task_service):
        with pytest.raises(ValueError, match="ID de usuario o materia no válido"):
            await task_service.process_task(
                user_id="invalid_id",
                subject_id="invalid_id",
                task_description="Test task",
                due_date=datetime.now().isoformat(),
                estimated_time=30
            )
