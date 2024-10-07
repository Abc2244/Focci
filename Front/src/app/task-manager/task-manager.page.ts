import { Component } from '@angular/core';
import { ApiService } from '../api.service';  // Asegúrate de que la ruta es correcta

@Component({
  selector: 'app-task-manager',
  templateUrl: './task-manager.page.html',
  styleUrls: ['./task-manager.page.scss'],
})
export class TaskManagerPage {

  taskDescription: string = '';  // Inicializa las propiedades
  taskPriority: number = 0;
  dueDate: string = '';
  taskId: number = 0;
  userId: string = '';  // Nuevo campo para el ID del usuario
  subjectId: string = '';  // Nuevo campo para el ID de la materia
  difficulty: number = 0;  // Campo para la dificultad de la tarea

  constructor(private apiService: ApiService) {}

  // Función para crear una nueva tarea
  crearNuevaTarea() {
    const nuevaTarea = {
      user_id: this.userId,  // Enviar el ID del usuario
      subject_id: this.subjectId,  // Enviar el ID de la materia
      description: this.taskDescription,
      due_date: this.dueDate,
      difficulty: this.difficulty,  // Enviar la dificultad
      subject_priority: this.taskPriority  // Prioridad de la materia
    };

    this.apiService.createTask(nuevaTarea).subscribe(response => {
      console.log('Tarea creada:', response);
      alert('Tarea creada con éxito');
    }, error => {
      console.error('Error al crear la tarea:', error);
      alert('Error al crear la tarea');
    });
  }

  // Función para completar una tarea
  completarTarea() {
    if (this.taskId) {
      this.apiService.completeTask(this.taskId).subscribe(response => {
        console.log('Tarea completada:', response);
        alert('Tarea completada con éxito');
      }, error => {
        console.error('Error al completar la tarea:', error);
        alert('Error al completar la tarea');
      });
    } else {
      alert('Por favor, introduce un ID de tarea válido');
    }
  }
}
