import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchedulePage } from './schedule.page';
import { TestModule } from '../shared/test.module';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('SchedulePage', () => {
  let component: SchedulePage;
  let fixture: ComponentFixture<SchedulePage>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['getFreeTimeSlots']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);

    // Mock del ID de usuario
    authServiceSpy.getUserId.and.returnValue(Promise.resolve('test-user-id'));
    
    // Mock del horario
    apiServiceSpy.getFreeTimeSlots.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [SchedulePage],
      imports: [TestModule],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulePage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load schedule on init', async () => {
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(authServiceSpy.getUserId).toHaveBeenCalled();
    expect(apiServiceSpy.getFreeTimeSlots).toHaveBeenCalledWith('test-user-id');
  });
}); 