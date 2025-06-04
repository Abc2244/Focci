# Scripts de Datos de Prueba - Focci

Este directorio contiene scripts para generar y limpiar datos de prueba en la aplicación Focci.

## 🚀 Scripts Disponibles

### 1. `create_test_data_complete.py`
Script completo para crear datos de prueba realistas con **emails únicos** y **contraseñas correctamente hasheadas**.

**Qué crea:**
- ✅ 1 usuario de prueba con email único (`test{timestamp}@focci.com`)
- ✅ 8 materias con horarios universitarios realistas
- ✅ 10 tareas variadas con diferentes tipos y prioridades
- ✅ 10 recordatorios inteligentes basados en las tareas
- ✅ **Contraseña hasheada con bcrypt** (compatible con el sistema de autenticación)

**Uso:**
```bash
# Activar entorno virtual
source venv/bin/activate

# Ejecutar script (cada ejecución crea un usuario diferente)
python scripts/create_test_data_complete.py
```

### 2. `list_test_users.py` 🆕
Script interactivo para gestionar todos los usuarios de prueba.

**Funciones:**
- 📋 Listar todos los usuarios de prueba
- 🗑️ Eliminar usuario específico
- 🧹 Eliminar TODOS los usuarios de prueba
- 📊 Ver estadísticas de datos por usuario

**Uso:**
```bash
# Activar entorno virtual
source venv/bin/activate

# Ejecutar script interactivo
python scripts/list_test_users.py
```

### 3. `generate_password_hash.py` 🔐
Script auxiliar para generar hashes de contraseña compatibles con la aplicación.

**Funciones:**
- 🔑 Generar hash bcrypt para cualquier contraseña
- ✅ Verificar que el hash funciona correctamente
- 🛠️ Útil para debugging y desarrollo

**Uso:**
```bash
# Generar hash para "test123" (por defecto)
python scripts/generate_password_hash.py

# Generar hash para contraseña personalizada
python scripts/generate_password_hash.py "mi_contraseña"
```

### 4. `clean_test_data.py` ⚠️ (Obsoleto)
Script para limpiar el último usuario de prueba creado.

**Nota:** Recomendamos usar `list_test_users.py` en su lugar para mayor control.

## 📧 Sistema de Emails Únicos

### Formato de Email
- **Patrón:** `test{timestamp}@focci.com`
- **Ejemplo:** `test1749015854@focci.com`
- **Username:** `Usuario_Prueba_{timestamp}`

### Ventajas
- ✅ **Sin duplicados:** Cada ejecución crea un usuario diferente
- ✅ **Fácil identificación:** El timestamp indica cuándo se creó
- ✅ **Gestión flexible:** Puedes mantener múltiples usuarios de prueba
- ✅ **Limpieza selectiva:** Elimina solo los usuarios que necesites

## 🔐 Sistema de Contraseñas

### Configuración
- **Algoritmo:** bcrypt con passlib
- **Contraseña:** `test123` (para todos los usuarios de prueba)
- **Seguridad:** Hash único por usuario (sal automática)

