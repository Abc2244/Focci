import random
from datetime import datetime, timedelta
import pytest
import pytest_asyncio
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

@pytest_asyncio.fixture
async def task_service(mock_database):
    """Fixture para proporcionar una instancia de TaskService con mock de base de datos"""
    service = TaskService()
    await service.initialize()
    return service

@pytest_asyncio.fixture
def mock_user():
    """Fixture para proporcionar un usuario de prueba"""
    return {
        "_id": ObjectId(),
        "email": "test@example.com",
        "username": "test_user"
    }

@pytest_asyncio.fixture
def mock_subject():
    """Fixture para proporcionar una materia de prueba"""
    return {
        "_id": ObjectId(),
        "name": "Test Subject",
        "priority": 2
    }

class TestTaskService:
    @pytest.mark.asyncio
    async def test_determine_task_type(self, task_service):
        """Prueba la determinación del tipo de tarea"""
        test_cases = [
            ("Examen de matemáticas", "examen"),
            ("Proyecto final de programación", "proyecto"),
            ("Leer capítulo 5", "lectura"),
            ("Hacer ejercicios", "general")
        ]
        
        for description, expected_type in test_cases:
            result = task_service._determine_task_type(description)
            assert result == expected_type, f"Se esperaba '{expected_type}' para '{description}'"

    @pytest.mark.asyncio
    async def test_adjust_priority_by_type_and_time(self, task_service):
        """Prueba el ajuste de prioridad por tipo y tiempo"""
        test_cases = [
            (1, "examen", 130, 5),  # Alta prioridad por ser examen y largo
            (2, "proyecto", 100, 4),  # Prioridad media-alta por ser proyecto
            (1, "lectura", 60, 1),   # Prioridad base para lectura corta
            (3, "general", 120, 5)   # Prioridad alta por tiempo largo
        ]
        
        for base_priority, task_type, estimated_time, expected in test_cases:
            result = task_service._adjust_priority_by_type_and_time(
                base_priority, task_type, estimated_time
            )
            assert result == expected

    @pytest.mark.asyncio
    async def test_process_task(self, task_service, mock_user, mock_subject, mock_database, monkeypatch):
        """Prueba el procesamiento completo de una tarea"""
        # Configurar el mock para que devuelva el usuario y la materia correctos
        class MockCollection:
            def __init__(self, collection_name):
                self.collection_name = collection_name

            async def find_one(self, query):
                if "_id" in query:
                    if str(query["_id"]) == str(mock_user["_id"]) and self.collection_name == "users":
                        return mock_user
                    elif str(query["_id"]) == str(mock_subject["_id"]) and self.collection_name == "subjects":
                        return mock_subject
                return None

            async def insert_one(self, document):
                class InsertOneResult:
                    def __init__(self, inserted_id):
                        self.inserted_id = inserted_id
                return InsertOneResult(ObjectId())

        class MockDB:
            def get_collection(self, name):
                return MockCollection(name)

        # Aplicar el mock a la base de datos
        from config.database import mongodb
        mock_db = MockDB()
        monkeypatch.setattr(mongodb, "get_collection", mock_db.get_collection)

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

        # Verificar el resultado
        assert result["task_type"] == "examen"
        assert result["adjusted_priority"] >= 1
        assert result["insistence_level"] >= 1
        assert "reminders" in result
        assert "classification_confidence" in result

    @pytest.mark.asyncio
    async def test_process_task_invalid_user(self, task_service, monkeypatch):
        """Prueba el procesamiento de una tarea con usuario inválido"""
        class MockCollection:
            async def find_one(self, query):
                return None

            async def insert_one(self, document):
                class InsertOneResult:
                    def __init__(self, inserted_id):
                        self.inserted_id = inserted_id
                return InsertOneResult(ObjectId())

        class MockDB:
            def get_collection(self, name):
                return MockCollection()

        # Aplicar el mock a la base de datos
        from config.database import mongodb
        mock_db = MockDB()
        monkeypatch.setattr(mongodb, "get_collection", mock_db.get_collection)

        # Datos de prueba con usuario inválido
        task_data = {
            "user_id": str(ObjectId()),
            "subject_id": str(ObjectId()),
            "task_description": "Tarea de prueba",
            "due_date": datetime.now().isoformat(),
            "estimated_time": 60
        }

        # Verificar que se lanza la excepción correcta
        with pytest.raises(ValueError, match="Error al procesar la tarea: Usuario o materia no encontrados"):
            await task_service.process_task(**task_data)
