import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RemindersPage } from './reminders.page';
import { TestModule } from '../shared/test.module';

describe('RemindersPage', () => {
  let component: RemindersPage;
  let fixture: ComponentFixture<RemindersPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RemindersPage],
      imports: [TestModule]
    }).compileComponents();

    fixture = TestBed.createComponent(RemindersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
