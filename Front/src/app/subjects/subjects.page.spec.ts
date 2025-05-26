import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubjectsPage } from './subjects.page';
import { TestModule } from '../shared/test.module';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('SubjectsPage', () => {
  let component: SubjectsPage;
  let fixture: ComponentFixture<SubjectsPage>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['getUserSubjects']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);

    // Mock del ID de usuario
    authServiceSpy.getUserId.and.returnValue(Promise.resolve('test-user-id'));
    
    // Mock de las asignaturas
    apiServiceSpy.getUserSubjects.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [SubjectsPage],
      imports: [TestModule],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectsPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load subjects on init', async () => {
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(authServiceSpy.getUserId).toHaveBeenCalled();
    expect(apiServiceSpy.getUserSubjects).toHaveBeenCalledWith('test-user-id');
  });
}); 