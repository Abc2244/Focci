import spacy
from datetime import datetime, timedelta
from config.database import mongodb
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TaskClassifier:
    def __init__(self):
        self.keywords_cache = {}
        self.last_cache_update = None
        self.cache_duration = timedelta(hours=1)
        self.nlp = None

    async def initialize(self):
        """Inicializa el clasificador cargando el modelo de spaCy y las palabras clave"""
        try:
            # Intentar cargar el modelo spaCy
            try:
                self.nlp = spacy.load('es_core_news_sm')
                logger.info("✅ Modelo spaCy cargado correctamente")
            except OSError:
                logger.warning("⚠️ Modelo spaCy no encontrado, intentando descargarlo...")
                # Si el modelo no está instalado, lo descargamos
                import subprocess
                result = subprocess.run(
                    ["python", "-m", "spacy", "download", "es_core_news_sm"], 
                    capture_output=True, 
                    text=True
                )
                if result.returncode == 0:
                    self.nlp = spacy.load('es_core_news_sm')
                    logger.info("✅ Modelo spaCy descargado y cargado correctamente")
                else:
                    logger.error(f"❌ Error al descargar modelo spaCy: {result.stderr}")
                    # Fallback: usar modelo básico sin vectores
                    try:
                        self.nlp = spacy.blank('es')
                        logger.warning("⚠️ Usando modelo spaCy básico sin vectores")
                    except Exception as e:
                        logger.error(f"❌ Error crítico al cargar spaCy: {str(e)}")
                        self.nlp = None
                        return
            
            # Cargar palabras clave iniciales
            await self.load_keywords()
            logger.info("✅ TaskClassifier inicializado correctamente")
            
        except Exception as e:
            logger.error(f"❌ Error al inicializar TaskClassifier: {str(e)}")
            self.nlp = None

    async def load_keywords(self):
        """Cargar palabras clave desde la base de datos con caché"""
        current_time = datetime.now()
        
        # Verificar si necesitamos actualizar el caché
        if (self.last_cache_update is None or 
            current_time - self.last_cache_update > self.cache_duration):
            try:
                keywords = await mongodb.get_collection("task_keywords").find().to_list(length=None)
                if keywords:
                    self.keywords_cache = self._process_keywords(keywords)
                    self.last_cache_update = current_time
                    logger.info("✅ Palabras clave actualizadas en caché")
                else:
                    logger.warning("⚠️ No se encontraron palabras clave en la base de datos")
            except Exception as e:
                logger.error(f"❌ Error al cargar palabras clave: {str(e)}")
                # Si hay error, usar caché existente si está disponible
                if not self.keywords_cache:
                    raise
        
        return self.keywords_cache

    def _process_keywords(self, keywords_data):
        """Procesar y organizar palabras clave"""
        processed = {}
        for kw in keywords_data:
            processed[kw['type']] = {
                'keywords': set(kw['keywords']),
                'weight': kw['weight'],
                'context': set(kw['context'])
            }
        return processed

    async def classify_task(self, description: str) -> dict:
        """Clasificación mejorada de tareas"""
        try:
            # Verificar que el modelo spaCy esté cargado
            if self.nlp is None:
                logger.warning("⚠️ Modelo spaCy no inicializado, reinicializando...")
                await self.initialize()
            
            # Verificar nuevamente después de la inicialización
            if self.nlp is None:
                logger.error("❌ No se pudo cargar el modelo spaCy")
                return {
                    'task_type': 'general',
                    'classification_confidence': 1.0,
                    'all_scores': {'general': 1.0}
                }
            
            # Preprocesamiento con spaCy
            doc = self.nlp(description.lower())
            
            # Obtener keywords de la base de datos
            keywords = await self.load_keywords()
            
            # Análisis de similitud y contexto
            scores = {}
            for task_type, data in keywords.items():
                score = self._calculate_similarity_score(doc, data)
                scores[task_type] = score

            # Determinar el tipo más probable
            if scores:
                best_type = max(scores.items(), key=lambda x: x[1])
                confidence = best_type[1] / (sum(scores.values()) or 1)  # Normalizar score
                
                return {
                    'task_type': best_type[0],
                    'classification_confidence': confidence,
                    'all_scores': scores
                }
            else:
                return {
                    'task_type': 'general',
                    'classification_confidence': 1.0,
                    'all_scores': {'general': 1.0}
                }

        except Exception as e:
            logger.error(f"❌ Error en la clasificación de tarea: {str(e)}")
            # Fallback a clasificación general en caso de error
            return {
                'task_type': 'general',
                'classification_confidence': 1.0,
                'all_scores': {'general': 1.0}
            }

    def _calculate_similarity_score(self, doc, keyword_data):
        """Calcular puntuación de similitud considerando múltiples factores"""
        try:
            base_score = 0
            
            # 1. Coincidencia exacta de palabras clave
            text_tokens = set(token.text for token in doc)
            keyword_matches = text_tokens.intersection(keyword_data['keywords'])
            base_score += len(keyword_matches) * keyword_data['weight']
            
            # 2. Análisis de similitud semántica (solo si hay vectores disponibles)
            if self.nlp and hasattr(self.nlp, 'vocab') and self.nlp.vocab.vectors.size > 0:
                for token in doc:
                    if not token.is_stop and not token.is_punct:
                        # Usar vectores de palabra de spaCy para similitud semántica
                        for keyword in keyword_data['keywords']:
                            try:
                                keyword_token = self.nlp(keyword)[0]
                                if token.has_vector and keyword_token.has_vector:
                                    similarity = token.similarity(keyword_token)
                                    base_score += similarity * 0.5
                            except Exception:
                                # Si hay error con vectores, continuar sin similitud semántica
                                continue
            
            # 3. Análisis de contexto
            context_tokens = set(token.text for token in doc if token.pos_ in {'NOUN', 'VERB', 'ADJ'})
            context_matches = context_tokens.intersection(keyword_data['context'])
            base_score += len(context_matches) * 0.3

            return base_score
            
        except Exception as e:
            logger.error(f"❌ Error en el cálculo de similitud: {str(e)}")
            return 0.0

    async def update_keywords(self, type_name: str, new_keywords: list, new_context: list = None, weight: float = None):
        """Actualizar palabras clave para un tipo específico"""
        try:
            update_data = {"keywords": new_keywords}
            if new_context is not None:
                update_data["context"] = new_context
            if weight is not None:
                update_data["weight"] = weight

            result = await mongodb.get_collection("task_keywords").update_one(
                {"type": type_name},
                {"$set": update_data},
                upsert=True
            )

            # Invalidar caché
            self.last_cache_update = None
            
            return result.modified_count > 0 or result.upserted_id is not None
            
        except Exception as e:
            logger.error(f"❌ Error al actualizar palabras clave: {str(e)}")
            return False 