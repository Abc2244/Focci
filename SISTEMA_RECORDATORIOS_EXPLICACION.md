# 🤖 Sistema de Recordatorios Inteligentes - Explicación Completa

## 📋 Resumen General

El **Asistente Inteligente** de Focci es un sistema automatizado que analiza tus tareas y genera planes personalizados de recordatorios y horarios de estudio. Todo funciona de manera automática sin intervención manual.

---

## 🔄 Flujo Completo del Sistema

### 1. **Carga Inicial** (`ngOnInit` en `smart.page.ts`)
```typescript
async ngOnInit() {
  this.userId = this.authService.getCurrentUserId();
  if (this.userId) {
    await this.loadData(); // ← Punto de entrada principal
  }
}
```

### 2. **Proceso de Carga de Datos** (`loadData()`)
```typescript
async loadData() {
  this.isLoading = true;
  try {
    await this.loadSubjects();        // Carga materias del usuario
    await this.loadTasks();           // Carga tareas pendientes
    await this.generateReminderPlans(); // ← GENERA RECORDATORIOS AUTOMÁTICAMENTE
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    this.isLoading = false;
  }
}
```

---

## 🧠 Análisis Automático de Tareas

### **Cálculo de Prioridad** (Basado en días hasta vencimiento)
```typescript
// En generateReminderPlans()
const daysUntilDue = this.getDaysUntilDue(task.due_date);
let taskPriority = 3; // Prioridad media por defecto

if (daysUntilDue <= 2) {
  taskPriority = 5; // 🔴 ALTA PRIORIDAD - Muy urgente
} else if (daysUntilDue <= 5) {
  taskPriority = 4; // 🟡 PRIORIDAD MEDIA-ALTA - Urgente
} else if (daysUntilDue >= 14) {
  taskPriority = 2; // 🔵 PRIORIDAD BAJA - No urgente
}
// Entre 6-13 días = Prioridad 3 (normal)
```

### **Cálculo de Insistencia** (Basado en tipo de tarea)
```typescript
let insistenceLevel = 1; // Nivel bajo por defecto

if (task.task_type === 'examen') {
  insistenceLevel = 5; // 📝 MÁXIMA INSISTENCIA - Es un examen
} else if (task.task_type === 'proyecto') {
  insistenceLevel = 3; // 🏗️ INSISTENCIA MEDIA - Es un proyecto
}
// Otros tipos = Insistencia 1 (baja)
```

---

## 🔔 Generación Automática de Recordatorios

### **Lógica del Algoritmo** (`SmartAssistantService.generateReminderPlanForTask()`)

```typescript
// ALTA PRIORIDAD O INSISTENCIA (≥4)
if (taskPriority >= 4 || insistenceLevel >= 4) {
  reminderPlan.reminders = [
    {
      time: '1 semana antes',
      description: `Recuerda que tienes que completar: ${task.description}`,
      level: 3,
      date: this.calculateRelativeDateString(dueDate, -7), // 7 días antes
    },
    {
      time: '3 días antes',
      description: `No olvides tu tarea: ${task.description}`,
      level: 4,
      date: this.calculateRelativeDateString(dueDate, -3), // 3 días antes
    },
    {
      time: '1 día antes',
      description: `¡Mañana vence tu tarea: ${task.description}!`,
      level: 5,
      date: this.calculateRelativeDateString(dueDate, -1), // 1 día antes
    },
  ];
}

// PRIORIDAD MEDIA (3) O INSISTENCIA MEDIA (≥2)
else if (taskPriority >= 3 || insistenceLevel >= 2) {
  reminderPlan.reminders = [
    {
      time: '3 días antes',
      description: `Recuerda tu tarea: ${task.description}`,
      level: 3,
      date: this.calculateRelativeDateString(dueDate, -3),
    },
    {
      time: '1 día antes',
      description: `Mañana vence tu tarea: ${task.description}`,
      level: 4,
      date: this.calculateRelativeDateString(dueDate, -1),
    },
  ];
}

// BAJA PRIORIDAD (<3) Y BAJA INSISTENCIA (<2)
else {
  reminderPlan.reminders = [
    {
      time: '1 día antes',
      description: `Mañana vence tu tarea: ${task.description}`,
      level: 3,
      date: this.calculateRelativeDateString(dueDate, -1),
    },
  ];
}
```

### **Cálculo de Fechas Reales**
```typescript
private calculateRelativeDateString(baseDate: Date, daysOffset: number): string | null {
  if (!baseDate) return null;
  
  const result = new Date(baseDate);
  result.setDate(result.getDate() + daysOffset); // Suma/resta días
  return result.toISOString(); // Convierte a formato ISO
}
```

---

## ⏰ Detección Automática de Horarios Libres

### **Algoritmo de Búsqueda** (`findBestStudyTimes()`)

