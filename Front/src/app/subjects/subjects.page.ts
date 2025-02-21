import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { AlertController, ToastController } from '@ionic/angular';
import { Subject } from '../interfaces/subject.interface';

// Definimos un tipo para los días de la semana
type DayOfWeek =
  | 'Domingo'
  | 'Lunes'
  | 'Martes'
  | 'Miércoles'
  | 'Jueves'
  | 'Viernes'
  | 'Sábado';

@Component({
  selector: 'app-subjects',
  templateUrl: './subjects.page.html',
  styleUrls: ['./subjects.page.scss'],
})
export class SubjectsPage implements OnInit {
  subjects: Subject[] = [];
  showModal = false;
  isEditing = false;
  subjectForm: FormGroup;
  currentSubjectId: string | null = null;

  availableDays = [
    { short: 'D', value: 'Domingo' },
    { short: 'L', value: 'Lunes' },
    { short: 'M', value: 'Martes' },
    { short: 'X', value: 'Miércoles' },
    { short: 'J', value: 'Jueves' },
    { short: 'V', value: 'Viernes' },
    { short: 'S', value: 'Sábado' },
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private fb: FormBuilder
  ) {
    this.subjectForm = this.fb.group({
      name: ['', Validators.required],
      credits: ['', [Validators.required, Validators.min(1)]],
      schedule: [[], Validators.required],
    });
  }

  ngOnInit() {
    this.loadSubjects();
  }

  loadSubjects() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUserSubjects(userId).subscribe({
        next: (subjects) => {
          this.subjects = subjects;
        },
        error: (error) => {
          this.presentToast('Error al cargar las materias', 'danger');
          console.error('Error:', error);
        },
      });
    }
  }

  addSubject() {
    this.isEditing = false;
    this.currentSubjectId = null;
    this.subjectForm.reset();
    this.showModal = true;
  }

  editSubject(subject: Subject) {
    this.isEditing = true;

    this.subjectForm.patchValue({
      name: subject.name,
      credits: subject.credits,
      schedule: this.orderDays([...subject.schedule]),
    });
    this.showModal = true;
  }

  dismissModal() {
    this.showModal = false;
    this.subjectForm.reset();
  }

  async saveSubject() {
    if (this.subjectForm.valid) {
      const formData = this.subjectForm.value;
      formData.schedule = this.orderDays(formData.schedule);

      const userId = this.authService.getCurrentUserId();
      if (!userId) return;

      const subjectData = {
        user_id: userId,
        ...formData,
      };

      try {
        if (this.isEditing && this.currentSubjectId) {
          await this.apiService
            .updateSubject(this.currentSubjectId, subjectData)
            .toPromise();
          this.presentToast('Materia actualizada con éxito', 'success');
        } else {
          await this.apiService.createSubject(subjectData).toPromise();
          this.presentToast('Materia creada con éxito', 'success');
        }
        this.dismissModal();
        this.loadSubjects();
      } catch (error) {
        this.presentToast('Error al guardar la materia', 'danger');
        console.error('Error:', error);
      }
    }
  }

  async deleteSubject(subject: Subject) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar la materia "${subject.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            if (subject._id) {
              this.apiService.deleteSubject(subject._id).subscribe({
                next: () => {
                  this.loadSubjects();
                  this.presentToast('Materia eliminada con éxito', 'success');
                },
                error: (error) => {
                  this.presentToast('Error al eliminar la materia', 'danger');
                  console.error('Error:', error);
                },
              });
            }
          },
        },
      ],
    });

    await alert.present();
  }

  private async presentToast(
    message: string,
    color: 'success' | 'danger' | 'warning'
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  isDaySelected(day: string): boolean {
    const schedule = this.subjectForm.get('schedule')?.value || [];
    return schedule.includes(day);
  }

  toggleDay(day: string) {
    const schedule = new Set(this.subjectForm.get('schedule')?.value || []);
    if (schedule.has(day)) {
      schedule.delete(day);
    } else {
      schedule.add(day);
    }
    this.subjectForm.patchValue({ schedule: Array.from(schedule) });
  }

  private orderDays(days: string[]): string[] {
    const orderMap: Record<DayOfWeek, number> = {
      Domingo: 0,
      Lunes: 1,
      Martes: 2,
      Miércoles: 3,
      Jueves: 4,
      Viernes: 5,
      Sábado: 6,
    };

    return days.sort((a, b) => {
      const dayA = a as DayOfWeek;
      const dayB = b as DayOfWeek;
      return orderMap[dayA] - orderMap[dayB];
    });
  }
}
