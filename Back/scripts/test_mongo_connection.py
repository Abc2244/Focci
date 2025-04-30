from pymongo import MongoClient

def test_connection():
    try:
        # URI de MongoDB
        uri = "mongodb+srv://focci:AjAT6cPe81cPB2n5@cluster0.chcvh.mongodb.net/BaseFocci?retryWrites=true&w=majority"
        db_name = "BaseFocci"
        
        print(f"Intentando conectar a MongoDB...")
        print(f"URI: {uri}")
        print(f"DB: {db_name}")
        
        # Crear cliente
        client = MongoClient(uri)
        
        # Probar la conexión
        client.admin.command('ping')
        
        # Si llegamos aquí, la conexión fue exitosa
        print("✅ Conexión exitosa a MongoDB!")
        
        # Obtener la base de datos
        db = client[db_name]
        
        # Listar colecciones
        print("\nColecciones disponibles:")
        collections = db.list_collection_names()
        for collection in collections:
            print(f"- {collection}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    test_connection() 