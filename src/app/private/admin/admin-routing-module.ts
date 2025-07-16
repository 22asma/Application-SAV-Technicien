// technician-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Users } from './users/users';
import { Administration } from './administration/administration';
import { Roles } from './roles/roles';
import { Permissions } from './permissions/permissions';

const routes: Routes = [
  { path: 'users', component: Users },
  { path: 'administration', component: Administration },
  { path: 'roles', component: Roles },
  { path: 'permissions', component: Permissions }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
