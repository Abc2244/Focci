import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-subjects',
  templateUrl: './subjects.page.html',
  styleUrls: ['./subjects.page.scss'],
})
export class SubjectsPage implements OnInit {
  subjects: any[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadSubjects();
  }

  loadSubjects() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.apiService.getUserSubjects(userId).subscribe(
        (subjects) => {
          this.subjects = subjects;
        },
        (error) => {
          console.error('Error al cargar las materias:', error);
        }
      );
    } else {
      console.error('Usuario no autenticado');
    }
  }

  async addSubject() {
    const alert = await this.alertController.create({
      header: 'Nueva Materia',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre de la materia',
        },
        {
          name: 'credits',
          type: 'number',
          placeholder: 'Número de créditos',
          min: 1,
        },
        {
          name: 'schedule',
          type: 'text',
          placeholder: 'Horario (ej: Lunes,Miércoles,Viernes)',
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
            if (data.name && data.credits && data.schedule) {
              const userId = this.authService.getCurrentUserId();
              if (userId) {
                const newSubject = {
                  user_id: userId,
                  name: data.name,
                  credits: parseInt(data.credits),
                  schedule: data.schedule
                    .split(',')
                    .map((day: string) => day.trim()),
                };

                this.apiService.createSubject(newSubject).subscribe(
                  () => {
                    this.loadSubjects();
                  },
                  (error) => {
                    console.error('Error al crear la materia:', error);
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
