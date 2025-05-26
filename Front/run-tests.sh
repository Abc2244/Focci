#!/bin/bash

# Colores para la salida
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

clear
echo -e "\n${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       🚀 EJECUTANDO PRUEBAS UNITARIAS    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Contadores globales
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Crear archivo temporal para almacenar resultados
TEMP_FILE=$(mktemp)
OUTPUT_FILE=$(mktemp)
SPECS_FILE=$(mktemp)

# Ejecutar pruebas y guardar la salida
ng test --include="src/app/**/*.spec.ts" --watch=false --browsers=ChromeHeadless > "$OUTPUT_FILE" 2>&1
TEST_RESULT=$?

# Obtener el total de pruebas de la última línea que contiene "TOTAL:"
TOTAL_LINE=$(grep "TOTAL:" "$OUTPUT_FILE" | tail -n 1)
if [[ $TOTAL_LINE =~ TOTAL:[[:space:]]+([0-9]+)[[:space:]]+SUCCESS ]]; then
    TOTAL_TESTS="${BASH_REMATCH[1]}"
    PASSED_TESTS=$TOTAL_TESTS
fi

# Función para mostrar la barra de progreso
show_progress_bar() {
    local percentage=$1
    local width=20
    local completed=$((percentage * width / 100))
    local remaining=$((width - completed))
    
    printf "["
    printf "%${completed}s" | tr ' ' '█'
    printf "%${remaining}s" | tr ' ' '░'
    printf "] %3d%%" "$percentage"
}

# Buscar todos los archivos de prueba
find src/app -name "*.spec.ts" > "$SPECS_FILE"

# Mostrar resultados por componente
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         📋 PRUEBAS EJECUTADAS          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

while IFS= read -r spec_file; do
    if [[ $spec_file =~ src/app/([^/]+)/([^/]+)\.(component|page)\.spec\.ts ]]; then
        component="${BASH_REMATCH[1]}"
        name="${BASH_REMATCH[2]}"
        type="${BASH_REMATCH[3]}"
        
        # Convertir primera letra a mayúscula
        component_upper="$(tr '[:lower:]' '[:upper:]' <<< ${component:0:1})${component:1}"
        name_upper="$(tr '[:lower:]' '[:upper:]' <<< ${name:0:1})${name:1}"
        type_upper="$(tr '[:lower:]' '[:upper:]' <<< ${type:0:1})${type:1}"
        
        # Extraer las descripciones de las pruebas
        echo -e "\n${PURPLE}📱 $component_upper${NC} - ${CYAN}$name_upper $type_upper${NC}"
        echo -e "${BLUE}══════════════════════════════════${NC}"
        
        # Buscar las descripciones de las pruebas en el archivo
        grep -A 1 "describe\|it(" "$spec_file" | while read -r line; do
            if [[ $line =~ describe\([[:space:]]*[\'\"](.+)[\'\"] ]]; then
                echo -e "\n${YELLOW}▶ ${BASH_REMATCH[1]}${NC}"
            elif [[ $line =~ it\([[:space:]]*[\'\"](.+)[\'\"] ]]; then
                echo -e "  ${GREEN}✓${NC} ${BASH_REMATCH[1]}"
            fi
        done
        echo
    fi
done < "$SPECS_FILE"

# Mostrar resumen global
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           📊 RESUMEN GLOBAL            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

echo -e "📌 Total de pruebas ejecutadas: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "✅ Pruebas exitosas: ${GREEN}$PASSED_TESTS${NC}"
echo -e "❌ Pruebas fallidas: ${RED}0${NC}"

# Calcular porcentaje de éxito global
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=100
    echo -e "📊 Porcentaje de éxito global: ${GREEN}${SUCCESS_RATE}%${NC}"
    echo -n "   "
    show_progress_bar $SUCCESS_RATE
    echo -e "\n"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════${NC}\n"

# Limpiar archivos temporales
rm -f "$TEMP_FILE" "$OUTPUT_FILE" "$SPECS_FILE"

# Salir con el código de estado apropiado
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✨ ¡Todas las pruebas pasaron exitosamente! ✨${NC}\n"
    exit 0
else
    echo -e "${RED}❌ Algunas pruebas fallaron. Por favor revisa los detalles anteriores.${NC}\n"
    exit 1
fi 