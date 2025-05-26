import pytest
import pytest_asyncio
from bson import ObjectId
from datetime import datetime, timezone, timedelta

# IDs de prueba constantes
TEST_USER_ID = "507f1f77bcf86cd799439011"
TEST_SUBJECT_ID = "507f1f77bcf86cd799439012"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="function")
async def mock_database(monkeypatch):
    """Fixture para proporcionar un mock de la base de datos"""
    class MockCursor:
        def __init__(self, data):
            self.data = data

        async def to_list(self, length=None):
            return self.data

    class MockCollection:
        def __init__(self, collection_name):
            self.collection_name = collection_name
            self.test_data = {
                "users": {
                    "valid_id": {
                        "_id": ObjectId("507f1f77bcf86cd799439011"),
                        "email": "test@example.com",
                        "username": "test_user"
                    }
                },
                "subjects": {
                    "valid_id": {
                        "_id": ObjectId("507f1f77bcf86cd799439012"),
                        "name": "Test Subject",
                        "priority": 1
                    }
                },
                "tasks": {},
                "reminders": {},
                "task_keywords": {
                    "exam": {
                        "type": "examen",
                        "keywords": ["examen", "prueba", "evaluación", "test", "quiz"],
                        "weight": 2.0,
                        "context": ["estudiar", "preparar", "repasar"]
                    },
                    "project": {
                        "type": "proyecto",
                        "keywords": ["proyecto", "trabajo", "desarrollo", "implementación"],
                        "weight": 1.5,
                        "context": ["equipo", "planear", "diseñar"]
                    },
                    "reading": {
                        "type": "lectura",
                        "keywords": ["lectura", "leer", "libro", "capítulo", "artículo"],
                        "weight": 1.0,
                        "context": ["comprender", "analizar", "resumir"]
                    }
                }
            }

        async def find_one(self, query):
            if "_id" in query:
                _id = query["_id"]
                collection_data = self.test_data.get(self.collection_name, {})
                
                # Si el ID es un ObjectId, convertirlo a string para comparación
                if isinstance(_id, ObjectId):
                    _id = str(_id)
                
                # Buscar en los datos de prueba
                for item in collection_data.values():
                    if str(item["_id"]) == _id:
                        return item
                
                # Si no se encuentra y es un ID inválido, retornar None
                if _id not in [TEST_USER_ID, TEST_SUBJECT_ID]:
                    return None
                
                # Si no se encuentra, crear un nuevo documento para pruebas
                if self.collection_name == "users":
                    return {"_id": _id, "email": "test@example.com", "username": "test_user"}
                elif self.collection_name == "subjects":
                    return {"_id": _id, "name": "Test Subject", "priority": 1}
                
            return None

        async def insert_one(self, document):
            class InsertOneResult:
                def __init__(self, inserted_id):
                    self.inserted_id = inserted_id

            # Generar un nuevo ObjectId si no se proporciona
            if "_id" not in document:
                document["_id"] = ObjectId()

            # Almacenar el documento en test_data
            self.test_data[self.collection_name][str(document["_id"])] = document
            return InsertOneResult(document["_id"])

        async def delete_one(self, query):
            class DeleteResult:
                def __init__(self, deleted_count):
                    self.deleted_count = deleted_count

            if "_id" in query:
                _id = str(query["_id"])
                if _id in self.test_data.get(self.collection_name, {}):
                    del self.test_data[self.collection_name][_id]
                    return DeleteResult(1)
            return DeleteResult(0)

        async def delete_many(self, query):
            class DeleteResult:
                def __init__(self, deleted_count):
                    self.deleted_count = deleted_count
            
            deleted = 0
            if "completed" in query and query["completed"]:
                tasks = self.test_data.get("tasks", {})
                completed_tasks = {k: v for k, v in tasks.items() if v.get("completed", False)}
                for task_id in completed_tasks:
                    del tasks[task_id]
                    deleted += 1
            return DeleteResult(deleted)

        def find(self, query=None):
            if self.collection_name == "task_keywords":
                return MockCursor(list(self.test_data["task_keywords"].values()))
            
            # Para otras colecciones, devolver los datos almacenados
            collection_data = list(self.test_data.get(self.collection_name, {}).values())
            return MockCursor(collection_data)

        async def update_one(self, query, update, upsert=False):
            class UpdateResult:
                def __init__(self, modified_count):
                    self.modified_count = modified_count

            if "_id" in query:
                _id = str(query["_id"])
                if _id in self.test_data.get(self.collection_name, {}):
                    doc = self.test_data[self.collection_name][_id]
                    if "$set" in update:
                        doc.update(update["$set"])
                    return UpdateResult(1)
            return UpdateResult(0)

    class MockDB:
        def get_collection(self, name):
            return MockCollection(name)

    # Aplicar el mock a la base de datos
    from config.database import mongodb
    mock_db = MockDB()
    monkeypatch.setattr(mongodb, "get_collection", mock_db.get_collection)

    return mock_db 