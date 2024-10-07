from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router # Asegúrate de importar el archivo donde están tus rutas

app = FastAPI()

# Habilitar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir cualquier origen (útil para desarrollo). Puedes restringirlo en producción.
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos HTTP (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permitir todos los encabezados
)

# Registrar las rutas que has definido en el archivo de rutas
app.include_router(router)

# Opcional: puedes agregar una ruta de prueba para verificar que la API esté corriendo
@app.get("/")
async def root():
    return {"message": "API is running!"}
