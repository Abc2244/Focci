import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatsPage } from './stats.page';
import { TestModule } from '../shared/test.module';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';
import { TaskStats } from '../interfaces/stats.interface';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('StatsPage', () => {
  let component: StatsPage;
  let fixture: ComponentFixture<StatsPage>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['getStats']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);

    // Mock del ID de usuario
    authServiceSpy.getUserId.and.returnValue(Promise.resolve('test-user-id'));
    
    // Mock de las estadísticas
    const mockStats: TaskStats = {
      tasksCreated: 10,
      tasksCompleted: 8,
      completionRate: 80,
      onTimeRate: 75,
      lateRate: 25,
      weeklyActivity: [
        { day: 'monday', percentage: 20 },
        { day: 'tuesday', percentage: 15 }
      ],
      subjectDistribution: [
        { name: 'Math', color: '#FF0000', percentage: 30 },
        { name: 'Science', color: '#00FF00', percentage: 20 }
      ]
    };
    apiServiceSpy.getStats.and.returnValue(of(mockStats));

    await TestBed.configureTestingModule({
      declarations: [StatsPage],
      imports: [TestModule],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(StatsPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load stats on init', async () => {
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(authServiceSpy.getUserId).toHaveBeenCalled();
    expect(apiServiceSpy.getStats).toHaveBeenCalledWith('test-user-id', 'week');
  });
}); 