import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'subjects',
        loadChildren: () =>
          import('../subjects/subjects.module').then(
            (m) => m.SubjectsPageModule
          ),
      },
      {
        path: 'tasks',
        loadChildren: () =>
          import('../task/task.module').then((m) => m.TaskModule),
      },
      {
        path: 'reminders',
        loadChildren: () =>
          import('../reminders/reminders.module').then(
            (m) => m.RemindersPageModule
          ),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('../profile/profile.module').then((m) => m.ProfilePageModule),
      },
      {
        path: '',
        redirectTo: '/tabs/subjects',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
