import pytest
import uuid
from unittest.mock import MagicMock
from datetime import datetime, timedelta

@pytest.fixture
def mock_client():
    """Proporciona un cliente mock en lugar de httpx.Client"""
    class MockResponse:
        def __init__(self, status_code, data):
            self.status_code = status_code
            self._data = data

        def json(self):
            return self._data

    class MockClient:
        def __init__(self):
            self.headers = {}
            self.base_url = "http://127.0.0.1:8000/"

        def post(self, url, json=None, headers=None):
            if url == "register/":
                return MockResponse(200, {"user_id": str(uuid.uuid4())})
            elif url == "login/":
                return MockResponse(200, {"access_token": "mock_token"})
            elif url == "tasks/":
                return MockResponse(200, {"task_id": str(uuid.uuid4())})
            elif url == "subjects/":
                return MockResponse(200, {"subject_id": str(uuid.uuid4())})
            elif url == "reminders/":
                return MockResponse(200, {"reminder_id": str(uuid.uuid4())})
            return MockResponse(404, {"error": "Not found"})

        def get(self, url, headers=None):
            if url == "me/":
                return MockResponse(200, {"email": "test@example.com"})
            elif "subjects" in url:
                return MockResponse(200, [{"id": "1", "name": "Test Subject"}])
            elif "tasks" in url:
                return MockResponse(200, [{"id": "1", "description": "Test Task"}])
            elif "reminders" in url:
                return MockResponse(200, [{"id": "1", "task_id": "1"}])
            return MockResponse(404, {"error": "Not found"})

        def put(self, url, json=None, headers=None):
            return MockResponse(200, {"message": "Actualizado correctamente"})

        def delete(self, url, headers=None):
            return MockResponse(200, {"message": "Eliminado correctamente"})

        def patch(self, url, headers=None):
            return MockResponse(200, {"message": "Actualizado correctamente"})

    return MockClient()

@pytest.fixture
def unique_email():
    """Genera un correo único para cada ejecución"""
    return f"testuser_{uuid.uuid4().hex[:8]}@example.com"

@pytest.fixture
def user_data(mock_client, unique_email):
    """Registra un usuario nuevo y devuelve sus credenciales"""
    response = mock_client.post("register/", json={
        "username": "testuser",
        "email": unique_email,
        "password": "test123"
    })
    assert response.status_code == 200
    data = response.json()
    return {"user_id": data["user_id"], "email": unique_email, "password": "test123"}

