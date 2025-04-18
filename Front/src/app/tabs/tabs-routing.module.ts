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
        path: 'week',
        loadChildren: () =>
          import('../week/week.module').then((m) => m.WeekPageModule),
      },
      {
        path: 'calendar',
        loadChildren: () =>
          import('../calendar/calendar.module').then(
            (m) => m.CalendarPageModule
          ),
      },
      {
        path: 'stats',
        loadChildren: () =>
          import('../stats/stats.module').then((m) => m.StatsPageModule),
      },
      {
        path: 'smart',
        loadChildren: () =>
          import('../smart/smart.module').then((m) => m.SmartPageModule),
      },
      {
        path: 'schedule',
        loadChildren: () =>
          import('../schedule/schedule.module').then(
            (m) => m.SchedulePageModule
          ),
      },
      {
        path: '',
        redirectTo: '/tabs/schedule',
        pathMatch: 'full',
      },
    ],
  },
  {
    // Ruta comodín para redirigir a la página principal
    path: '**',
    redirectTo: '/tabs/schedule',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
