import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs/schedule',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./register/register.module').then((m) => m.RegisterPageModule),
  },
  {
    path: 'tabs',
    loadChildren: () =>
      import('./tabs/tabs.module').then((m) => m.TabsPageModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'week',
    loadChildren: () =>
      import('./week/week.module').then((m) => m.WeekPageModule),
  },
  {
    path: 'calendar',
    loadChildren: () =>
      import('./calendar/calendar.module').then((m) => m.CalendarPageModule),
  },
  {
    path: 'stats',
    loadChildren: () =>
      import('./stats/stats.module').then((m) => m.StatsPageModule),
  },
  {
    path: 'smart',
    loadChildren: () =>
      import('./smart/smart.module').then((m) => m.SmartPageModule),
  },
  {
    path: 'reminders',
    loadChildren: () =>
      import('./reminders/reminders.module').then((m) => m.RemindersPageModule),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
