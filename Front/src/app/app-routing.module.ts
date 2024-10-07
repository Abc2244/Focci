import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'task-manager',
    pathMatch: 'full'
  },
  {
    path: 'task-manager',
    loadChildren: () => import('./task-manager/task-manager.module').then( m => m.TaskManagerPageModule)
  }
];


@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
