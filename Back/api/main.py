from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth_routes import router as auth_router
from routes.reminders import router as reminders_router
from routes.users import router as users_router
from routes.subjects import router as subjects_router
from routes.tasks import router as tasks_router

app = FastAPI()

##Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔥 Permite cualquier origen (útil en desarrollo)
    allow_credentials=True,
    allow_methods=["*"],  # 🔥 Permite cualquier método (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # 🔥 Permite cualquier encabezado
)

##Incluir todos los routers
app.include_router(auth_router)
app.include_router(reminders_router)
app.include_router(users_router)
app.include_router(subjects_router)
app.include_router(tasks_router)

##Después de incluir todas las rutas
for route in app.routes:
    print(f"Ruta disponible: {route.path}")