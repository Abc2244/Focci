import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeekPage } from './week.page';
import { TestModule } from '../shared/test.module';

describe('WeekPage', () => {
  let component: WeekPage;
  let fixture: ComponentFixture<WeekPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WeekPage],
      imports: [TestModule]
    }).compileComponents();

    fixture = TestBed.createComponent(WeekPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 