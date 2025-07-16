// technician-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrdreReparation } from './ordre-reparation/ordre-reparation';

const routes: Routes = [
  { path: 'listeOR', component: OrdreReparation }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrtacheRoutingModule { }
