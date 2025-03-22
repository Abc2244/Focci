#!/bin/bash
echo "🚀 Iniciando actualización de la app para Android..."

echo "📦 Construyendo la aplicación..."
ionic build

echo "📋 Copiando archivos a Android..."
npx cap copy android

echo "🔄 Sincronizando cambios..."
npx cap sync android

echo "📱 Abriendo Android Studio..."
npx cap open android

echo "✅ ¡Proceso completado!"