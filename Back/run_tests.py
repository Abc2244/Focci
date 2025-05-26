#!/usr/bin/env python3
import os
import sys
import time
from datetime import datetime

# Colores ANSI
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_colored(text, color):
    print(f"{color}{text}{Colors.ENDC}")

def print_header():
    print_colored("\n" + "="*80, Colors.HEADER)
    print_colored("🧪 FOCCI Backend Test Runner", Colors.BOLD)
    print_colored(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", Colors.CYAN)
    print_colored("="*80 + "\n", Colors.HEADER)

def main():
    print_header()
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists("tests"):
        if os.path.exists("Back/tests"):
            os.chdir("Back")
        else:
            print_colored("❌ Error: No se encuentra el directorio de tests", Colors.RED)
            sys.exit(1)
    
    # Ejecutar los tests
    print_colored("\n📋 Ejecutando tests...\n", Colors.BLUE)
    start_time = time.time()
    
    # Configurar pytest para que no muestre las advertencias por defecto
    test_command = "python3 -m pytest tests/test_focci_api.py tests/test_task_classifier.py tests/test_task_service.py -v --disable-warnings"
    exit_code = os.system(test_command)
    
    end_time = time.time()
    duration = end_time - start_time
    
    # Imprimir resumen
    print_colored("\n" + "="*80, Colors.HEADER)
    print_colored("📊 Resumen de la Ejecución", Colors.BOLD)
    print_colored("="*80, Colors.HEADER)
    print_colored(f"\nTiempo de ejecución: {duration:.2f} segundos", Colors.CYAN)
    
    if exit_code == 0:
        print_colored("\n✨ ¡Todos los tests pasaron exitosamente! ✨", Colors.GREEN)
    else:
        print_colored("\n⚠️  Algunos tests fallaron. Por favor, revisa los errores.", Colors.RED)
        print_colored("\n💡 Tip: Para ver las advertencias, ejecuta sin --disable-warnings", Colors.YELLOW)
    
    print_colored("\n" + "="*80, Colors.HEADER)
    sys.exit(exit_code >> 8)

if __name__ == "__main__":
    main() 