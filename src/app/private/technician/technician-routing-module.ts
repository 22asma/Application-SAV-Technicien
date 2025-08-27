// technician-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Technicien } from './technicien/technicien';
import { PresenceTech } from './presence-tech/presence-tech';

const routes: Routes = [
  { path: 'technicien', component: Technicien },
  { path: 'presenceTech', component: PresenceTech }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TechnicianRoutingModule { }
