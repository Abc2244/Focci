# 📌 Instrucciones para Configurar y Probar Focci

## 🔹 **1. Clonar el Proyecto**
Si aún no tienes el proyecto en tu máquina, clónalo desde el repositorio:

```bash
cd ~/Documentos  # O donde prefieras clonar el proyecto
git clone <URL_DEL_REPOSITORIO>
cd Focci
```

Si ya tienes el proyecto pero necesitas actualizarlo:
```bash
cd Focci
git pull origin Julian
```
Esto descargará los últimos cambios sin sobrescribir nada que hayas modificado localmente.

---
## 🔹 **2. Configurar el Backend**
### 📦 **Instalar dependencias**
```bash
cd Back
source venv-back/bin/activate  # Activar entorno en Mac/Linux

pip install -r requirements.txt  # Instalar dependencias
```

### 🚀 **Ejecutar el backend**
```bash
uvicorn api.main:app --reload
```
La API estará disponible en `http://127.0.0.1:8000/docs` para probar los endpoints con Swagger.

---
## 🔹 **3. Configurar el Frontend**
### 📦 **Instalar dependencias**
```bash
cd ../Front
nvm use  # Usar la versión correcta de Node.js
npm install  # Instalar las dependencias
```

### 🏗️ **Construir el proyecto**
```bash
npm run build
```
Esto generará los archivos de producción en la carpeta `www/`.

### 📱 **Probar en el navegador**
```bash
npm start
```
Accede en `http://localhost:8100`.

---
## 🔹 **4. Configurar Capacitor para Android**
Si es la primera vez que configuras Capacitor:
```bash
npx cap init Focci com.tuempresa.focci
```

Si ya está configurado, asegúrate de que Android está bien sincronizado:
```bash
npx cap sync android
```

Para abrir Android Studio y probar en un emulador o dispositivo físico:
```bash
npx cap open android
```

---
## 🔹 **5. Pruebas y Debugging**
### 🛠️ **Pruebas en el backend**
Para asegurarte de que el backend está funcionando correctamente, ejecuta los tests:
```bash
cd ../Back/tests
pytest test_focci_api.py -v
```
Si todos los tests pasan, significa que las rutas funcionan bien.

### 🔍 **Verificar que el frontend consume la API correctamente**
1. Asegúrate de que el backend está corriendo.
2. Abre el frontend (`npm start`).
3. Intenta registrarte e iniciar sesión para comprobar la conexión con la API.

---
## 🔹 **6. Buenas Prácticas al Trabajar en el Código**
✅ **Antes de modificar algo:**
```bash
git pull origin Julian  # Asegúrate de tener la última versión
```
✅ **Después de hacer cambios:**
```bash
git add .
git commit -m "Explicación clara del cambio"
git push origin Julian
```
✅ **Si tienes dudas, pregunta antes de instalar paquetes nuevos o modificar configuraciones críticas.**

---
### 📌 **Resumen**
1️⃣ **Backend**: `cd Back && uvicorn api.main:app --reload`
2️⃣ **Frontend**: `cd Front && npm start`
3️⃣ **Capacitor**: `npx cap sync android && npx cap open android`
4️⃣ **Pruebas**: `pytest test_focci_api.py -v`

¡Con esto ya puedes empezar a trabajar sin problemas! 🚀

SANTIAGO DE AQUI EN ADELANTE ETO TE SIRVE PARA CAPACITOR Y ANDROID Studio

# Configuración del Frontend con Capacitor y Android Studio

Este documento explica cómo configurar **Capacitor** en Ionic y preparar el entorno para ejecutar el frontend de **Focci** en un emulador o dispositivo Android.

---

## 1. Instalación de Dependencias
### 1.1 Asegúrate de tener **Node.js 20+** y **npm** instalado.
Para verificarlo, ejecuta:
```sh
node -v
npm -v
```
Si no tienes la versión correcta, descarga **Node.js LTS** desde [https://nodejs.org/](https://nodejs.org/).

### 1.2 Instalar las dependencias del proyecto:
```sh
cd Front
npm install
```

### 1.3 Instalar Capacitor:
```sh
npm install -g @capacitor/cli
```

### 1.4 Verificar que Capacitor está instalado correctamente:
```sh
npx cap --version
```

---

## 2. Configurar Capacitor para Android
### 2.1 Sincronizar Capacitor con el proyecto:
```sh
npx cap sync android
```
Esto genera la carpeta `android/` con los archivos necesarios.

### 2.2 Abrir el proyecto en Android Studio:
```sh
npx cap open android
```
Si muestra un error diciendo que no encuentra **Android Studio**, verifica su instalación y ubicación.

#### Configurar la RUTA de Android Studio (si es necesario)
Si no abre **Android Studio**, configura la variable de entorno ejecutando:
```sh
setx CAPACITOR_ANDROID_STUDIO_PATH "C:\\Path\\To\\Android Studio\\bin\\studio64.exe"
```
(Reemplaza `"C:\\Path\\To\\Android Studio\\bin\\studio64.exe"` con la ubicación real.)

Después, vuelve a intentar:
```sh
npx cap open android
```

---

## 3. Ejecutar la Aplicación en un Emulador o Dispositivo
### 3.1 Iniciar un emulador en **Android Studio**
- Abre **Android Studio**.
- Ve a **Device Manager** y ejecuta un **dispositivo virtual**.

### 3.2 Ejecutar la app en el emulador o dispositivo físico:
```sh
npx cap run android
```
> **Nota:** Si usas un **dispositivo físico**, activa el **Modo Depuración USB**.

---

## 4. Solución de Problemas
### Capacitor no encuentra Android Studio
Ejecuta:
```sh
where studio
```
Si no aparece la ruta, configura manualmente la variable de entorno como se explicó antes.

### No se instala Capacitor correctamente
Intenta borrar y reinstalar las dependencias:
```sh
rm -rf node_modules package-lock.json
npm install
```

---

## 5. Ejecutar en el Navegador (Modo Desarrollo)
Si solo quieres probar la app en el navegador sin usar un emulador, ejecuta:
```sh
ionic serve
```
Esto abrirá la aplicación en el navegador con recarga automática.

---

Con estos pasos, tu entorno estará listo para trabajar con Capacitor y Android Studio en **Windows**. 🚀📱