```typescript
// 1. DETERMINAR CANTIDAD DE SLOTS SEGÚN URGENCIA
let slotsToRecommend = 1;
if (daysUntilDue <= 3) {
  slotsToRecommend = 3; // 🔴 Muy urgente - 3 slots
} else if (daysUntilDue <= 7) {
  slotsToRecommend = 2; // 🟡 Urgente - 2 slots
}
// Más de 7 días = 1 slot

// 2. HORARIOS ÓPTIMOS DE ESTUDIO PREDEFINIDOS
const studyTimes = [
  { start: 7, end: 9 },   // 7:00-9:00 AM - Temprano
  { start: 9, end: 12 },  // 9:00-12:00 PM - Mañana
  { start: 12, end: 14 }, // 12:00-2:00 PM - Mediodía
  { start: 14, end: 17 }, // 2:00-5:00 PM - Tarde
  { start: 17, end: 19 }, // 5:00-7:00 PM - Final tarde
  { start: 19, end: 22 }, // 7:00-10:00 PM - Noche
];

// 3. COMPARACIÓN CON CALENDARIO PERSONAL
const isOccupied = schedule.some((item) => {
  // Verifica si hay conflicto con eventos existentes
  // Compara día de la semana y horarios
  return overlap; // true si hay conflicto
});

// 4. ORDENAMIENTO POR PROXIMIDAD
freeSlots.sort((a, b) => a.start.getTime() - b.start.getTime());

// 5. LIMITACIÓN A CANTIDAD RECOMENDADA
plan.availableSlots = freeSlots.slice(0, slotsToRecommend);
```

---

## 📊 Ejemplos Prácticos

### **Ejemplo 1: Examen en 2 días**
- **Tipo:** `examen`
- **Días restantes:** 2
- **Cálculo automático:**
  - Prioridad: 5 (≤2 días = muy urgente)
  - Insistencia: 5 (examen = máxima)
- **Recordatorios generados:** 3
  - 1 semana antes (si aplica)
  - 3 días antes (si aplica)
  - 1 día antes
- **Slots recomendados:** 3 (muy urgente)

### **Ejemplo 2: Proyecto en 10 días**
- **Tipo:** `proyecto`
- **Días restantes:** 10
- **Cálculo automático:**
  - Prioridad: 3 (6-13 días = normal)
  - Insistencia: 3 (proyecto = media)
- **Recordatorios generados:** 2
  - 3 días antes
  - 1 día antes
- **Slots recomendados:** 1 (normal)

### **Ejemplo 3: Tarea general en 20 días**
- **Tipo:** `general`
- **Días restantes:** 20
- **Cálculo automático:**
  - Prioridad: 2 (≥14 días = baja)
  - Insistencia: 1 (general = baja)
- **Recordatorios generados:** 1
  - 1 día antes
- **Slots recomendados:** 1 (baja urgencia)

---

## 🎯 Interfaz de Usuario Explicativa

### **Información Mostrada Automáticamente:**

1. **🤖 Análisis Automático:**
   - Chips de prioridad, insistencia y tipo
   - Explicación del cálculo realizado

2. **🔔 Plan de Recordatorios Generado:**
   - Cantidad de recordatorios y lógica aplicada
   - Lista detallada con fechas calculadas
   - Niveles de prioridad de cada recordatorio

3. **⏰ Horarios Libres Detectados:**
   - Explicación del proceso de detección
   - Comparación con calendario personal
   - Cantidad basada en urgencia

4. **⚠️ Alertas Inteligentes:**
   - Mensaje cuando no hay horarios libres
   - Sugerencias para resolver conflictos

---

## 🔧 Archivos Clave del Sistema

### **Frontend:**
- `smart.page.ts` - Lógica principal y coordinación
- `smart.page.html` - Interfaz explicativa
- `smart.page.scss` - Estilos visuales
- `smart-assistant.service.ts` - Generación de recordatorios

### **Backend:**
- `task_scheduler_service.py` - Templates de recordatorios
- `task_service.py` - Procesamiento de tareas

---

## ✅ Ventajas del Sistema

1. **🔄 Completamente Automático:** No requiere configuración manual
2. **🧠 Inteligente:** Adapta recordatorios según urgencia y tipo
3. **📅 Integrado:** Considera tu calendario personal
4. **📊 Transparente:** Explica cada decisión tomada
5. **⚡ Eficiente:** Optimiza horarios de estudio
6. **🎯 Personalizado:** Se adapta a cada tarea individualmente

---

## 🚀 Flujo de Uso

1. **Usuario crea una tarea** → Sistema la detecta automáticamente
2. **Sistema analiza** → Calcula prioridad e insistencia
3. **Genera recordatorios** → Basado en algoritmos inteligentes
4. **Busca horarios libres** → Compara con calendario
5. **Muestra recomendaciones** → Con explicaciones detalladas
6. **Usuario acepta plan** → Recordatorios se programan automáticamente

¡El sistema funciona completamente en segundo plano, proporcionando inteligencia artificial real para la gestión de tareas y tiempo! 🎉 