from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import auth_router, users_router, subjects_router, tasks_router, reminders_router, stats_router, schedule_router
import asyncio
import logging
from datetime import datetime
import httpx
import threading
import time

app = FastAPI()

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Habilitar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier origen (útil en desarrollo)
    allow_credentials=True,
    allow_methods=["*"],  # Permite cualquier método (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permite cualquier encabezado
)

# Incluir cada router
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(subjects_router)
app.include_router(tasks_router)
app.include_router(reminders_router)
app.include_router(stats_router)
app.include_router(schedule_router)

def keep_alive():
    while True:
        try:
            with httpx.Client() as client:
                response = client.get('https://focci.onrender.com')
                logger.info(f"✅ Auto-ping successful - Status: {response.status_code}")
        except Exception as e:
            logger.error(f"❌ Auto-ping failed: {str(e)}")
        time.sleep(840)  # 14 minutos = 840 segundos

@app.on_event("startup")
async def start_keep_alive():
    thread = threading.Thread(target=keep_alive, daemon=True)
    thread.start()
    logger.info("🚀 Auto-ping service started")

# Ruta de prueba
@app.get("/")
async def root():
    return {"message": "API is running!"}

# Imprimir todas las rutas disponibles para depuración
print("\n=== RUTAS DISPONIBLES ===")
for route in app.routes:
    print(f"Método: {route.methods}, Ruta: {route.path}")
print("========================\n")
