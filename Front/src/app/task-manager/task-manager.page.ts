import { Component } from '@angular/core';
import { ApiService } from '../api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-task-manager',
  templateUrl: './task-manager.page.html',
  styleUrls: ['./task-manager.page.scss'],
})
export class TaskManagerPage {
  subjectId: string = ''; // Para la selección de materia
  taskDescription: string = ''; // Para la descripción de la tarea
  dueDate: string = ''; // Para la fecha de entrega
  taskId: string = ''; // Para completar una tarea

  subjects: any[] = []; // Lista de materias del usuario

  constructor(private apiService: ApiService, private router: Router) {}

  // Obtener materias al iniciar
  ngOnInit() {
    const user_id = localStorage.getItem('user_id');
    if (user_id) {
      this.apiService.getUserSubjects(user_id).subscribe(
        (subjects) => {
          this.subjects = subjects;
        },
        (error) => {
          console.error('Error obteniendo materias:', error);
        }
      );
    }
  }

  // Crear una nueva tarea
  crearNuevaTarea() {
    const user_id = localStorage.getItem('user_id');
    if (!user_id) {
      alert('Usuario no autenticado.');
      return;
    }

    if (!this.subjectId || !this.taskDescription || !this.dueDate) {
      alert('Por favor, llena todos los campos.');
      return;
    }

    const nuevaTarea = {
      user_id: user_id,
      subject_id: this.subjectId,
      description: this.taskDescription,
      due_date: this.dueDate,
    };

    this.apiService.createTask(nuevaTarea).subscribe(
      (response) => {
        alert('Tarea creada con éxito');
        this.taskDescription = '';
        this.dueDate = '';
      },
      (error) => {
        console.error('Error al crear tarea:', error);
      }
    );
  }

  // Completar una tarea
  completarTarea() {
    if (!this.taskId) {
      alert('Por favor, ingresa un ID de tarea válido.');
      return;
    }

    this.apiService.completeTask(this.taskId).subscribe(
      (response) => {
        alert('Tarea completada con éxito');
        this.taskId = '';
      },
      (error) => {
        console.error('Error al completar tarea:', error);
      }
    );
  }
}
