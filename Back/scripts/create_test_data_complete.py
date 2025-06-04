#!/usr/bin/env python3
"""
Script completo para crear datos de prueba en Focci
- 1 usuario de prueba
- 8 materias con horarios realistas
- 10 tareas con clasificación automática y priorización
- 10 recordatorios inteligentes
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from bson import ObjectId
import random
import time
from passlib.context import CryptContext

# Añadir el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import mongodb
from models.user import User
from models.subject import Subject, ScheduleItem
from models.task import Task
from models.reminder import Reminder

# Configurar el contexto de password igual que en la aplicación
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class TestDataGenerator:
    def __init__(self):
        self.db = mongodb.db
        self.user_id = None
        self.subject_ids = []
        # Generar email único basado en timestamp
        timestamp = int(time.time())
        self.test_email = f"test{timestamp}@focci.com"
        self.test_username = f"Usuario_Prueba_{timestamp}"
        
    async def initialize(self):
        """Inicializar servicios y conexión a la base de datos"""
        print("🔧 Inicializando servicios...")
        print(f"📧 Email de prueba: {self.test_email}")
        print("✅ Servicios inicializados")
        
    async def create_test_user(self):
        """Crear usuario de prueba"""
        print("👤 Creando usuario de prueba...")
        
        # Verificar si ya existe (aunque debería ser único)
        existing_user = await self.db.users.find_one({"email": self.test_email})
        if existing_user:
            self.user_id = str(existing_user["_id"])
            print(f"✅ Usuario existente encontrado: {self.user_id}")
            return
            
        # Generar hash de contraseña correcto
        password_hash = pwd_context.hash("test123")
        print("🔐 Generando hash de contraseña...")
            
        user_data = {
            "username": self.test_username,
            "email": self.test_email,
            "password": password_hash,
            "created_at": datetime.utcnow()
        }
        
        result = await self.db.users.insert_one(user_data)
        self.user_id = str(result.inserted_id)
        print(f"✅ Usuario creado: {self.user_id}")
        print(f"📧 Email: {self.test_email}")
        print(f"👤 Nombre: {self.test_username}")
        print(f"🔑 Contraseña hasheada correctamente")
        
    async def create_test_subjects(self):
        """Crear 8 materias de prueba con horarios realistas"""
        print("📚 Creando 8 materias de prueba...")
        
        subjects_data = [
            {
                "name": "Cálculo Diferencial",
                "credits": 4,
                "schedule": [
                    {"day": "Lunes", "startTime": "8:00 AM", "endTime": "10:00 AM"},
                    {"day": "Miércoles", "startTime": "8:00 AM", "endTime": "10:00 AM"}
                ],
                "end_date": datetime.utcnow() + timedelta(days=120)
            },
            {
                "name": "Programación Orientada a Objetos",
                "credits": 3,
                "schedule": [
                    {"day": "Martes", "startTime": "10:00 AM", "endTime": "12:00 PM"},
                    {"day": "Jueves", "startTime": "10:00 AM", "endTime": "12:00 PM"}
                ],
                "end_date": datetime.utcnow() + timedelta(days=115)
            },
            {
                "name": "Física Mecánica",
                "credits": 4,
                "schedule": [
                    {"day": "Lunes", "startTime": "2:00 PM", "endTime": "4:00 PM"},
                    {"day": "Viernes", "startTime": "2:00 PM", "endTime": "4:00 PM"}
                ],
                "end_date": datetime.utcnow() + timedelta(days=110)
            },
            {
                "name": "Álgebra Lineal",
                "credits": 3,
                "schedule": [
                    {"day": "Martes", "startTime": "2:00 PM", "endTime": "4:00 PM"},
                    {"day": "Jueves", "startTime": "2:00 PM", "endTime": "4:00 PM"}
                ],
                "end_date": datetime.utcnow() + timedelta(days=118)
            },
            {
                "name": "Química General",
                "credits": 4,
                "schedule": [
                    {"day": "Miércoles", "startTime": "10:00 AM", "endTime": "12:00 PM"},
                    {"day": "Viernes", "startTime": "10:00 AM", "endTime": "12:00 PM"}
                ],
                "end_date": datetime.utcnow() + timedelta(days=125)
            },
            {
                "name": "Inglés Técnico",
                "credits": 2,
                "schedule": [
                    {"day": "Lunes", "startTime": "4:00 PM", "endTime": "6:00 PM"}
                ],
                "end_date": datetime.utcnow() + timedelta(days=100)
            },
            {
                "name": "Metodología de la Investigación",
                "credits": 2,
                "schedule": [
                    {"day": "Miércoles", "startTime": "4:00 PM", "endTime": "6:00 PM"}
                ],
                "end_date": datetime.utcnow() + timedelta(days=105)
            },
            {
                "name": "Ética Profesional",
                "credits": 2,
                "schedule": [
                    {"day": "Viernes", "startTime": "4:00 PM", "endTime": "6:00 PM"}
                ],
                "end_date": datetime.utcnow() + timedelta(days=95)
            }
        ]
        
        self.subject_ids = []
        for subject_data in subjects_data:
            subject_data["user_id"] = self.user_id
            result = await self.db.subjects.insert_one(subject_data)
            subject_id = str(result.inserted_id)
            self.subject_ids.append(subject_id)
            print(f"  ✅ Materia creada: {subject_data['name']} ({subject_id})")
            
        print(f"✅ {len(self.subject_ids)} materias creadas")
        
    async def create_test_tasks(self):
        """Crear 10 tareas de prueba"""
        print("📝 Creando 10 tareas de prueba...")
        
        tasks_data = [
            {
                "description": "Examen parcial de derivadas e integrales",
                "subject_index": 0,  # Cálculo
                "days_ahead": 7,
                "estimated_time": 120,
                "task_type": "examen",
                "priority": 4
            },
            {
                "description": "Proyecto final de programación - Sistema de gestión",
                "subject_index": 1,  # POO
                "days_ahead": 14,
                "estimated_time": 300,
                "task_type": "proyecto",
                "priority": 4
            },
            {
                "description": "Taller de laboratorio - Experimento de péndulo simple",
                "subject_index": 2,  # Física
                "days_ahead": 3,
                "estimated_time": 90,
                "task_type": "taller",
                "priority": 3
            },
            {
                "description": "Lectura del capítulo 5: Espacios vectoriales",
                "subject_index": 3,  # Álgebra
                "days_ahead": 2,
                "estimated_time": 45,
                "task_type": "lectura",
                "priority": 2
            },
            {
                "description": "Examen urgente de enlaces químicos",
                "subject_index": 4,  # Química
                "days_ahead": 1,
                "estimated_time": 90,
                "task_type": "examen",
                "priority": 5
            },
            {
                "description": "Ensayo crítico sobre metodología científica",
                "subject_index": 6,  # Metodología
                "days_ahead": 10,
                "estimated_time": 180,
                "task_type": "general",
                "priority": 3
            },
            {
                "description": "Presentación oral en inglés - Tecnología moderna",
                "subject_index": 5,  # Inglés
                "days_ahead": 5,
                "estimated_time": 60,
                "task_type": "general",
                "priority": 3
            },
            {
                "description": "Proyecto de investigación ética en ingeniería",
                "subject_index": 7,  # Ética
                "days_ahead": 21,
                "estimated_time": 240,
                "task_type": "proyecto",
                "priority": 2
            },
            {
                "description": "Taller práctico de matrices y determinantes",
                "subject_index": 3,  # Álgebra
                "days_ahead": 4,
                "estimated_time": 75,
                "task_type": "taller",
                "priority": 3
            },
            {
                "description": "Lectura importante del capítulo 8: Polímeros",
                "subject_index": 4,  # Química
                "days_ahead": 6,
                "estimated_time": 60,
                "task_type": "lectura",
                "priority": 2
            }
        ]
        
        created_tasks = []
        for i, task_data in enumerate(tasks_data):
            try:
                # Calcular fecha de entrega
                due_date = datetime.utcnow() + timedelta(days=task_data["days_ahead"])
                
                # Crear el documento de la tarea
                task_document = {
                    "user_id": self.user_id,
                    "subject_id": self.subject_ids[task_data["subject_index"]],
                    "description": task_data["description"],
                    "due_date": due_date.isoformat() + "Z",
                    "completed": False,
                    "completed_date": None,
                    "estimated_time": task_data["estimated_time"],
                    "task_type": task_data["task_type"],
                    "priority": task_data["priority"],
                    "reminders": [],
                    "created_at": datetime.utcnow()
                }
                
                result = await self.db.tasks.insert_one(task_document)
                task_result = {
                    "task_id": str(result.inserted_id),
                    "task_type": task_data["task_type"],
                    "adjusted_priority": task_data["priority"]
                }
                created_tasks.append(task_result)
                
                print(f"  ✅ Tarea {i+1}: {task_data['description'][:50]}...")
                print(f"     Tipo: {task_data['task_type']}, Prioridad: {task_data['priority']}")
                
            except Exception as e:
                print(f"  ❌ Error creando tarea {i+1}: {str(e)}")
                
        print(f"✅ {len(created_tasks)} tareas creadas")
        return created_tasks
        
    async def create_test_reminders(self, tasks):
        """Crear 10 recordatorios inteligentes basados en las tareas"""
        print("🔔 Creando 10 recordatorios inteligentes...")
        
        reminders_data = []
        
        # Crear recordatorios para las primeras 10 tareas
        for i, task in enumerate(tasks[:10]):
            try:
                task_id = task.get("task_id")
                if not task_id:
                    continue
                    
                # Obtener información de la tarea
                task_doc = await self.db.tasks.find_one({"_id": ObjectId(task_id)})
                if not task_doc:
                    continue
                    
                due_date = datetime.fromisoformat(task_doc["due_date"].replace('Z', '+00:00'))
                priority = task.get("adjusted_priority", 1)
                task_type = task.get("task_type", "general")
                
                # Calcular fecha del recordatorio basada en prioridad
                if priority >= 4:  # Alta prioridad
                    reminder_date = due_date - timedelta(hours=12)
                    insistence_level = 3
                elif priority >= 3:  # Media prioridad
                    reminder_date = due_date - timedelta(days=1)
                    insistence_level = 2
                else:  # Baja prioridad
                    reminder_date = due_date - timedelta(days=2)
                    insistence_level = 1
                
                # Generar mensaje inteligente
                messages = {
                    "examen": f"🎯 ¡Recordatorio importante! Tienes un examen en {due_date.strftime('%d/%m/%Y')}",
                    "proyecto": f"🚀 No olvides trabajar en tu proyecto. Entrega: {due_date.strftime('%d/%m/%Y')}",
                    "taller": f"🔧 Taller programado para {due_date.strftime('%d/%m/%Y')}. ¡Prepárate!",
                    "lectura": f"📖 Tiempo de lectura. Fecha límite: {due_date.strftime('%d/%m/%Y')}",
                    "general": f"📋 Recordatorio: {task_doc['description'][:50]}..."
                }
                
                message = messages.get(task_type, messages["general"])
                
                reminder_data = {
                    "user_id": self.user_id,
                    "task_id": task_id,
                    "message": message,
                    "reminder_date": reminder_date,
                    "status": "pendiente",
                    "priority": priority,
                    "insistence_level": insistence_level,
                    "completed_date": None,
                    "created_at": datetime.utcnow()
                }
                
                result = await self.db.reminders.insert_one(reminder_data)
                reminders_data.append(result.inserted_id)
                
                print(f"  ✅ Recordatorio {i+1}: {message[:60]}...")
                print(f"     Fecha: {reminder_date.strftime('%d/%m/%Y %H:%M')}, Prioridad: {priority}")
                
            except Exception as e:
                print(f"  ❌ Error creando recordatorio {i+1}: {str(e)}")
                
        print(f"✅ {len(reminders_data)} recordatorios creados")
        
    async def generate_stats_summary(self):
        """Generar resumen de estadísticas"""
        print("\n📊 RESUMEN DE DATOS CREADOS:")
        print("=" * 50)
        
        # Contar datos
        users_count = await self.db.users.count_documents({"_id": ObjectId(self.user_id)})
        subjects_count = await self.db.subjects.count_documents({"user_id": self.user_id})
        tasks_count = await self.db.tasks.count_documents({"user_id": self.user_id})
        reminders_count = await self.db.reminders.count_documents({"user_id": self.user_id})
        
        print(f"👤 Usuarios: {users_count}")
        print(f"📚 Materias: {subjects_count}")
        print(f"📝 Tareas: {tasks_count}")
        print(f"🔔 Recordatorios: {reminders_count}")
        
        # Estadísticas de tareas por tipo
        print("\n📈 Distribución de tareas por tipo:")
        pipeline = [
            {"$match": {"user_id": self.user_id}},
            {"$group": {"_id": "$task_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        async for doc in self.db.tasks.aggregate(pipeline):
            task_type = doc["_id"] or "sin_tipo"
            count = doc["count"]
            print(f"  {task_type}: {count} tareas")
            
        # Estadísticas de prioridades
        print("\n🎯 Distribución de prioridades:")
        pipeline = [
            {"$match": {"user_id": self.user_id}},
            {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        
        async for doc in self.db.tasks.aggregate(pipeline):
            priority = doc["_id"]
            count = doc["count"]
            print(f"  Prioridad {priority}: {count} tareas")
            
        print("\n✅ ¡Datos de prueba creados exitosamente!")
        print(f"🔑 ID del usuario de prueba: {self.user_id}")
        print(f"📧 Email: {self.test_email}")
        print(f"👤 Nombre: {self.test_username}")
        print("🔒 Contraseña: test123")
        
    async def run(self):
        """Ejecutar todo el proceso de creación de datos"""
        try:
            await self.initialize()
            await self.create_test_user()
            await self.create_test_subjects()
            tasks = await self.create_test_tasks()
            await self.create_test_reminders(tasks)
            await self.generate_stats_summary()
            
        except Exception as e:
            print(f"❌ Error durante la ejecución: {str(e)}")
            import traceback
            traceback.print_exc()

async def main():
    """Función principal"""
    print("🚀 GENERADOR DE DATOS DE PRUEBA PARA FOCCI")
    print("=" * 50)
    print("Este script creará:")
    print("- 1 usuario de prueba")
    print("- 8 materias con horarios")
    print("- 10 tareas con clasificación automática")
    print("- 10 recordatorios inteligentes")
    print("=" * 50)
    
    generator = TestDataGenerator()
    await generator.run()

if __name__ == "__main__":
    asyncio.run(main()) 