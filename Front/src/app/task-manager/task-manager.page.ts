import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';  // Asegúrate de que la ruta es correcta

@Component({
  selector: 'app-task-manager',
  templateUrl: './task-manager.page.html',
  styleUrls: ['./task-manager.page.scss'],
})
export class TaskManagerPage implements OnInit {  // Implementa OnInit

  taskDescription: string = '';  // Inicializa las propiedades
  dueDate: string = '';
  taskId: number = 0;
  userId: string = '';  // Campo para el ID del usuario
  subjectId: string = '';  // Campo para seleccionar la materia
  subjects: any[] = [];  // Lista de materias obtenidas del backend

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    // Simulando la obtención del userId desde algún lugar (puede ser un servicio de autenticación)
    this.userId = "6700687e895d4fe3cc358103";  // Reemplaza con el valor real del ID del usuario

    if (this.userId) {
      this.loadSubjects();  // Carga las materias si el ID de usuario es válido
    } else {
      console.error("No se ha encontrado el ID del usuario.");
    }
  }

  // Cargar las materias disponibles
  loadSubjects() {
    this.apiService.getUserSubjects(this.userId).subscribe(response => {
      this.subjects = response;
    }, error => {
      console.error('Error al cargar las materias:', error);
    });
  }

  // Función para crear una nueva tarea
  crearNuevaTarea() {
    const nuevaTarea = {
      user_id: this.userId,  // Enviar el ID del usuario
      subject_id: this.subjectId,  // Enviar el ID de la materia
      description: this.taskDescription,
      due_date: this.dueDate,
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
