# database.py
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(dotenv_path="/Users/juliveevart/Documents/University/Focci/Back/.env")
print("MONGO_URI =", os.getenv("MONGO_URI"))
print("MONGO_DB  =", os.getenv("MONGO_DB"))
print("SECRET_KEY =", os.getenv("SECRET_KEY"))

class MongoDB:
    def __init__(self):
        self.client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
        self.db = self.client[os.getenv("MONGO_DB")]

    def get_collection(self, collection_name):
        return self.db[collection_name]

mongodb = MongoDB()
