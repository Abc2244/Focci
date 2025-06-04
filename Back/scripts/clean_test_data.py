#!/usr/bin/env python3
"""
Script para limpiar datos de prueba en Focci
Elimina todos los datos asociados al usuario de prueba
"""

import asyncio
import sys
import os
from bson import ObjectId

# Añadir el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import mongodb

class TestDataCleaner:
    def __init__(self):
        self.db = mongodb.db
        self.test_email = "test@focci.com"
        
    async def clean_test_data(self):
        """Limpiar todos los datos de prueba"""
        print("🧹 LIMPIADOR DE DATOS DE PRUEBA PARA FOCCI")
        print("=" * 50)
        
        try:
            # Buscar el usuario de prueba
            test_user = await self.db.users.find_one({"email": self.test_email})
            if not test_user:
                print("❌ Usuario de prueba no encontrado")
                return
                
            user_id = str(test_user["_id"])
            print(f"🔍 Usuario de prueba encontrado: {user_id}")
            
            # Contar datos antes de eliminar
            subjects_count = await self.db.subjects.count_documents({"user_id": user_id})
            tasks_count = await self.db.tasks.count_documents({"user_id": user_id})
            reminders_count = await self.db.reminders.count_documents({"user_id": user_id})
            
            print(f"\n📊 Datos a eliminar:")
            print(f"📚 Materias: {subjects_count}")
            print(f"📝 Tareas: {tasks_count}")
            print(f"🔔 Recordatorios: {reminders_count}")
            
            # Eliminar recordatorios
            reminder_result = await self.db.reminders.delete_many({"user_id": user_id})
            print(f"✅ Recordatorios eliminados: {reminder_result.deleted_count}")
            
            # Eliminar tareas
            task_result = await self.db.tasks.delete_many({"user_id": user_id})
            print(f"✅ Tareas eliminadas: {task_result.deleted_count}")
            
            # Eliminar materias
            subject_result = await self.db.subjects.delete_many({"user_id": user_id})
            print(f"✅ Materias eliminadas: {subject_result.deleted_count}")
            
            # Eliminar usuario
            user_result = await self.db.users.delete_one({"_id": ObjectId(user_id)})
            print(f"✅ Usuario eliminado: {user_result.deleted_count}")
            
            print("\n🎉 ¡Datos de prueba eliminados exitosamente!")
            
        except Exception as e:
            print(f"❌ Error durante la limpieza: {str(e)}")
            import traceback
            traceback.print_exc()

async def main():
    """Función principal"""
    cleaner = TestDataCleaner()
    
    # Confirmación antes de eliminar
    response = input("¿Estás seguro de que quieres eliminar todos los datos de prueba? (y/N): ")
    if response.lower() in ['y', 'yes', 'sí', 's']:
        await cleaner.clean_test_data()
    else:
        print("🚫 Operación cancelada")

if __name__ == "__main__":
    asyncio.run(main()) 