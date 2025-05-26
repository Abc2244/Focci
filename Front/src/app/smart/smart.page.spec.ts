import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartPage } from './smart.page';
import { TestModule } from '../shared/test.module';
import { ApiService } from '../api.service';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

describe('SmartPage', () => {
  let component: SmartPage;
  let fixture: ComponentFixture<SmartPage>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['getSmartRecommendations']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);

    // Mock del ID de usuario
    authServiceSpy.getUserId.and.returnValue(Promise.resolve('test-user-id'));
    
    // Mock de las recomendaciones
    apiServiceSpy.getSmartRecommendations.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [SmartPage],
      imports: [TestModule],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SmartPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load recommendations on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(authServiceSpy.getUserId).toHaveBeenCalled();
    expect(apiServiceSpy.getSmartRecommendations).toHaveBeenCalledWith('test-user-id');
  });
}); 