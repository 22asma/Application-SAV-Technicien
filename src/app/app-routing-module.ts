import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/guard/auth.guard';
import { NotFound } from './auth/components/not-found/not-found';
import { Dashboard } from './private/dashboard/dashboard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule)
  },
  { path: 'dashboard', component: Dashboard },
  {
    path: 'technician',
    loadChildren: () => import('./private/technician/technician-module').then(m => m.TechnicianModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'ortache',
    loadChildren: () => import('./private/ortache/ortache-module').then(m => m.OrtacheModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'config',
    loadChildren: () => import('./private/config/config-module').then(m => m.ConfigModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'admin',
    loadChildren: () => import('./private/admin/admin-module').then(m => m.AdminModule),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    component: NotFound,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }