#!/usr/bin/env python3
"""
Script de depuración para verificar el sistema de palabras clave y clasificación de tareas
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta
from bson import ObjectId

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.database import mongodb
from services.task_classifier_service import TaskClassifier
from services.task_service import TaskService
from services.task_prioritizer_service import TaskPrioritizer

class KeywordsDebugger:
    def __init__(self):
        self.classifier = TaskClassifier()
        self.task_service = TaskService()
        self.prioritizer = TaskPrioritizer()

    async def initialize(self):
        """Inicializar todos los servicios"""
        print("🔧 Inicializando servicios...")
        await self.classifier.initialize()
        await self.task_service.initialize()
        print("✅ Servicios inicializados correctamente\n")

    async def check_database_keywords(self):
        """Verificar las palabras clave en la base de datos"""
        print("📊 VERIFICANDO PALABRAS CLAVE EN LA BASE DE DATOS")
        print("=" * 60)
        
        try:
            # Verificar task_keywords
            task_keywords = await mongodb.get_collection("task_keywords").find().to_list(length=None)
            print(f"📝 Palabras clave de tareas encontradas: {len(task_keywords)}")
            
            for kw in task_keywords:
                print(f"  • Tipo: {kw['type']}")
                print(f"    - Peso: {kw['weight']}")
                print(f"    - Palabras clave: {kw['keywords'][:5]}...")  # Solo las primeras 5
                print(f"    - Contexto: {kw['context'][:3]}...")  # Solo las primeras 3
                print()

            # Verificar priority_keywords si existe
            try:
                priority_keywords = await mongodb.get_collection("priority_keywords").find().to_list(length=None)
                print(f"🔥 Palabras clave de prioridad encontradas: {len(priority_keywords)}")
                for pk in priority_keywords[:5]:  # Solo las primeras 5
                    print(f"  • '{pk['keyword']}': peso {pk['weight']}")
            except Exception as e:
                print(f"⚠️ No se encontraron palabras clave de prioridad: {e}")

        except Exception as e:
            print(f"❌ Error al verificar la base de datos: {e}")

    async def test_classification(self):
        """Probar la clasificación de diferentes tipos de tareas"""
        print("\n🧪 PROBANDO CLASIFICACIÓN DE TAREAS")
        print("=" * 60)
        
        test_descriptions = [
            "Examen de matemáticas para el viernes",
            "Proyecto final de programación web",
            "Leer capítulo 5 del libro de física",
            "Taller de laboratorio de química",
            "Hacer ejercicios de álgebra",
            "Presentación urgente para mañana",
            "Informe crítico del proyecto",
            "Estudiar para el parcial importante"
        ]

        for desc in test_descriptions:
            try:
                result = await self.classifier.classify_task(desc)
                print(f"📝 '{desc}'")
                print(f"   → Tipo: {result['task_type']}")
                print(f"   → Confianza: {result['classification_confidence']:.2f}")
                print(f"   → Puntuaciones: {result['all_scores']}")
                print()
            except Exception as e:
                print(f"❌ Error clasificando '{desc}': {e}")

    async def test_prioritization(self):
        """Probar el sistema de priorización"""
        print("\n⚡ PROBANDO SISTEMA DE PRIORIZACIÓN")
        print("=" * 60)
        
        test_cases = [
            ("Examen urgente de matemáticas", "examen", 120),
            ("Proyecto importante de programación", "proyecto", 240),
            ("Leer capítulo del libro", "lectura", 60),
            ("Tarea crítica para mañana", "general", 90),
            ("Presentación inmediata", "general", 45)
        ]

        for desc, task_type, estimated_time in test_cases:
            try:
                # Probar con TaskPrioritizer
                base_priority = self.prioritizer.calculate_base_priority(desc)
                adjusted_priority = self.prioritizer.adjust_priority(desc, task_type, estimated_time)
                
                print(f"📝 '{desc}'")
                print(f"   → Tipo: {task_type}")
                print(f"   → Prioridad base: {base_priority}")
                print(f"   → Prioridad ajustada: {adjusted_priority}")
                print()
            except Exception as e:
                print(f"❌ Error priorizando '{desc}': {e}")

    async def test_full_processing(self):
        """Probar el procesamiento completo de tareas"""
        print("\n🔄 PROBANDO PROCESAMIENTO COMPLETO")
        print("=" * 60)
        
        # IDs de prueba
        test_user_id = "507f1f77bcf86cd799439011"
        test_subject_id = "507f1f77bcf86cd799439012"
        
        test_tasks = [
            {
                "description": "Examen final de cálculo diferencial",
                "estimated_time": 180,
                "days_ahead": 7
            },
            {
                "description": "Proyecto urgente de base de datos",
                "estimated_time": 300,
                "days_ahead": 14
            },
            {
                "description": "Leer artículo científico importante",
                "estimated_time": 45,
                "days_ahead": 3
            }
        ]

        for task in test_tasks:
            try:
                due_date = (datetime.now() + timedelta(days=task["days_ahead"])).isoformat()
                
                result = await self.task_service.process_task(
                    user_id=test_user_id,
                    subject_id=test_subject_id,
                    task_description=task["description"],
                    due_date=due_date,
                    estimated_time=task["estimated_time"]
                )
                
                print(f"📝 '{task['description']}'")
                print(f"   → Tipo clasificado: {result['task_type']}")
                print(f"   → Prioridad ajustada: {result['adjusted_priority']}")
                print(f"   → Nivel de insistencia: {result['insistence_level']}")
                print(f"   → Confianza: {result['classification_confidence']:.2f}")
                print(f"   → Recordatorios generados: {len(result['reminders'])}")
                print()
                
            except Exception as e:
                print(f"❌ Error procesando '{task['description']}': {e}")

    async def check_cache_status(self):
        """Verificar el estado del caché de palabras clave"""
        print("\n💾 VERIFICANDO ESTADO DEL CACHÉ")
        print("=" * 60)
        
        print(f"Caché del clasificador:")
        print(f"  • Última actualización: {self.classifier.last_cache_update}")
        print(f"  • Tipos en caché: {list(self.classifier.keywords_cache.keys()) if self.classifier.keywords_cache else 'Vacío'}")
        
        if self.classifier.keywords_cache:
            for task_type, data in self.classifier.keywords_cache.items():
                print(f"  • {task_type}: {len(data['keywords'])} palabras clave, peso {data['weight']}")

    async def run_all_tests(self):
        """Ejecutar todas las pruebas"""
        print("🚀 INICIANDO DEPURACIÓN DEL SISTEMA DE PALABRAS CLAVE")
        print("=" * 80)
        
        await self.initialize()
        await self.check_database_keywords()
        await self.check_cache_status()
        await self.test_classification()
        await self.test_prioritization()
        await self.test_full_processing()
        
        print("\n✅ DEPURACIÓN COMPLETADA")
        print("=" * 80)

async def main():
    """Función principal"""
    debugger = KeywordsDebugger()
    await debugger.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main()) 