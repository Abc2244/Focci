import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskManagerPage } from './task-manager.page';

describe('TaskManagerPage', () => {
  let component: TaskManagerPage;
  let fixture: ComponentFixture<TaskManagerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskManagerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
