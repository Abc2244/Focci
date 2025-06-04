#!/usr/bin/env python3
"""
Script simple para probar el sistema de palabras clave
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.task_classifier_service import TaskClassifier
from services.task_service import TaskService

async def test_keywords():
    """Prueba simple del sistema de palabras clave"""
    print("🧪 PROBANDO SISTEMA DE PALABRAS CLAVE")
    print("=" * 50)
    
    # Inicializar servicios
    classifier = TaskClassifier()
    task_service = TaskService()
    
    await classifier.initialize()
    await task_service.initialize()
    
    # Ejemplos de tareas para probar
    ejemplos = [
        "Examen de matemáticas",
        "Proyecto final de programación", 
        "Leer capítulo 3 del libro",
        "Taller de laboratorio",
        "Hacer ejercicios de álgebra",
        "Presentación urgente",
        "Informe crítico",
        "Estudiar para parcial importante",
        "Entrega inmediata del trabajo",
        "Tarea crucial para mañana"
    ]
    
    print("\n📝 CLASIFICACIÓN DE TAREAS:")
    print("-" * 50)
    
    for ejemplo in ejemplos:
        try:
            resultado = await classifier.classify_task(ejemplo)
            print(f"'{ejemplo}'")
            print(f"  → Tipo: {resultado['task_type']}")
            print(f"  → Confianza: {resultado['classification_confidence']:.2f}")
            print()
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n🔥 PROCESAMIENTO COMPLETO (con datos reales):")
    print("-" * 50)
    
    # IDs de prueba que existen en la base de datos
    test_user_id = "507f1f77bcf86cd799439011"
    test_subject_id = "507f1f77bcf86cd799439012"
    
    ejemplos_completos = [
        {
            "descripcion": "Examen urgente de cálculo",
            "tiempo_estimado": 120,
            "dias_adelante": 5
        },
        {
            "descripcion": "Proyecto importante de programación",
            "tiempo_estimado": 240,
            "dias_adelante": 10
        },
        {
            "descripcion": "Leer artículo científico",
            "tiempo_estimado": 45,
            "dias_adelante": 3
        }
    ]
    
    for ejemplo in ejemplos_completos:
        try:
            due_date = (datetime.now() + timedelta(days=ejemplo["dias_adelante"])).isoformat()
            
            resultado = await task_service.process_task(
                user_id=test_user_id,
                subject_id=test_subject_id,
                task_description=ejemplo["descripcion"],
                due_date=due_date,
                estimated_time=ejemplo["tiempo_estimado"]
            )
            
            print(f"'{ejemplo['descripcion']}'")
            print(f"  → Tipo: {resultado['task_type']}")
            print(f"  → Prioridad: {resultado['adjusted_priority']}")
            print(f"  → Insistencia: {resultado['insistence_level']}")
            print(f"  → Recordatorios: {len(resultado['reminders'])}")
            print()
            
        except Exception as e:
            print(f"❌ Error procesando '{ejemplo['descripcion']}': {e}")
    
    print("✅ Prueba completada!")

if __name__ == "__main__":
    asyncio.run(test_keywords()) 