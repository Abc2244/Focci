import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-reminders',
  templateUrl: './reminders.page.html',
  styleUrls: ['./reminders.page.scss'],
})
export class RemindersPage implements OnInit {
  reminders: any[] = [];
  tasks: any[] = [];
  showModal = false;
  isEditing = false;
  reminderForm: FormGroup;
  currentReminderId: string | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.reminderForm = this.fb.group({
      reminder_date: ['', Validators.required],
      priority: [1, Validators.required],
      task_id: ['', Validators.required],
      status: ['pendiente', Validators.required],
      insistence_level: [0, Validators.required],
    });
  }

  ngOnInit() {
    this.loadReminders();
    this.loadTasks();
  }

  loadReminders(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUpcomingReminders(userId).subscribe(
        (data: any) => {
          this.reminders = data;
        },
        (error: any) => {
          console.error('Error loading reminders:', error);
        }
      );
    } else {
      console.error('User ID not found');
    }
  }

  loadTasks(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getTasks(userId).subscribe(
        (data: any) => {
          this.tasks = data;
        },
        (error: any) => {
          console.error('Error loading tasks:', error);
        }
      );
    } else {
      console.error('User ID not found');
    }
  }

  getTaskName(taskId: string): string {
    const task = this.tasks.find((t) => t._id === taskId);
    return task ? task.name : 'Tarea no encontrada';
  }

  openAddReminderModal() {
    this.isEditing = false;
    this.currentReminderId = null;
    this.reminderForm.reset();
    this.showModal = true;
  }

  saveReminder() {
    if (this.reminderForm.valid) {
      const userId = this.authService.getCurrentUserId();
      if (!userId) return;

      const formData = this.reminderForm.value;
      const reminderData = {
        user_id: userId,
        ...formData,
      };

      if (this.isEditing && this.currentReminderId) {
        this.apiService
          .updateReminder(this.currentReminderId, reminderData)
          .subscribe(
            () => {
              this.dismissModal();
              this.loadReminders();
            },
            (error: any) => {
              console.error('Error updating reminder:', error);
            }
          );
      } else {
        this.apiService.createReminder(reminderData).subscribe(
          () => {
            this.dismissModal();
            this.loadReminders();
          },
          (error: any) => {
            console.error('Error creating reminder:', error);
          }
        );
      }
    }
  }

  dismissModal() {
    this.showModal = false;
    this.reminderForm.reset();
    this.currentReminderId = null;
  }

  editReminder(reminder: any): void {
    this.isEditing = true;
    this.currentReminderId = reminder._id || null;

    this.reminderForm.patchValue({
      reminder_date: reminder.reminder_date,
      priority: reminder.priority,
      task_id: reminder.task_id,
      status: reminder.status,
      insistence_level: reminder.insistence_level,
    });

    this.showModal = true;
  }

  deleteReminder(reminderId: string): void {
    this.apiService.deleteReminder(reminderId).subscribe(
      () => {
        this.loadReminders();
      },
      (error: any) => {
        console.error('Error deleting reminder:', error);
      }
    );
  }
}
