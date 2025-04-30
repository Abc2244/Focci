from pymongo import MongoClient
import asyncio
from datetime import datetime

# Configuración de MongoDB
MONGO_URI = "mongodb+srv://focci:AjAT6cPe81cPB2n5@cluster0.chcvh.mongodb.net/BaseFocci?retryWrites=true&w=majority"
DB_NAME = "BaseFocci"

# Palabras clave iniciales para cada tipo de tarea
INITIAL_KEYWORDS = [
    {
        "type": "examen",
        "keywords": [
            "examen", "prueba", "test", "evaluación", "parcial", "quiz",
            "cuestionario", "evaluación parcial", "evaluación final",
            "control", "certamen", "interrogación", "final", "midterm",
            "presentación oral", "sustentación", "defensa"
        ],
        "weight": 2.0,
        "context": [
            "estudiar", "preparar", "repasar", "practicar", "memorizar",
            "evaluar", "calificar", "aprobar", "presentar", "demostrar"
        ]
    },
    {
        "type": "proyecto",
        "keywords": [
            "proyecto", "trabajo", "investigación", "desarrollo",
            "implementación", "presentación", "informe", "reporte",
            "análisis", "diseño", "construcción", "elaboración",
            "documentación", "entrega", "entregable", "prototipo"
        ],
        "weight": 1.5,
        "context": [
            "desarrollar", "implementar", "construir", "crear", "diseñar",
            "planear", "organizar", "documentar", "investigar", "analizar"
        ]
    },
    {
        "type": "lectura",
        "keywords": [
            "lectura", "libro", "capítulo", "artículo", "paper",
            "documento", "texto", "ensayo", "publicación", "revista",
            "material", "bibliografía", "contenido", "páginas",
            "resumen", "síntesis"
        ],
        "weight": 1.0,
        "context": [
            "leer", "revisar", "estudiar", "analizar", "comprender",
            "resumir", "sintetizar", "interpretar", "entender"
        ]
    },
    {
        "type": "taller",
        "keywords": [
            "taller", "laboratorio", "práctica", "ejercicio", "actividad",
            "workshop", "simulación", "experimento", "demostración",
            "clase práctica", "sesión práctica", "hands-on"
        ],
        "weight": 1.2,
        "context": [
            "practicar", "realizar", "ejecutar", "experimentar", "simular",
            "demostrar", "aplicar", "desarrollar", "participar"
        ]
    },
    {
        "type": "general",
        "keywords": [
            "tarea", "actividad", "asignación", "pendiente", "deber",
            "ejercicio", "trabajo", "obligación", "compromiso",
            "responsabilidad", "quehacer"
        ],
        "weight": 1.0,
        "context": [
            "hacer", "completar", "terminar", "realizar", "cumplir",
            "entregar", "finalizar", "ejecutar"
        ]
    }
]

# Palabras clave de prioridad con sus pesos
PRIORITY_KEYWORDS = {
    "urgente": 3,
    "importante": 2,
    "crítico": 3,
    "prioritario": 2,
    "inmediato": 3,
    "esencial": 2,
    "fundamental": 2,
    "vital": 2,
    "crucial": 3,
    "apremiante": 2,
    "indispensable": 2,
    "necesario": 1,
    "relevante": 1,
    "significativo": 1,
    "clave": 2,
    "decisivo": 2,
    "imperativo": 2,
    "primordial": 2,
    "urgencia": 3,
    "prioridad": 2,
    "emergencia": 3
}

def init_database():
    try:
        # Conectar a MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Colección para palabras clave de tareas
        task_keywords = db["task_keywords"]
        
        # Eliminar datos existentes
        task_keywords.delete_many({})
        
        # Insertar nuevas palabras clave
        task_keywords.insert_many(INITIAL_KEYWORDS)
        
        # Colección para palabras clave de prioridad
        priority_keywords = db["priority_keywords"]
        
        # Eliminar datos existentes de prioridad
        priority_keywords.delete_many({})
        
        # Convertir diccionario de prioridad a lista de documentos
        priority_docs = [
            {"keyword": k, "weight": v, "last_updated": datetime.utcnow()}
            for k, v in PRIORITY_KEYWORDS.items()
        ]
        
        # Insertar palabras clave de prioridad
        priority_keywords.insert_many(priority_docs)
        
        print("✅ Base de datos inicializada correctamente")
        print("\nColecciones creadas:")
        print("- task_keywords")
        print("- priority_keywords")
        
        # Mostrar conteos
        print(f"\nPalabras clave de tareas insertadas: {task_keywords.count_documents({})}")
        print(f"Palabras clave de prioridad insertadas: {priority_keywords.count_documents({})}")
        
        # Mostrar tipos de tareas
        print("\nTipos de tareas configurados:")
        for task_type in task_keywords.find({}, {"type": 1, "weight": 1}):
            print(f"- {task_type['type']} (peso: {task_type['weight']})")
            
    except Exception as e:
        print(f"❌ Error al inicializar la base de datos: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    init_database() 