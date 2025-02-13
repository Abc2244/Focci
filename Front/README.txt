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
##Santiago start here##
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

