from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth_router, reminders_router, users_router, subjects_router, tasks_router, stats_router

app = FastAPI()

##Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8100", "http://localhost:4200", "https://focci.vercel.app"],  # Añadimos ambos puertos comunes de Ionic y el de producción
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Especificamos los métodos
    allow_headers=["*"],
)

##Incluir todos los routers
app.include_router(auth_router)
app.include_router(reminders_router)
app.include_router(users_router)
app.include_router(subjects_router)
app.include_router(tasks_router)
app.include_router(stats_router)

##Después de incluir todas las rutas
for route in app.routes:
    print(f"Ruta disponible: {route.path}")

##Después de incluir todos los routers
print("\n=== RUTAS DISPONIBLES ===")
for route in app.routes:
    print(f"Método: {route.methods}, Ruta: {route.path}")
print("========================\n")