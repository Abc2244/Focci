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

  constructor(private apiService: ApiService) {}

  // Función para crear una nueva tarea
  crearNuevaTarea() {
    const nuevaTarea = {
      description: this.taskDescription,
      subject_priority: this.taskPriority,
      due_date: this.dueDate
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
