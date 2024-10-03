from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from transformers import BertTokenizer, BertModel
import torch

app = FastAPI()

# Conexión a MongoDB Atlas
client = AsyncIOMotorClient('mongodb+srv://felipe:1234@cluster0.wpbeio6.mongodb.net/BaseFocci?retryWrites=true&w=majority')
db = client.BaseFocci

# Cargar BERT
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')

# Función para obtener embeddings con BERT
def obtener_embeddings(texto):
    inputs = tokenizer(texto, return_tensors='pt')
    outputs = model(**inputs)
    embeddings = outputs.last_hidden_state.mean(dim=1)
    return embeddings

# Ruta para crear recordatorio
@app.post("/crear_recordatorio/")
async def crear_recordatorio(recordatorio: dict):
    texto = recordatorio.get('texto', '')
    embeddings = obtener_embeddings(texto)
    embeddings_list = embeddings.detach().numpy().tolist()
    recordatorio['embeddings'] = embeddings_list
    resultado = await db.recordatorios.insert_one(recordatorio)
    return {"id": str(resultado.inserted_id)}

# Ruta para obtener recomendaciones
@app.post("/obtener_recomendaciones/")
async def obtener_recomendaciones_endpoint(recordatorio: dict):
    texto = recordatorio.get('texto', '')
    nuevo_embedding = obtener_embeddings(texto).detach().numpy()
    
    recordatorios_cursor = db.recordatorios.find({})
    recordatorios_existentes = []
    embeddings_existentes = []
    
    async for documento in recordatorios_cursor:
        recordatorios_existentes.append(documento)
        embeddings_existentes.append(documento['embeddings'])
    
    embeddings_existentes = np.array(embeddings_existentes).squeeze()
    recomendaciones = obtener_recomendaciones(nuevo_embedding, embeddings_existentes, recordatorios_existentes)
    
    return {"recomendaciones": recomendaciones}

# Función para obtener recomendaciones
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def obtener_recomendaciones(nuevo_embedding, embeddings_existentes, recordatorios_existentes, top_n=5):
    similitudes = cosine_similarity(nuevo_embedding, embeddings_existentes)
    indices_similares = np.argsort(similitudes[0])[::-1][:top_n]
    recomendaciones = [recordatorios_existentes[i] for i in indices_similares]
    return recomendaciones
