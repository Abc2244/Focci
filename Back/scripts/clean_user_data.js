// clean_user_data.js
function cleanUserData(userId) {
  print("Limpiando datos del usuario: " + userId);

  // Eliminar recordatorios
  var remindersDeleted = db.reminders.deleteMany({ user_id: userId });
  print("Recordatorios eliminados: " + remindersDeleted.deletedCount);

  // Eliminar tareas
  var tasksDeleted = db.tasks.deleteMany({ user_id: userId });
  print("Tareas eliminadas: " + tasksDeleted.deletedCount);

  // Eliminar materias
  var subjectsDeleted = db.subjects.deleteMany({ user_id: userId });
  print("Materias eliminadas: " + subjectsDeleted.deletedCount);

  print("Limpieza completada");
}
