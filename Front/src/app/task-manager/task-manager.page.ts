import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { AlertController, AlertInput, ToastController } from '@ionic/angular';
import { Task, CreateTaskDTO } from '../interfaces/task.interface';
import { Subject } from '../interfaces/subject.interface';

@Component({
  selector: 'app-task-manager',
  templateUrl: './task-manager.page.html',
  styleUrls: ['./task-manager.page.scss'],
})
export class TaskManagerPage implements OnInit {
  tasks: Task[] = [];
  subjects: Subject[] = [];
  subjectMap: Map<string, string> = new Map();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
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
    const subject = this.subjects.find((s) => s._id === subjectId);
    return subject ? subject.name : 'Materia no encontrada';
  }

  completeTask(taskId: string) {
    this.apiService.completeTask(taskId).subscribe(
      () => {
        this.loadTasks();
      },
      (error) => {
        console.error('Error al completar la tarea:', error);
      }
    );
  }

  uncompleteTask(taskId: string) {
    // Asumiendo que tienes este método en tu API
    this.apiService.uncompleteTask(taskId).subscribe(
      () => {
        this.loadTasks();
      },
      (error) => {
        console.error('Error al desmarcar la tarea:', error);
      }
    );
  }

  deleteTask(taskId: string) {
    this.apiService.deleteTask(taskId).subscribe(
      () => {
        this.loadTasks();
      },
      (error) => {
        console.error('Error al eliminar la tarea:', error);
      }
    );
  }

  async addTask() {
    if (this.subjects.length === 0) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Primero debes crear al menos una materia',
        buttons: ['OK'],
        cssClass: 'error-alert',
      });
      await alert.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Nueva Tarea',
      cssClass: 'task-form-alert',
      inputs: [
        {
          name: 'description',
          type: 'text' as const,
          placeholder: 'Descripción de la tarea',
          label: 'Descripción',
          cssClass: 'task-input',
        },
        {
          name: 'due_date',
          type: 'datetime-local' as const,
          placeholder: 'Fecha de entrega',
          label: 'Fecha de entrega',
          cssClass: 'task-input',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'cancel-button',
        },
        {
          text: 'Siguiente',
          cssClass: 'submit-button',
          handler: async (data) => {
            if (!data.description) {
              this.presentToast('Por favor ingresa una descripción');
              return false;
            }
            if (!data.due_date) {
              this.presentToast('Por favor selecciona una fecha de entrega');
              return false;
            }

            // Mostrar segundo alert para seleccionar materia
            const subjectAlert = await this.alertController.create({
              header: 'Seleccionar Materia',
              cssClass: 'subject-select-alert',
              message: 'Selecciona la materia para esta tarea:',
              inputs: this.subjects.map((subject, index) => ({
                type: 'radio',
                label: subject.name,
                value: subject._id,
                handler: () => {
                  document.querySelector('.subject-details')?.remove();
                  const details = document.createElement('div');
                  details.className = 'subject-details';
                  details.innerHTML = `
                    <p><strong>Horario:</strong> ${subject.schedule.join(
                      ', '
                    )}</p>
                    <p><strong>Créditos:</strong> ${subject.credits}</p>
                  `;
                  document
                    .querySelector('.alert-message')
                    ?.appendChild(details);
                },
                checked: index === 0,
              })),
              buttons: [
                {
                  text: 'Atrás',
                  role: 'cancel',
                  cssClass: 'cancel-button',
                },
                {
                  text: 'Crear Tarea',
                  cssClass: 'submit-button',
                  handler: (subjectId) => {
                    const userId = this.authService.getCurrentUserId();
                    if (userId && subjectId) {
                      const newTask: CreateTaskDTO = {
                        user_id: userId,
                        subject_id: subjectId,
                        description: data.description,
                        due_date: new Date(data.due_date).toISOString(),
                        completed: false,
                      };

                      this.apiService.createTask(newTask).subscribe(
                        () => {
                          this.loadTasks();
                          this.presentToast('Tarea creada exitosamente');
                        },
                        (error: any) => {
                          console.error('Error al crear la tarea:', error);
                          this.presentToast('Error al crear la tarea');
                        }
                      );
                      return true;
                    }
                    return false;
                  },
                },
              ],
            });

            await alert.dismiss();
            await subjectAlert.present();
            return false;
          },
        },
      ],
    });

    await alert.present();
  }

  // Método auxiliar para mostrar mensajes
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'dark',
      cssClass: 'custom-toast',
    });
    toast.present();
  }
}
