from motor.motor_asyncio import AsyncIOMotorClient

class MongoDB:
    def __init__(self, db_uri, db_name):
        self.client = AsyncIOMotorClient(db_uri)
        self.db = self.client[db_name]

    async def get_collection(self, collection_name):
        return self.db[collection_name]

# Configura la conexión a la base de datos
mongodb = MongoDB(
    db_uri="mongodb+srv://felipe:1234@cluster0.wpbeio6.mongodb.net/BaseFocci?retryWrites=true&w=majority",
    db_name="BaseFocci"
)
