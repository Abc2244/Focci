import pytest
import pytest_asyncio
from bson import ObjectId
from datetime import datetime, timezone, timedelta

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
                return None
            return None

        async def insert_one(self, document):
            class InsertOneResult:
                def __init__(self, inserted_id):
                    self.inserted_id = inserted_id
            return InsertOneResult("test_id")

        def find(self, query=None):
            keywords_data = [
                {
                    "type": "examen",
                    "keywords": ["examen", "prueba", "evaluación", "test", "quiz"],
                    "weight": 2.0,
                    "context": ["estudiar", "preparar", "repasar"]
                },
                {
                    "type": "proyecto",
                    "keywords": ["proyecto", "trabajo", "desarrollo", "implementación"],
                    "weight": 1.5,
                    "context": ["equipo", "planear", "diseñar"]
                },
                {
                    "type": "lectura",
                    "keywords": ["lectura", "leer", "libro", "capítulo", "artículo"],
                    "weight": 1.0,
                    "context": ["comprender", "analizar", "resumir"]
                }
            ]
            return MockCursor(keywords_data)

    class MockDB:
        def get_collection(self, name):
            return MockCollection(name)

    # Aplicar el mock a la base de datos
    from config.database import mongodb
    mock_db = MockDB()
    monkeypatch.setattr(mongodb, "get_collection", mock_db.get_collection)

    return mock_db 