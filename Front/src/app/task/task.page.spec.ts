import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskPage } from './task.page';
import { TestModule } from '../shared/test.module';

describe('TaskPage', () => {
  let component: TaskPage;
  let fixture: ComponentFixture<TaskPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskPage],
      imports: [TestModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
