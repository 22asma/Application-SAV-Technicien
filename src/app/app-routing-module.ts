import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/guard/auth.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule)
  },
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
    path: 'admin',
    loadChildren: () => import('./private/admin/admin-module').then(m => m.AdminModule),
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: 'technician/technicien' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }