import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { AlertController, AlertInput } from '@ionic/angular';

@Component({
  selector: 'app-task-manager',
  templateUrl: './task-manager.page.html',
  styleUrls: ['./task-manager.page.scss'],
})
export class TaskManagerPage implements OnInit {
  tasks: any[] = [];
  subjects: any[] = [];
  subjectMap: Map<string, string> = new Map();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadSubjects();
    this.loadTasks();
  }

  loadSubjects() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUserSubjects(userId).subscribe(
        (subjects) => {
          this.subjects = subjects;
          // Crear un mapa de ID de materia a nombre para referencia rápida
          subjects.forEach((subject: any) => {
            this.subjectMap.set(subject._id, subject.name);
          });
        },
        (error) => {
          console.error('Error al cargar las materias:', error);
        }
      );
    }
  }

  loadTasks() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUserTasks(userId).subscribe(
        (tasks) => {
          this.tasks = tasks;
        },
        (error) => {
          console.error('Error al cargar las tareas:', error);
        }
      );
    }
  }

  getSubjectName(subjectId: string): string {
    return this.subjectMap.get(subjectId) || 'Materia no encontrada';
  }

  async addTask() {
    // Crear inputs para las materias usando radio buttons
    const subjectInputs: AlertInput[] = this.subjects.map((subject) => ({
      type: 'radio' as const,
      label: subject.name,
      value: subject._id,
      name: 'subject_id',
    }));

    const alert = await this.alertController.create({
      header: 'Nueva Tarea',
      inputs: [
        {
          name: 'description',
          type: 'text' as const,
          placeholder: 'Descripción de la tarea',
        },
        ...subjectInputs,
        {
          name: 'due_date',
          type: 'datetime-local' as const,
          placeholder: 'Fecha de entrega',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            return true;
          },
        },
        {
          text: 'Agregar',
          handler: (data) => {
            if (data.description && data.subject_id && data.due_date) {
              const userId = this.authService.getCurrentUserId();
              if (userId) {
                const newTask = {
                  user_id: userId,
                  subject_id: data.subject_id,
                  description: data.description,
                  due_date: data.due_date,
                };

                this.apiService.createTask(newTask).subscribe(
                  () => {
                    this.loadTasks();
                  },
                  (error) => {
                    console.error('Error al crear la tarea:', error);
                  }
                );
                return true;
              }
            }
            return false;
          },
        },
      ],
    });

    await alert.present();
  }
}
