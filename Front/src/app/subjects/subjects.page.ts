import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { AlertController, ToastController } from '@ionic/angular';
import { Subject, ScheduleItem } from '../interfaces/subject.interface';

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
  selectedScheduleItems: ScheduleItem[] = [];

  availableDays = [
    { short: 'D', value: 'Domingo' },
    { short: 'L', value: 'Lunes' },
    { short: 'M', value: 'Martes' },
    { short: 'X', value: 'Miércoles' },
    { short: 'J', value: 'Jueves' },
    { short: 'V', value: 'Viernes' },
    { short: 'S', value: 'Sábado' },
  ];

  // Lista de horas predefinidas para evitar errores de formato
  availableTimes = [
    '7:00 AM',
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
    '6:00 PM',
    '7:00 PM',
    '8:00 PM',
    '9:00 PM',
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
    this.selectedScheduleItems = [];
    this.showModal = true;
  }

  editSubject(subject: Subject) {
    this.isEditing = true;
    this.currentSubjectId = subject._id || null;

    this.subjectForm.patchValue({
      name: subject.name,
      credits: subject.credits,
    });

    this.selectedScheduleItems = [...subject.schedule];
    this.showModal = true;
  }

  dismissModal() {
    this.showModal = false;
    this.subjectForm.reset();
  }

  async saveSubject() {
    if (this.subjectForm.valid) {
      const formData = this.subjectForm.value;

      const userId = this.authService.getCurrentUserId();
      if (!userId) return;

      const subjectData = {
        user_id: userId,
        name: formData.name,
        credits: formData.credits,
        schedule: this.selectedScheduleItems,
      };

      try {
        if (this.isEditing && this.currentSubjectId) {
          await this.apiService
            .updateSubject(this.currentSubjectId, subjectData)
            .toPromise();
          this.presentToast('✓ Materia actualizada con éxito', 'success');
        } else {
          await this.apiService.createSubject(subjectData).toPromise();
          this.presentToast('✓ Materia creada con éxito', 'success');
        }

        this.dismissModal();
        await this.loadSubjects();
      } catch (error) {
        this.presentToast('❌ Error al guardar la materia', 'danger');
        console.error('Error:', error);
      }
    }
  }

  async deleteSubject(subject: Subject) {
    const alert = await this.alertController.create({
      header: '¿Eliminar materia?',
      message: `¿Estás seguro de que deseas eliminar la materia "${subject.name}"?`,
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'cancel-button',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          cssClass: 'delete-button',
          handler: () => {
            if (subject._id) {
              this.apiService.deleteSubject(subject._id).subscribe({
                next: () => {
                  this.loadSubjects();
                  this.presentToast(
                    '✨ Materia eliminada con éxito',
                    'success'
                  );
                },
                error: (error) => {
                  this.presentToast(
                    '❌ Error al eliminar la materia',
                    'danger'
                  );
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
      message: message.replace('✨', '✓'),
      duration: 2500,
      position: 'middle',
      cssClass: 'large-toast',
    });
    await toast.present();
  }

  addScheduleItem() {
    // Inicializar con valores predeterminados
    this.selectedScheduleItems.push({
      day: this.availableDays[1].value, // Lunes por defecto
      time: this.availableTimes[1], // 8:00 AM por defecto
    });
  }

  removeScheduleItem(index: number) {
    this.selectedScheduleItems.splice(index, 1);
  }

  updateScheduleTime(index: number, time: string | null | undefined) {
    if (time !== null && time !== undefined) {
      this.selectedScheduleItems[index].time = time;
    }
  }

  updateScheduleDay(index: number, day: string | null | undefined) {
    if (day !== null && day !== undefined) {
      this.selectedScheduleItems[index].day = day;
    }
  }
}
