from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import auth_router, users_router, subjects_router, tasks_router, reminders_router

app = FastAPI()

# Habilitar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Permitir cualquier origen (ajusta en producción)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir cada router
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(subjects_router)
app.include_router(tasks_router)
app.include_router(reminders_router)

# Ruta de prueba
@app.get("/")
async def root():
    return {"message": "API is running!"}
