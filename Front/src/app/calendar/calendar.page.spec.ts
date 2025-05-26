import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarPage } from './calendar.page';
import { TestModule } from '../shared/test.module';

describe('CalendarPage', () => {
  let component: CalendarPage;
  let fixture: ComponentFixture<CalendarPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalendarPage],
      imports: [TestModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 