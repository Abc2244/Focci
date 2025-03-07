import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { AlertController, AlertInput, ToastController } from '@ionic/angular';
import { Task, CreateTaskDTO } from '../interfaces/task.interface';
import { Subject } from '../interfaces/subject.interface';

@Component({
  selector: 'app-task',
  templateUrl: './task.page.html',
  styleUrls: ['./task.page.scss'],
})
export class TaskPage implements OnInit {
  tasks: Task[] = [];
  subjects: Subject[] = [];
  subjectMap: Map<string, string> = new Map();
  showModal = false;
  isEditing = false;
  taskForm: FormGroup;
  currentTaskId: string | null = null;
  minDate: string;

  get incompleteTasks() {
    return this.tasks.filter((task) => !task.completed);
  }

  get completedTasks() {
    return this.tasks.filter((task) => task.completed);
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private fb: FormBuilder
  ) {
    this.taskForm = this.fb.group({
      description: ['', Validators.required],
      due_date: ['', Validators.required],
      subject_id: ['', Validators.required],
    });

    this.minDate = new Date().toISOString();
  }

  ngOnInit() {
    this.loadSubjects();
    this.loadTasks();
  }

  loadSubjects() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUserSubjects(userId).subscribe(
        (subjects) => {
          this.subjects = subjects as Subject[];
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
    this.isEditing = false;
    this.currentTaskId = null;
    this.taskForm.reset();
    this.showModal = true;
  }

  async saveTask() {
    if (this.taskForm.valid) {
      const userId = this.authService.getCurrentUserId();
      if (!userId) return;

      const formData = this.taskForm.value;
      const taskData: CreateTaskDTO = {
        user_id: userId,
        ...formData,
        completed: false,
      };

      try {
        if (this.isEditing && this.currentTaskId) {
          await this.apiService
            .updateTask(this.currentTaskId, taskData)
            .toPromise();
          this.presentToast('✓ Tarea actualizada con éxito', 'success');
        } else {
          await this.apiService.createTask(taskData).toPromise();
          this.presentToast('✓ Tarea creada con éxito', 'success');
        }

        this.dismissModal();
        await this.loadTasks();
      } catch (error) {
        this.presentToast('❌ Error al guardar la tarea', 'danger');
        console.error('Error:', error);
      }
    }
  }

  // Método auxiliar para mostrar mensajes
  async presentToast(message: string, color: string = 'warning') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color,
      cssClass: 'custom-toast',
    });
    toast.present();
  }

  dismissModal() {
    this.showModal = false;
    this.taskForm.reset();
    this.currentTaskId = null;
  }

  editTask(task: Task) {
    this.isEditing = true;
    this.currentTaskId = task._id || null;

    this.taskForm.patchValue({
      description: task.description,
      due_date: task.due_date,
      subject_id: task.subject_id,
    });

    this.showModal = true;
  }
}