### Verificación
```bash
# El script genera automáticamente el hash correcto
# Compatible con: pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

## 📊 Datos Generados

### Usuario de Prueba
- **Email:** `test{timestamp}@focci.com` (único por ejecución)
- **Contraseña:** `test123` (siempre la misma, pero hasheada correctamente)
- **Nombre:** `Usuario_Prueba_{timestamp}`
- **🔐 Autenticación:** ✅ Compatible con el sistema de login

### Materias Creadas
1. **Cálculo Diferencial** (4 créditos)
   - Lunes y Miércoles: 8:00 AM - 10:00 AM

2. **Programación Orientada a Objetos** (3 créditos)
   - Martes y Jueves: 10:00 AM - 12:00 PM

3. **Física Mecánica** (4 créditos)
   - Lunes y Viernes: 2:00 PM - 4:00 PM

4. **Álgebra Lineal** (3 créditos)
   - Martes y Jueves: 2:00 PM - 4:00 PM

5. **Química General** (4 créditos)
   - Miércoles y Viernes: 10:00 AM - 12:00 PM

6. **Inglés Técnico** (2 créditos)
   - Lunes: 4:00 PM - 6:00 PM

7. **Metodología de la Investigación** (2 créditos)
   - Miércoles: 4:00 PM - 6:00 PM

8. **Ética Profesional** (2 créditos)
   - Viernes: 4:00 PM - 6:00 PM

### Tipos de Tareas
- **Exámenes:** Prioridad alta (4-5)
- **Proyectos:** Prioridad media-alta (2-4)
- **Talleres:** Prioridad media (3)
- **Lecturas:** Prioridad baja-media (2)
- **Generales:** Prioridad media (3)

### Recordatorios Inteligentes
Los recordatorios se generan automáticamente basados en:
- **Prioridad de la tarea**
- **Tipo de actividad**
- **Fecha de entrega**
- **Nivel de insistencia**

## 🔧 Requisitos

- Python 3.11+
- Entorno virtual activado
- Conexión a MongoDB
- Dependencias instaladas (`requirements.txt`)
- **passlib[bcrypt]** (para hashing de contraseñas)

## ⚠️ Notas Importantes

1. **Entorno de Desarrollo:** Estos scripts están diseñados para entornos de desarrollo y pruebas.

2. **Emails Únicos:** Cada ejecución del script principal crea un usuario diferente.

3. **Contraseñas Seguras:** Se generan hashes bcrypt únicos automáticamente.

4. **Base de Datos:** Los scripts se conectan directamente a la base de datos MongoDB configurada.

5. **Gestión Múltiple:** Puedes tener múltiples usuarios de prueba activos simultáneamente.

6. **Limpieza Selectiva:** Usa `list_test_users.py` para gestionar usuarios específicos.

## 🔑 Credenciales de Login

### Para todos los usuarios de prueba:
- **📧 Email:** `test{timestamp}@focci.com` (ver salida del script)
- **🔒 Contraseña:** `test123`
- ✅ **Estado:** Funciona correctamente con el sistema de autenticación

### Ejemplo:
```
Email: test1749015854@focci.com
Contraseña: test123
```

## 🐛 Solución de Problemas

### Error: "ModuleNotFoundError"
```bash
# Asegúrate de activar el entorno virtual
source venv/bin/activate
```

### Error: "Connection failed"
- Verifica la conexión a internet
- Verifica la configuración de MongoDB en `config/database.py`

### Error: "Permission denied"
```bash
# Hacer los scripts ejecutables
chmod +x scripts/*.py
```

### Error: "Contraseña incorrecta"
- ✅ **Solucionado:** Ahora se usan hashes bcrypt correctos
- ✅ **Contraseña:** `test123` funciona para todos los usuarios de prueba

## 📝 Flujo de Trabajo Recomendado

### Crear Datos de Prueba
```bash
cd Back/
source venv/bin/activate
python scripts/create_test_data_complete.py
```

### Gestionar Usuarios
```bash
cd Back/
source venv/bin/activate
python scripts/list_test_users.py
# Selecciona la opción deseada del menú interactivo
```

### Probar Login
```bash
# Usa las credenciales mostradas al final del script:
# Email: test{timestamp}@focci.com
# Contraseña: test123
```

### Ejemplo de Ejecución Múltiple
```bash
# Crear primer usuario
python scripts/create_test_data_complete.py
# → test1749015400@focci.com / test123

# Crear segundo usuario (diferente timestamp)
python scripts/create_test_data_complete.py
# → test1749015500@focci.com / test123

# Gestionar usuarios
python scripts/list_test_users.py
# → Verás ambos usuarios listados
```

## 🎛️ Menú del Gestor de Usuarios

Al ejecutar `list_test_users.py` verás:

```
🎛️ GESTOR DE USUARIOS DE PRUEBA
========================================
1. 📋 Listar usuarios de prueba
2. 🗑️ Eliminar usuario específico  
3. 🧹 Eliminar TODOS los usuarios de prueba
4. ❌ Salir
```

### Opción 1: Listar Usuarios
Muestra todos los usuarios de prueba con:
- Email y nombre de usuario
- ID de MongoDB
- Fecha de creación
- Estadísticas de datos (materias, tareas, recordatorios)

### Opción 2: Eliminar Usuario Específico
- Lista todos los usuarios
- Permite seleccionar uno para eliminar
- Pide confirmación antes de eliminar
- Elimina todos los datos asociados

### Opción 3: Eliminar Todos
- ⚠️ **CUIDADO:** Elimina TODOS los usuarios de prueba
- Pide confirmación doble
- Muestra resumen de eliminación

## 🤝 Contribución

Para modificar o extender estos scripts:

1. Mantén la estructura de datos compatible con los modelos Pydantic
2. Actualiza la documentación si cambias la funcionalidad
3. Prueba los scripts antes de commitear cambios
4. Respeta el formato de salida con emojis y colores
5. Conserva el sistema de emails únicos
6. **Usa siempre `pwd_context.hash()` para generar contraseñas** 