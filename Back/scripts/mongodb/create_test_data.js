// create_test_data.js
function createTestData(userId) {
  print("Creando datos de prueba para usuario: " + userId);

  // Crear materias con horarios realistas
  var subjects = [
    {
      user_id: userId,
      name: "Cálculo Diferencial",
      description: "Matemáticas avanzadas",
      color: "primary",
      credits: 4,
      schedule: [
        {
          day: "Lunes",
          startTime: "08:00",
          endTime: "10:00",
        },
        {
          day: "Miércoles",
          startTime: "08:00",
          endTime: "10:00",
        },
      ],
    },
    {
      user_id: userId,
      name: "Física Mecánica",
      description: "Física básica",
      color: "secondary",
      credits: 4,
      schedule: [
        {
          day: "Martes",
          startTime: "10:00",
          endTime: "12:00",
        },
        {
          day: "Jueves",
          startTime: "10:00",
          endTime: "12:00",
        },
      ],
    },
    {
      user_id: userId,
      name: "Programación Web",
      description: "Desarrollo web fullstack",
      color: "tertiary",
      credits: 3,
      schedule: [
        {
          day: "Lunes",
          startTime: "14:00",
          endTime: "16:00",
        },
        {
          day: "Viernes",
          startTime: "14:00",
          endTime: "16:00",
        },
      ],
    },
    {
      user_id: userId,
      name: "Inglés Técnico",
      description: "Inglés para ingeniería",
      color: "success",
      credits: 2,
      schedule: [
        {
          day: "Miércoles",
          startTime: "16:00",
          endTime: "18:00",
        },
      ],
    },
    {
      user_id: userId,
      name: "Bases de Datos",
      description: "Diseño y gestión de BD",
      color: "warning",
      credits: 3,
      schedule: [
        {
          day: "Martes",
          startTime: "14:00",
          endTime: "16:00",
        },
        {
          day: "Jueves",
          startTime: "14:00",
          endTime: "16:00",
        },
      ],
    },
  ];

  var subjectIds = subjects.map(function (subject) {
    return db.subjects.insertOne(subject).insertedId;
  });
  print("Materias creadas: " + subjectIds.length);

  // Crear tareas con fechas realistas
  var tasks = [
    {
      user_id: userId,
      subject_id: subjectIds[0].toString(),
      description: "Parcial de límites y derivadas",
      due_date: new Date("2024-03-25"),
      completed: false,
    },
    {
      user_id: userId,
      subject_id: subjectIds[1].toString(),
      description: "Informe laboratorio de cinemática",
      due_date: new Date("2024-04-05"),
      completed: false,
    },
    {
      user_id: userId,
      subject_id: subjectIds[2].toString(),
      description: "Proyecto final Angular",
      due_date: new Date("2024-06-20"),
      completed: false,
    },
    {
      user_id: userId,
      subject_id: subjectIds[3].toString(),
      description: "Presentación en inglés",
      due_date: new Date("2024-05-15"),
      completed: false,
    },
    {
      user_id: userId,
      subject_id: subjectIds[4].toString(),
      description: "Diseño de BD para proyecto",
      due_date: new Date("2024-04-30"),
      completed: false,
    },
    {
      user_id: userId,
      subject_id: subjectIds[0].toString(),
      description: "Examen final de cálculo",
      due_date: new Date("2024-07-10"),
      completed: false,
    },
    {
      user_id: userId,
      subject_id: subjectIds[1].toString(),
      description: "Proyecto de péndulo simple",
      due_date: new Date("2024-05-20"),
      completed: false,
    },
  ];

  var taskIds = tasks.map(function (task) {
    return db.tasks.insertOne(task).insertedId;
  });
  print("Tareas creadas: " + taskIds.length);

  // Crear recordatorios con fechas realistas
  var reminders = [
    {
      user_id: userId,
      task_id: taskIds[0].toString(),
      message: "Estudiar límites y derivadas",
      reminder_date: new Date("2024-03-24T18:00:00"),
      priority: 4,
      status: "pendiente",
      insistence_level: 5,
    },
    {
      user_id: userId,
      task_id: taskIds[1].toString(),
      message: "Completar mediciones de laboratorio",
      reminder_date: new Date("2024-04-04T20:00:00"),
      priority: 3,
      status: "pendiente",
      insistence_level: 4,
    },
    {
      user_id: userId,
      task_id: taskIds[2].toString(),
      message: "Reunión de grupo proyecto Angular",
      reminder_date: new Date("2024-06-15T10:00:00"),
      priority: 5,
      status: "pendiente",
      insistence_level: 6,
    },
    {
      user_id: userId,
      task_id: taskIds[3].toString(),
      message: "Practicar presentación",
      reminder_date: new Date("2024-05-14T16:00:00"),
      priority: 3,
      status: "pendiente",
      insistence_level: 4,
    },
    {
      user_id: userId,
      task_id: taskIds[4].toString(),
      message: "Revisar normalización de BD",
      reminder_date: new Date("2024-04-29T14:00:00"),
      priority: 4,
      status: "pendiente",
      insistence_level: 5,
    },
  ];

  reminders.forEach(function (reminder) {
    db.reminders.insertOne(reminder);
  });
  print("Recordatorios creados: " + reminders.length);

  print("Datos de prueba creados exitosamente");
}

// Para ejecutar desde la terminal de mongosh
if (typeof userId !== "undefined") {
  createTestData(userId);
} else {
  print("Por favor proporciona un userId");
}
