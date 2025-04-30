from fastapi import APIRouter, HTTPException
from config.database import mongodb
from typing import List, Optional
from pydantic import BaseModel
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class KeywordUpdate(BaseModel):
    type: str
    keywords: List[str]
    context: Optional[List[str]] = None
    weight: Optional[float] = None

def serialize_mongo_document(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("/task-keywords/")
async def get_all_keywords():
    """Obtener todas las palabras clave"""
    try:
        keywords = await mongodb.get_collection("task_keywords").find().to_list(length=None)
        return [serialize_mongo_document(kw) for kw in keywords]
    except Exception as e:
        logger.error(f"❌ Error al obtener palabras clave: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/task-keywords/{type_name}")
async def get_keywords_by_type(type_name: str):
    """Obtener palabras clave por tipo"""
    try:
        keywords = await mongodb.get_collection("task_keywords").find_one({"type": type_name})
        if not keywords:
            raise HTTPException(status_code=404, detail="Tipo no encontrado")
        return serialize_mongo_document(keywords)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error al obtener palabras clave por tipo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/task-keywords/")
async def create_keywords(keyword_data: KeywordUpdate):
    """Crear nuevo conjunto de palabras clave"""
    try:
        # Verificar si ya existe
        existing = await mongodb.get_collection("task_keywords").find_one({"type": keyword_data.type})
        if existing:
            raise HTTPException(status_code=400, detail="Este tipo ya existe")

        # Crear nuevo documento
        result = await mongodb.get_collection("task_keywords").insert_one(keyword_data.dict())
        logger.info(f"✅ Nuevas palabras clave creadas para tipo: {keyword_data.type}")
        return {"id": str(result.inserted_id)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error al crear palabras clave: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/task-keywords/{type_name}")
async def update_keywords(type_name: str, keyword_data: KeywordUpdate):
    """Actualizar palabras clave existentes"""
    try:
        if type_name != keyword_data.type:
            raise HTTPException(status_code=400, detail="El tipo en la URL no coincide con el tipo en los datos")

        result = await mongodb.get_collection("task_keywords").update_one(
            {"type": type_name},
            {"$set": keyword_data.dict()}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Tipo no encontrado")

        logger.info(f"✅ Palabras clave actualizadas para tipo: {type_name}")
        return {"message": "Palabras clave actualizadas"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error al actualizar palabras clave: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/task-keywords/{type_name}")
async def delete_keywords(type_name: str):
    """Eliminar conjunto de palabras clave"""
    try:
        result = await mongodb.get_collection("task_keywords").delete_one({"type": type_name})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Tipo no encontrado")
        
        logger.info(f"✅ Palabras clave eliminadas para tipo: {type_name}")
        return {"message": "Palabras clave eliminadas"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error al eliminar palabras clave: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/task-keywords/{type_name}/keywords")
async def add_keywords(type_name: str, new_keywords: List[str]):
    """Añadir nuevas palabras clave a un tipo existente"""
    try:
        result = await mongodb.get_collection("task_keywords").update_one(
            {"type": type_name},
            {"$addToSet": {"keywords": {"$each": new_keywords}}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Tipo no encontrado")

        logger.info(f"✅ Palabras clave añadidas para tipo: {type_name}")
        return {"message": "Palabras clave añadidas"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error al añadir palabras clave: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 