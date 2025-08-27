import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Technicien } from './technicien/technicien';
import { TechDetails } from './tech-details/tech-details';
import { datatable } from '../../shared/datatable/datatable';
import { TechnicianRoutingModule } from './technician-routing-module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { HasPermissionDirective } from '../../auth/directives/has-permission.directive';
import { PresenceTech } from './presence-tech/presence-tech';

@NgModule({
  declarations: [
    Technicien,
    TechDetails,
    PresenceTech,
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
    TechnicianRoutingModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatMomentDateModule,
    HasPermissionDirective
  ]
})
export class TechnicianModule { }
