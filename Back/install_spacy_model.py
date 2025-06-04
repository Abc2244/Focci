#!/usr/bin/env python3
"""
Script para instalar el modelo spaCy en Render
"""
import subprocess
import sys
import spacy

def install_spacy_model():
    """Instala el modelo spaCy si no está disponible"""
    try:
        # Intentar cargar el modelo
        nlp = spacy.load('es_core_news_sm')
        print("✅ Modelo spaCy ya está instalado")
        return True
    except OSError:
        print("⚠️ Modelo spaCy no encontrado, descargando...")
        try:
            # Descargar el modelo
            result = subprocess.run([
                sys.executable, "-m", "spacy", "download", "es_core_news_sm"
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ Modelo spaCy descargado correctamente")
                # Verificar que se puede cargar
                nlp = spacy.load('es_core_news_sm')
                print("✅ Modelo spaCy verificado")
                return True
            else:
                print(f"❌ Error al descargar modelo: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Error al instalar modelo spaCy: {str(e)}")
            return False

if __name__ == "__main__":
    success = install_spacy_model()
    sys.exit(0 if success else 1) 