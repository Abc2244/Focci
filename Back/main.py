
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient

app = FastAPI()

# Conexión a MongoDB Atlas usando el usuario "felipe" y la contraseña "1234"
client = AsyncIOMotorClient('mongodb+srv://felipe:1234@cluster0.wpbeio6.mongodb.net/BaseFocci?retryWrites=true&w=majority')
db = client.BaseFocci

@app.get("/")
async def read_root():
    return {"mensaje": "Conectado a MongoDB Atlas"}

# Reemplaza 'mi_base_de_datos' con el nombre real de tu base de datos en Atlas
db = client.BaseFocci


@app.post("/crear_recordatorio/")
async def crear_recordatorio(recordatorio: dict):
    resultado = await db.recordatorios.insert_one(recordatorio)
    return {"id": str(resultado.inserted_id)}
