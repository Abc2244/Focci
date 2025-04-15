import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { AlertController, IonInput, IonModal } from '@ionic/angular';
import { Subject, ScheduleItem } from '../interfaces/subject.interface';
import { ToastService } from '../services/toast.service';
import { ThemeService } from '../services/theme.service';

// Definimos un tipo para los días de la semana
type DayOfWeek =
  | 'Lunes'
  | 'Martes'
  | 'Miércoles'
  | 'Jueves'
  | 'Viernes'
  | 'Sábado'
  | 'Domingo';

@Component({
  selector: 'app-subjects',
  templateUrl: './subjects.page.html',
  styleUrls: ['./subjects.page.scss'],
})
export class SubjectsPage implements OnInit {
  @ViewChild('nameInput') nameInput!: IonInput;
  @ViewChild(IonModal) modal!: IonModal;

  subjects: Subject[] = [];
  showModal = false;
  isEditing = false;
  subjectForm: FormGroup;
  currentSubjectId: string | null = null;
  selectedScheduleItems: ScheduleItem[] = [];

  // Reordenamos los días de la semana para que empiecen en lunes
  availableDays = [
    { short: 'L', value: 'Lunes' },
    { short: 'M', value: 'Martes' },
    { short: 'X', value: 'Miércoles' },
    { short: 'J', value: 'Jueves' },
    { short: 'V', value: 'Viernes' },
    { short: 'S', value: 'Sábado' },
    { short: 'D', value: 'Domingo' },
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastService: ToastService,
    private fb: FormBuilder,
    private themeService: ThemeService
  ) {
    this.subjectForm = this.fb.group({
      name: ['', Validators.required],
      credits: ['', [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit() {
    this.loadSubjects();
  }

  ionViewWillEnter() {
    // Este método se llama cada vez que la página está a punto de ser mostrada
    this.loadSubjects(); // Recargar las materias
  }

  // Método para ordenar los horarios por día de la semana
  sortScheduleByDay(schedule: ScheduleItem[]): ScheduleItem[] {
    const dayOrder: { [key: string]: number } = {
      Lunes: 1,
      Martes: 2,
      Miércoles: 3,
      Jueves: 4,
      Viernes: 5,
      Sábado: 6,
      Domingo: 7,
    };

    return [...schedule].sort((a, b) => {
      return dayOrder[a.day] - dayOrder[b.day];
    });
  }

  loadSubjects() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUserSubjects(userId).subscribe({
        next: (subjects) => {
          this.subjects = subjects;
        },
        error: (error) => {
          this.toastService.showToast('Error al cargar las materias', 'error');
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

  onWillDismiss(event: any) {
    this.showModal = false;
    this.subjectForm.reset();
    this.selectedScheduleItems = [];
  }

  dismissModal() {
    this.showModal = false;
    this.subjectForm.reset();
    this.selectedScheduleItems = [];
  }

  async saveSubject() {
    if (this.subjectForm.valid) {
      const formData = this.subjectForm.value;

      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        this.toastService.showToast('Error: Usuario no identificado', 'error');
        return;
      }

      // Verificar que haya al menos un horario
      if (this.selectedScheduleItems.length === 0) {
        this.toastService.showToast(
          'Debes agregar al menos un horario',
          'warning'
        );
        return;
      }

      const subjectData = {
        user_id: userId,
        name: formData.name,
        credits: parseInt(formData.credits), // Asegurarnos de que sea un número
        schedule: this.selectedScheduleItems,
      };

      try {
        if (this.isEditing && this.currentSubjectId) {
          await this.apiService
            .updateSubject(this.currentSubjectId, subjectData)
            .toPromise();
          this.toastService.showToast(
            'Materia actualizada con éxito',
            'success'
          );
        } else {
          await this.apiService.createSubject(subjectData).toPromise();
          this.toastService.showToast('Materia creada con éxito', 'success');
        }

        this.dismissModal();
        await this.loadSubjects();
      } catch (error) {
        this.toastService.showToast('Error al guardar la materia', 'error');
        console.error('Error:', error);
      }
    } else {
      // Mostrar mensaje si el formulario no es válido
      this.toastService.showToast(
        'Por favor complete todos los campos requeridos',
        'warning'
      );
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
                  this.toastService.showToast(
                    'Materia eliminada con éxito',
                    'success'
                  );
                },
                error: (error) => {
                  this.toastService.showToast(
                    'Error al eliminar la materia',
                    'error'
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

  removeScheduleItem(index: number) {
    this.selectedScheduleItems.splice(index, 1);
  }

  addScheduleItem() {
    this.selectedScheduleItems.push({
      day: this.availableDays[0].value,
      startTime: '08:00',
      endTime: '09:00',
    });
  }

  updateScheduleStartTime(index: number, event: any) {
    if (event && event.detail && event.detail.value) {
      this.selectedScheduleItems[index].startTime = event.detail.value;
    }
  }

  updateScheduleEndTime(index: number, event: any) {
    if (event && event.detail && event.detail.value) {
      this.selectedScheduleItems[index].endTime = event.detail.value;
    }
  }

  updateScheduleDay(index: number, day: string | null | undefined) {
    if (day !== null && day !== undefined) {
      this.selectedScheduleItems[index].day = day;
      // Ordenar los horarios después de cambiar un día
      this.selectedScheduleItems = this.sortScheduleByDay(
        this.selectedScheduleItems
      );
    }
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';

    try {
      // Si ya está en formato HH:mm, retornarlo formateado
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));

        // Usar el formato de 12 horas con AM/PM
        return date
          .toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
          .replace(/\./g, ''); // Eliminar puntos en "a.m." y "p.m."
      }
      return timeString;
    } catch (e) {
      console.error('Error formatting time:', e);
      return timeString;
    }
  }
}