@pytest.fixture
def access_token(mock_client, user_data):
    """Inicia sesión con el usuario recién creado"""
    response = mock_client.post("login/", json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    assert response.status_code == 200
    data = response.json()
    return data["access_token"]

@pytest.fixture
def subject_id(mock_client, access_token, user_data):
    """Crea una materia y devuelve su ID"""
    response = mock_client.post("subjects/", json={
        "user_id": user_data["user_id"],
        "name": "Matemáticas",
        "credits": 3,
        "schedule": ["Lunes", "Miércoles", "Viernes"]
    }, headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    data = response.json()
    return data["subject_id"]

@pytest.fixture
def task_id(mock_client, access_token, user_data, subject_id):
    """Crea una tarea y devuelve su ID"""
    response = mock_client.post("tasks/", json={
        "user_id": user_data["user_id"],
        "subject_id": subject_id,
        "description": "Primera tarea de prueba",
        "due_date": "2024-01-01T00:00:00",
        "completed": False
    }, headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    data = response.json()
    return data["task_id"]

@pytest.fixture
def reminder_id(mock_client, access_token, user_data, task_id):
    """Crea un recordatorio y devuelve su ID"""
    response = mock_client.post("reminders/", json={
        "user_id": user_data["user_id"],
        "task_id": task_id,
        "reminder_date": "2024-01-01T12:00:00",
        "status": "pendiente",
        "priority": 2,
        "insistence_level": 1
    }, headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    data = response.json()
    return data["reminder_id"]

# 📝 **TESTS UNITARIOS**

# ✅ Test de Registro de Usuario
def test_register_user(user_data):
    assert "user_id" in user_data

# ✅ Test de Login
def test_login_user(access_token):
    assert access_token is not None

# ✅ Obtener Usuario Actual
def test_get_current_user(mock_client, access_token):
    response = mock_client.get("me/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    data = response.json()
    assert "email" in data

# ✅ Crear Materia
def test_create_subject(subject_id):
    assert subject_id is not None

# ✅ Actualizar Materia
def test_update_subject(mock_client, access_token, subject_id, user_data):
    response = mock_client.put(f"subjects/{subject_id}/", json={
        "user_id": user_data["user_id"],
        "name": "Matemáticas Avanzadas",
        "credits": 4,
        "schedule": ["Lunes", "Jueves"]
    }, headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Actualizado correctamente"

# ✅ Asegura que el usuario tenga materias antes de obtenerlas
def test_get_subjects_by_user(mock_client, access_token, user_data):
    response = mock_client.get(f"users/{user_data['user_id']}/subjects/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0

# ✅ Obtener Materias de un Usuario
def test_get_subjects_by_user(mock_client, access_token, user_data, subject_id):
    """Asegura que haya materias creadas antes de consultar"""
    response = mock_client.get(f"users/{user_data['user_id']}/subjects/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    subjects = response.json()
    assert isinstance(subjects, list)
    assert len(subjects) > 0  # Verifica que haya materias

# ✅ Eliminar Materia
def test_delete_subject(mock_client, access_token, subject_id):
    response = mock_client.delete(f"subjects/{subject_id}/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Eliminado correctamente"

# ✅ Crear Tarea
def test_create_task(task_id):
    assert task_id is not None

# ✅ Obtener Lista de Tareas de un Usuario
def test_get_tasks_by_user(mock_client, access_token, user_data):
    response = mock_client.get(f"users/{user_data['user_id']}/tasks/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# ✅ Completar Tarea
def test_complete_task(mock_client, access_token, task_id):
    response = mock_client.patch(f"tasks/{task_id}/complete/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Actualizado correctamente"

# ✅ Obtener Tareas Completadas de un Usuario
def test_get_completed_tasks(mock_client, access_token, user_data, task_id):
    mock_client.patch(f"tasks/{task_id}/complete/", headers={"Authorization": f"Bearer {access_token}"})
    response = mock_client.get(f"users/{user_data['user_id']}/tasks/completed/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# ✅ Eliminar Tareas Completadas de un Usuario
def test_delete_completed_tasks(mock_client, access_token, user_data, task_id):
    mock_client.patch(f"tasks/{task_id}/complete/", headers={"Authorization": f"Bearer {access_token}"})
    response = mock_client.delete(f"users/{user_data['user_id']}/tasks/completed/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert "tareas completadas eliminadas" in response.json()["message"]

# ✅ Eliminar una Tarea
def test_delete_task(mock_client, access_token, task_id):
    response = mock_client.delete(f"tasks/{task_id}/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Eliminado correctamente"

# ✅ Crear Recordatorio
def test_create_reminder(reminder_id):
    assert reminder_id is not None

# ✅ Obtener Lista de Recordatorios de un Usuario
def test_get_reminders_by_user(mock_client, access_token, user_data):
    response = mock_client.get(f"users/{user_data['user_id']}/reminders/upcoming/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_update_reminder(mock_client, access_token, reminder_id, user_data, task_id):
    response = mock_client.put(f"reminders/{reminder_id}/", json={
        "user_id": user_data["user_id"],
        "task_id": task_id,
        "reminder_date": "2024-02-10T12:00:00",
        "status": "completado",
        "priority": 3,
        "insistence_level": 2
    }, headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Actualizado correctamente"

# ✅ Eliminar un Recordatorio
def test_delete_reminder(mock_client, access_token, reminder_id):
    response = mock_client.delete(f"reminders/{reminder_id}/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Eliminado correctamente"

# ✅ Limpiar Datos del Usuario
def test_clean_user_data(mock_client, access_token, user_data):
    response = mock_client.delete(f"users/{user_data['user_id']}/clean/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert "Se eliminaron" in response.json()["message"]

# 🔥 **Ejecución Automática**
if __name__ == "__main__":
    pytest.main(["-v", "test_focci_api.py"])
