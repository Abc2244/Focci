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


santiaog mria esto 

🚀 Cómo correr el frontend de Focci (Ionic + Capacitor)
Asegúrate de seguir estos pasos en orden para evitar problemas.

📌 1. Asegurar que tienes todo instalado
Antes de correr el frontend, revisa que tienes instalado:

✅ Node.js (Versión recomendada: 18+)

bash
Copiar
Editar
node -v
Si no lo tienes, instálalo desde nodejs.org.

✅ npm (Debe estar instalado con Node.js)

bash
Copiar
Editar
npm -v
✅ Ionic CLI
Si no lo tienes, instálalo con:

bash
Copiar
Editar
npm install -g @ionic/cli
✅ Capacitor CLI
Si no lo tienes, instálalo con:

bash
Copiar
Editar
npm install -g @capacitor/cli
📌 2. Clonar y entrar en el proyecto (si aún no lo hiciste)
Si tu compañero necesita obtener el código:

bash
Copiar
Editar
git clone <URL_DEL_REPO>
cd Front
Si ya tienes el código, solo entra en la carpeta Front:

bash
Copiar
Editar
cd ~/Doc/Un/Focci/Front
📌 3. Instalar dependencias
Antes de correr el frontend, instala todas las dependencias del proyecto:

bash
Copiar
Editar
npm install
Si hay problemas con dependencias, usa:

bash
Copiar
Editar
rm -rf node_modules package-lock.json
npm install
📌 4. Configurar Capacitor para Android
Si es la primera vez que usas Capacitor en este proyecto, ejecuta:

bash
Copiar
Editar
npx cap init Focci com.focci.app
Esto configurará Capacitor en el proyecto.

Luego, agrega la plataforma Android:

bash
Copiar
Editar
npx cap add android
Si ya estaba agregada, solo sincroniza:

bash
Copiar
Editar
npx cap sync android
📌 5. Correr el proyecto en el navegador (modo desarrollo)
Para probar sin necesidad de emulador:

bash
Copiar
Editar
ionic serve
Esto abrirá la aplicación en el navegador.

Si quieres correrlo en una IP accesible desde otros dispositivos:

bash
Copiar
Editar
ionic serve --host=0.0.0.0
📌 6. Correr el proyecto en un emulador Android o dispositivo
Si ya configuraste Capacitor para Android, ejecuta:

bash
Copiar
Editar
npx cap run android
Esto abrirá Android Studio. Desde ahí, puedes correr la app en un emulador o en un dispositivo conectado por USB.

Si solo quieres compilar sin abrir Android Studio:

bash
Copiar
Editar
npx cap copy android && npx cap open android
Luego, en Android Studio, ejecuta el proyecto.

📌 7. Si necesitas depurar con logs en la consola
Puedes correr:

bash
Copiar
Editar
ionic serve --verbose
O si estás probando en un dispositivo Android:

bash
Copiar
Editar
npx cap log android
¿Qué hacer si algo falla?
Si hay errores de dependencias:

bash
Copiar
Editar
rm -rf node_modules package-lock.json
npm install
Si Capacitor no detecta la plataforma Android:

bash
Copiar
Editar
npx cap sync
Si el emulador no abre, revisa que Android Studio esté instalado y actualizado.

🎯 Resumen rápido
cd Front
npm install
ionic serve (para probar en navegador)
o
npx cap run android (para correr en emulador/dispositivo)