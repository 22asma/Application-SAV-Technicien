import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Taches } from './taches/taches';
import { OrdreReparation } from './ordre-reparation/ordre-reparation';
import { datatable } from '../../shared/datatable/datatable';
import { OrtacheRoutingModule } from './oetache-routing-module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@NgModule({
  declarations: [
    Taches,
    OrdreReparation
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    MatTabsModule,
    MatCheckboxModule,
    datatable,
    OrtacheRoutingModule,
    MatProgressSpinnerModule
]
})
export class OrtacheModule { }
