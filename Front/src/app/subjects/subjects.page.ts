import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { AlertController, IonInput, IonModal, ToastController } from '@ionic/angular';
import { ScheduleItem } from '../interfaces/subject.interface';
import { ToastService } from '../services/toast.service';
import { ThemeService } from '../services/theme.service';
import { Observable } from 'rxjs';

// Usamos un nombre diferente para evitar conflicto con la interfaz importada
export interface SubjectModel {
  id?: string;
  name: string;
  credits: number;
  schedule: ScheduleItem[];
  _id?: string; // Mantener compatibilidad con el código existente
  userId?: string; // Añadimos el userId
}

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

  subjects: SubjectModel[] = [];
  subjectForm: FormGroup;
  isModalOpen = false;
  isEditing = false;
  currentSubjectId: string | null = null;
  darkMode = false;

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
    this.subjectForm = this.fb.group({
      name: ['', Validators.required],
      credits: ['', [Validators.required, Validators.min(1)]],
      schedule: this.fb.array([])
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
    if (userId) {
      this.apiService.getUserSubjects(userId).subscribe({
        next: (subjects: SubjectModel[]) => {
          this.subjects = subjects;
          this.isModalOpen = false;
        },
        error: (error: unknown) => {
          console.error('Error cargando materias:', error);
        },
      });
    }
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

    this.subjectForm.patchValue({
      name: subject.name,
      credits: subject.credits,
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

  async saveSubject() {
    if (this.subjectForm.valid) {
      const userId = this.authService.getCurrentUserId();
      
      if (!userId) {
        this.toastService.showToast(
          'Error: No se pudo obtener el ID del usuario',
          'error'
        );
        return;
      }
      
      const subjectData: SubjectModel = {
        name: this.subjectForm.value.name,
        credits: this.subjectForm.value.credits,
        schedule: this.subjectForm.value.schedule || [],
        userId: userId // Corregido a userId para coincidir con la interfaz
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
      message: `¿Estás seguro de que quieres eliminar la materia ${subject.name}?`,
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
                next: () => {
                  this.loadSubjects();
                  this.toastService.showToast(
                    'Materia eliminada con éxito',
                    'success'
                  );
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
      schedule: this.fb.array([])
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
    this.scheduleFormArray.removeAt(index);
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
