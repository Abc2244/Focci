# database.py
from motor.motor_asyncio import AsyncIOMotorClient

class MongoDB:
    def __init__(self):
        self.client = AsyncIOMotorClient("mongodb+srv://focci:AjAT6cPe81cPB2n5@cluster0.chcvh.mongodb.net/BaseFocci?retryWrites=true&w=majority")
        self.db = self.client["BaseFocci"]

    def get_collection(self, collection_name):
        return self.db[collection_name]

mongodb = MongoDB()
