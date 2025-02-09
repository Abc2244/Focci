import pytest
import httpx
import uuid

BASE_URL = "http://127.0.0.1:8000/"

@pytest.fixture
def client():
    return httpx.Client(base_url=BASE_URL)

@pytest.fixture
def unique_email():
    """Genera un correo único para cada ejecución"""
    return f"testuser_{uuid.uuid4().hex[:8]}@example.com"

@pytest.fixture
def user_data(client, unique_email):
    """Registra un usuario nuevo y devuelve sus credenciales"""
    response = client.post("register/", json={
        "username": "testuser",
        "email": unique_email,
        "password": "test123"
    })
    assert response.status_code == 200
    data = response.json()
    return {"user_id": data["user_id"], "email": unique_email, "password": "test123"}

@pytest.fixture
def access_token(client, user_data):
    """Inicia sesión con el usuario recién creado"""
    response = client.post("login/", json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    assert response.status_code == 200
    data = response.json()
    return data["access_token"]

@pytest.fixture
def subject_id(client, access_token, user_data):
    """Crea una materia y devuelve su ID"""
    response = client.post("subjects/", json={
        "user_id": user_data["user_id"],
        "name": "Matemáticas",
        "credits": 3,
        "schedule": ["Lunes", "Miércoles", "Viernes"]
    }, headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    data = response.json()
    return data["subject_id"]

@pytest.fixture
def task_id(client, access_token, user_data, subject_id):
    """Crea una tarea y devuelve su ID"""
    response = client.post("tasks/", json={
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
def reminder_id(client, access_token, user_data, task_id):
    """Crea un recordatorio y devuelve su ID"""
    response = client.post("reminders/", json={
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

# 1️⃣ Test de Registro de Usuario
def test_register_user(user_data):
    assert "user_id" in user_data

# 2️⃣ Test de Login
def test_login_user(access_token):
    assert access_token is not None

# 3️⃣ Obtener Usuario Actual
def test_get_current_user(client, access_token):
    response = client.get("me/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    data = response.json()
    assert "email" in data

# 4️⃣ Crear Materia
def test_create_subject(subject_id):
    assert subject_id is not None

# 5️⃣ Crear Tarea
def test_create_task(task_id):
    assert task_id is not None

# 6️⃣ Crear Recordatorio
def test_create_reminder(reminder_id):
    assert reminder_id is not None

# 7️⃣ Marcar tarea como completada
def test_complete_task(client, access_token, task_id):
    response = client.patch(f"tasks/{task_id}/complete/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Tarea marcada como completada"

# 8️⃣ Eliminar Usuario
def test_delete_user(client, access_token, user_data):
    response = client.delete(f"users/{user_data['user_id']}/", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Usuario eliminado"

# 🔥 **Ejecución Automática**
if __name__ == "__main__":
    pytest.main(["-v", "test_focci_api.py"])
