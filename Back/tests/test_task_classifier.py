import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from services.task_classifier_service import TaskClassifier
from services.task_service import TaskService

# Datos de prueba
TEST_USER_ID = "507f1f77bcf86cd799439011"  # ID del usuario de prueba del mock
TEST_SUBJECT_ID = "507f1f77bcf86cd799439012"  # ID de la materia de prueba del mock

TEST_CASES = [
    {
        "description": "Examen de matemáticas",
        "expected_type": "examen",
        "due_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "estimated_time": 120,
        "min_priority": 3
    },
    {
        "description": "Proyecto final de programación",
        "expected_type": "proyecto",
        "due_date": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
        "estimated_time": 240,
        "min_priority": 4
    },
    {
        "description": "Leer capítulo 5 del libro",
        "expected_type": "lectura",
        "due_date": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
        "estimated_time": 60,
        "min_priority": 2
    }
]

@pytest_asyncio.fixture
async def task_classifier():
    """Fixture para proporcionar una instancia de TaskClassifier"""
    classifier = TaskClassifier()
    await classifier.initialize()
    return classifier

@pytest_asyncio.fixture
async def task_service(mock_database):
    """Fixture para proporcionar una instancia de TaskService con mock de base de datos"""
    service = TaskService()
    await service.initialize()
    return service

@pytest.mark.asyncio
async def test_task_classification(task_classifier):
    """Prueba la clasificación de tareas"""
    for test_case in TEST_CASES:
        result = await task_classifier.classify_task(test_case["description"])
        assert result["task_type"] == test_case["expected_type"]
        assert "classification_confidence" in result
        assert 0 <= result["classification_confidence"] <= 1

@pytest.mark.asyncio
async def test_task_processing(task_service):
    """Prueba el procesamiento completo de tareas"""
    for test_case in TEST_CASES:
        result = await task_service.process_task(
            user_id=TEST_USER_ID,
            subject_id=TEST_SUBJECT_ID,
            task_description=test_case["description"],
            due_date=test_case["due_date"],
            estimated_time=test_case["estimated_time"]
        )

        # Verificar estructura básica del resultado
        assert "task_id" in result
        assert "task_type" in result
        assert "adjusted_priority" in result
        assert "insistence_level" in result
        assert "reminders" in result
        assert "classification_confidence" in result

        # Verificar tipo de tarea
        assert result["task_type"] == test_case["expected_type"]

        # Verificar que la prioridad cumple con el mínimo esperado
        assert result["adjusted_priority"] >= test_case["min_priority"]

        # Verificar que la prioridad está en el rango correcto
        assert 1 <= result["adjusted_priority"] <= 5

        # Verificar que hay recordatorios generados
        assert len(result["reminders"]) > 0

        # Verificar confianza de clasificación
        assert 0 <= result["classification_confidence"] <= 1

@pytest.mark.asyncio
async def test_priority_keywords(task_service):
    """Prueba las palabras clave de prioridad"""
    high_priority_descriptions = [
        "Examen urgente de matemáticas",
        "Proyecto crítico de programación",
        "Entrega inmediata del informe",
        "Tarea crucial para mañana",
        "Presentación importante y urgente"
    ]

    for description in high_priority_descriptions:
        result = await task_service.process_task(
            user_id=TEST_USER_ID,
            subject_id=TEST_SUBJECT_ID,
            task_description=description,
            due_date=(datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            estimated_time=60
        )

        # Verificar que la prioridad es alta debido a las palabras clave
        assert result["adjusted_priority"] >= 4, f"La tarea '{description}' debería tener prioridad alta"

if __name__ == "__main__":
    pytest.main(["-v", __file__]) 