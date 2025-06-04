#!/usr/bin/env python3
"""
Script simple para ejecutar la generación de datos de prueba
"""

import asyncio
import sys
import os

# Añadir el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scripts.create_test_data_complete import main

if __name__ == "__main__":
    print("🚀 Ejecutando generación de datos de prueba...")
    asyncio.run(main()) 