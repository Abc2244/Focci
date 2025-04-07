from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import users, auth, stats, activities, goals, challenges, notifications
from config.database import mongodb

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todas las origenes en desarrollo
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos
    allow_headers=["*"],  # Permite todos los headers
)

# Rutas
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
app.include_router(activities.router, prefix="/activities", tags=["activities"])
app.include_router(goals.router, prefix="/goals", tags=["goals"])
app.include_router(challenges.router, prefix="/challenges", tags=["challenges"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de FOCCI"}

# Imprimir todas las rutas disponibles para depuración
print("\n=== RUTAS DISPONIBLES ===")
for route in app.routes:
    print(f"Método: {route.methods}, Ruta: {route.path}")
print("========================\n")
