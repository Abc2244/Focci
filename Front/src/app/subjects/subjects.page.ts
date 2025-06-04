import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { AlertController, IonInput, IonModal, ToastController } from '@ionic/angular';
import { Subject, SubjectModel, ScheduleItem } from '../interfaces/subject.interface';
import { ToastService } from '../services/toast.service';
import { ThemeService } from '../services/theme.service';
import { Observable } from 'rxjs';

interface DayOption {
  value: string;
  text: string;
}

// Definimos un tipo para los días de la semana
export type WeekDay =
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
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild('nameInput', { static: false }) nameInput?: IonInput;
  
  presentingElement: HTMLElement | null = null;
  minDate: string; // Fecha mínima permitida

  subjects: SubjectModel[] = [];
  subjectForm: FormGroup;
  isModalOpen = false;
  isEditing = false;
  currentSubjectId: string | null = null;
  darkMode = false;
  isLoading = true;
  hasError = false;

  weekDays = [
    { short: 'L', value: 'Lunes' },
    { short: 'M', value: 'Martes' },
    { short: 'X', value: 'Miércoles' },
    { short: 'J', value: 'Jueves' },
    { short: 'V', value: 'Viernes' },
    { short: 'S', value: 'Sábado' },
    { short: 'D', value: 'Domingo' },
  ];

  // Opciones para los días de la semana
  days: DayOption[] = [
    { value: 'Lunes', text: 'Lunes' },
    { value: 'Martes', text: 'Martes' },
    { value: 'Miércoles', text: 'Miércoles' },
    { value: 'Jueves', text: 'Jueves' },
    { value: 'Viernes', text: 'Viernes' },
    { value: 'Sábado', text: 'Sábado' },
    { value: 'Domingo', text: 'Domingo' },
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastService: ToastService,
    private fb: FormBuilder,
    private themeService: ThemeService,
    private toastController: ToastController
  ) {
    // Establecer la fecha mínima como el día actual
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.subjectForm = this.fb.group({
      name: ['', Validators.required],
      credits: ['', [Validators.required, Validators.min(1)]],
      schedule: this.fb.array([]),
      end_date: ['', [Validators.required, this.dateValidator.bind(this)]]
    });
  }

  ngOnInit() {
    this.loadSubjects();
    this.themeService.isDark$.subscribe((isDark: boolean) => {
      this.darkMode = isDark;
    });
    
    this.presentingElement = document.querySelector('.ion-page');
  }

  loadSubjects() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.isLoading = false;
      this.hasError = false;
      this.subjects = [];
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    this.apiService.getUserSubjects(userId).subscribe({
      next: (subjects: Subject[]) => {
        this.subjects = subjects.map(s => ({
          ...s,
          userId: s.user_id,
          id: s._id
        })) as SubjectModel[];
        this.isLoading = false;
        this.hasError = false;
        this.isModalOpen = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.hasError = false;
        this.subjects = [];
      }
    });
  }

  openAddSubjectModal() {
    this.isEditing = false;
    this.currentSubjectId = null;
    this.resetForm();
    this.isModalOpen = true;
    
    // Verificamos si nameInput existe antes de llamar a setFocus
    setTimeout(() => {
      if (this.nameInput) {
        this.nameInput.setFocus();
      }
    }, 300);
  }

  closeModal() {
    this.isModalOpen = false;
  }

  editSubject(subject: SubjectModel) {
    this.isEditing = true;
    this.currentSubjectId = subject._id || null;

    // Formatear la fecha para el input type="date"
    let formattedDate = '';
    if (subject.end_date) {
      const date = new Date(subject.end_date);
      formattedDate = date.toISOString().split('T')[0];
    }

    this.subjectForm.patchValue({
      name: subject.name,
      credits: subject.credits,
      end_date: formattedDate
    });

    // Limpiar horarios existentes antes de agregar los nuevos
    while (this.scheduleFormArray.length) {
      this.scheduleFormArray.removeAt(0);
    }

    // Agregar cada horario al formulario
    if (subject.schedule && subject.schedule.length > 0) {
      subject.schedule.forEach(scheduleItem => {
        this.addScheduleWithValues(scheduleItem);
      });
    }

    this.isModalOpen = true;
    
    // Verificamos si nameInput existe antes de llamar a setFocus
    setTimeout(() => {
      if (this.nameInput) {
        this.nameInput.setFocus();
      }
    }, 300);
  }

  // Validador personalizado para la fecha
  dateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const selectedDate = new Date(control.value);
    selectedDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { dateInvalid: true };
    }

    return null;
  }

  async saveSubject() {
    // Verificar cada campo y mostrar mensaje específico
    if (!this.subjectForm.get('name')?.valid) {
      this.toastService.showToast('Por favor, ingresa el nombre de la materia', 'warning');
      return;
    }
    
    if (!this.subjectForm.get('credits')?.valid) {
      this.toastService.showToast('Por favor, ingresa un número válido de créditos', 'warning');
      return;
    }
    
    if (!this.subjectForm.get('end_date')?.valid) {
      const endDateControl = this.subjectForm.get('end_date');
      if (endDateControl?.errors?.['dateInvalid']) {
        this.toastService.showToast('La fecha límite no puede ser anterior al día actual', 'warning');
      } else {
        this.toastService.showToast('Por favor, selecciona la fecha límite de la materia', 'warning');
      }
      return;
    }

    if (this.subjectForm.valid) {
      const userId = this.authService.getCurrentUserId();
      
      if (!userId) {
        this.toastService.showToast(
          'Error: No se pudo obtener el ID del usuario',
          'error'
        );
        return;
      }

      // Convertir la fecha string a objeto Date
      const endDate = new Date(this.subjectForm.value.end_date);
      endDate.setHours(23, 59, 59); // Establecer la hora al final del día
      
      const subjectData: Subject = {
        name: this.subjectForm.value.name,
        credits: this.subjectForm.value.credits,
        schedule: this.subjectForm.value.schedule || [],
        user_id: userId,
        end_date: endDate
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
        this.loadSubjects();
        this.subjectForm.reset();
        this.closeModal();
      } catch (error) {
        this.toastService.showToast(
          'Error al guardar la materia. Inténtalo de nuevo.',
          'error'
        );
        console.error('Error saving subject:', error);
      }
    }
  }

  async deleteSubject(subject: SubjectModel) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar la materia ${subject.name}? También se eliminarán todas las tareas y recordatorios asociados.`,
      cssClass: 'custom-alert',
      backdropDismiss: false,
      mode: 'ios',
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
                next: (response: any) => {
                  this.loadSubjects();
                  const tasksDeleted = response.details?.tasks_deleted || 0;
                  const remindersDeleted = response.details?.reminders_deleted || 0;
                  
                  let message = `Materia eliminada con éxito`;
                  if (tasksDeleted > 0 || remindersDeleted > 0) {
                    message += `. Se eliminaron ${tasksDeleted} tareas y ${remindersDeleted} recordatorios asociados.`;
                  }
                  
                  this.toastService.showToast(message, 'success');
                },
                error: (error: unknown) => {
                  this.toastService.showToast(
                    'Error al eliminar la materia',
                    'error'
                  );
                  console.error('Error eliminando materia:', error);
                },
              });
            }
          },
        },
      ],
    });

    await alert.present();
  }

  // Getter para acceder al array de horarios del formulario
  get scheduleFormArray(): FormArray {
    return this.subjectForm.get('schedule') as FormArray;
  }

  // Crear formulario de materias
  createSubjectForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      credits: ['', [Validators.required, Validators.min(1)]],
      schedule: this.fb.array([]),
      end_date: ['', [Validators.required, this.dateValidator.bind(this)]]
    });
  }

  // Añadir un nuevo horario al formulario
  addSchedule() {
    const scheduleItem = this.fb.group({
      day: ['Lunes', Validators.required],
      startTime: ['08:00', Validators.required],
      endTime: ['10:00', Validators.required],
    });
    this.scheduleFormArray.push(scheduleItem);
    
    this.toastService.showToast(
      `Horario ${this.scheduleFormArray.length} agregado`,
      'success'
    );
  }

  // Añadir un horario con valores predefinidos
  addScheduleWithValues(schedule: ScheduleItem) {
    const scheduleGroup = this.fb.group({
      day: [schedule.day, Validators.required],
      startTime: [schedule.startTime, Validators.required],
      endTime: [schedule.endTime, Validators.required]
    });
    
    this.scheduleFormArray.push(scheduleGroup);
  }

  // Eliminar un horario del formulario
  removeSchedule(index: number) {
    if (this.scheduleFormArray.length <= 1) {
      this.toastService.showToast(
        'Debe mantener al menos un horario para la materia',
        'warning'
      );
      return;
    }

    if (index >= 0 && index < this.scheduleFormArray.length) {
      this.scheduleFormArray.removeAt(index);
      this.toastService.showToast(
        `Horario ${index + 1} eliminado correctamente`,
        'success'
      );
    }
  }

  // Resetear formulario
  resetForm() {
    this.subjectForm = this.createSubjectForm();
    // Añadir un horario vacío por defecto
    this.addSchedule();
  }

  // Obtener nombre del día para mostrar
  getDayName(day: string): string {
    return day;
  }

  // Mostrar mensaje toast
  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    
    await toast.present();
  }
}
