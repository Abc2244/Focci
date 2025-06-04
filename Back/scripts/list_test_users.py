#!/usr/bin/env python3
"""
Script para listar y gestionar usuarios de prueba en Focci
Permite ver todos los usuarios de prueba y eliminar uno específico
"""

import asyncio
import sys
import os
from bson import ObjectId
from datetime import datetime

# Añadir el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import mongodb

class TestUserManager:
    def __init__(self):
        self.db = mongodb.db
        
    async def list_test_users(self):
        """Listar todos los usuarios de prueba"""
        print("📋 LISTADO DE USUARIOS DE PRUEBA")
        print("=" * 50)
        
        try:
            # Buscar usuarios que contengan "test" en el email
            test_users = await self.db.users.find({
                "email": {"$regex": "test.*@focci.com", "$options": "i"}
            }).to_list(length=100)
            
            if not test_users:
                print("❌ No se encontraron usuarios de prueba")
                return []
                
            print(f"🔍 Se encontraron {len(test_users)} usuarios de prueba:\n")
            
            for i, user in enumerate(test_users, 1):
                user_id = str(user["_id"])
                email = user["email"]
                username = user["username"]
                created_at = user.get("created_at", "Fecha desconocida")
                
                # Contar datos asociados
                subjects_count = await self.db.subjects.count_documents({"user_id": user_id})
                tasks_count = await self.db.tasks.count_documents({"user_id": user_id})
                reminders_count = await self.db.reminders.count_documents({"user_id": user_id})
                
                print(f"{i}. 👤 {username}")
                print(f"   📧 Email: {email}")
                print(f"   🆔 ID: {user_id}")
                print(f"   📅 Creado: {created_at}")
                print(f"   📊 Datos: {subjects_count} materias, {tasks_count} tareas, {reminders_count} recordatorios")
                print()
                
            return test_users
            
        except Exception as e:
            print(f"❌ Error al listar usuarios: {str(e)}")
            return []
    
    async def delete_specific_user(self, user_id):
        """Eliminar un usuario específico y todos sus datos"""
        try:
            # Verificar que el usuario existe
            user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                print("❌ Usuario no encontrado")
                return False
                
            email = user["email"]
            username = user["username"]
            
            print(f"🗑️ Eliminando usuario: {username} ({email})")
            
            # Contar datos antes de eliminar
            subjects_count = await self.db.subjects.count_documents({"user_id": user_id})
            tasks_count = await self.db.tasks.count_documents({"user_id": user_id})
            reminders_count = await self.db.reminders.count_documents({"user_id": user_id})
            
            print(f"📊 Datos a eliminar:")
            print(f"   📚 Materias: {subjects_count}")
            print(f"   📝 Tareas: {tasks_count}")
            print(f"   🔔 Recordatorios: {reminders_count}")
            
            # Eliminar en orden: recordatorios -> tareas -> materias -> usuario
            reminder_result = await self.db.reminders.delete_many({"user_id": user_id})
            task_result = await self.db.tasks.delete_many({"user_id": user_id})
            subject_result = await self.db.subjects.delete_many({"user_id": user_id})
            user_result = await self.db.users.delete_one({"_id": ObjectId(user_id)})
            
            print(f"\n✅ Eliminación completada:")
            print(f"   🔔 Recordatorios eliminados: {reminder_result.deleted_count}")
            print(f"   📝 Tareas eliminadas: {task_result.deleted_count}")
            print(f"   📚 Materias eliminadas: {subject_result.deleted_count}")
            print(f"   👤 Usuario eliminado: {user_result.deleted_count}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error al eliminar usuario: {str(e)}")
            return False
    
    async def delete_all_test_users(self):
        """Eliminar todos los usuarios de prueba"""
        print("🧹 ELIMINANDO TODOS LOS USUARIOS DE PRUEBA")
        print("=" * 50)
        
        try:
            # Buscar todos los usuarios de prueba
            test_users = await self.db.users.find({
                "email": {"$regex": "test.*@focci.com", "$options": "i"}
            }).to_list(length=100)
            
            if not test_users:
                print("❌ No se encontraron usuarios de prueba")
                return
                
            print(f"🔍 Se encontraron {len(test_users)} usuarios de prueba")
            
            total_deleted = {
                "users": 0,
                "subjects": 0,
                "tasks": 0,
                "reminders": 0
            }
            
            for user in test_users:
                user_id = str(user["_id"])
                email = user["email"]
                
                print(f"🗑️ Eliminando: {email}")
                
                # Eliminar datos asociados
                reminder_result = await self.db.reminders.delete_many({"user_id": user_id})
                task_result = await self.db.tasks.delete_many({"user_id": user_id})
                subject_result = await self.db.subjects.delete_many({"user_id": user_id})
                user_result = await self.db.users.delete_one({"_id": user["_id"]})
                
                total_deleted["reminders"] += reminder_result.deleted_count
                total_deleted["tasks"] += task_result.deleted_count
                total_deleted["subjects"] += subject_result.deleted_count
                total_deleted["users"] += user_result.deleted_count
                
            print(f"\n✅ Eliminación masiva completada:")
            print(f"   👤 Usuarios eliminados: {total_deleted['users']}")
            print(f"   📚 Materias eliminadas: {total_deleted['subjects']}")
            print(f"   📝 Tareas eliminadas: {total_deleted['tasks']}")
            print(f"   🔔 Recordatorios eliminados: {total_deleted['reminders']}")
            
        except Exception as e:
            print(f"❌ Error en eliminación masiva: {str(e)}")

async def main():
    """Función principal con menú interactivo"""
    manager = TestUserManager()
    
    while True:
        print("\n🎛️ GESTOR DE USUARIOS DE PRUEBA")
        print("=" * 40)
        print("1. 📋 Listar usuarios de prueba")
        print("2. 🗑️ Eliminar usuario específico")
        print("3. 🧹 Eliminar TODOS los usuarios de prueba")
        print("4. ❌ Salir")
        print()
        
        choice = input("Selecciona una opción (1-4): ").strip()
        
        if choice == "1":
            await manager.list_test_users()
            
        elif choice == "2":
            users = await manager.list_test_users()
            if users:
                try:
                    user_num = int(input(f"\nSelecciona un usuario (1-{len(users)}): ")) - 1
                    if 0 <= user_num < len(users):
                        user_id = str(users[user_num]["_id"])
                        confirm = input(f"¿Confirmas eliminar el usuario? (y/N): ")
                        if confirm.lower() in ['y', 'yes', 'sí', 's']:
                            await manager.delete_specific_user(user_id)
                        else:
                            print("🚫 Operación cancelada")
                    else:
                        print("❌ Número de usuario inválido")
                except ValueError:
                    print("❌ Por favor ingresa un número válido")
                    
        elif choice == "3":
            confirm = input("⚠️ ¿Estás SEGURO de eliminar TODOS los usuarios de prueba? (y/N): ")
            if confirm.lower() in ['y', 'yes', 'sí', 's']:
                await manager.delete_all_test_users()
            else:
                print("🚫 Operación cancelada")
                
        elif choice == "4":
            print("👋 ¡Hasta luego!")
            break
            
        else:
            print("❌ Opción inválida. Por favor selecciona 1-4.")

if __name__ == "__main__":
    asyncio.run(main()) 