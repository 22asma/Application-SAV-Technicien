import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Users } from './users/users';
import { Roles } from './roles/roles';
import { Permissions } from './permissions/permissions';
import { Administration } from './administration/administration';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { datatable } from '../../shared/datatable/datatable';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminRoutingModule } from './admin-routing-module';
import { AddUser } from './users/add-user/add-user';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EditUser } from './users/edit-user/edit-user';
import { AddPermission } from './permissions/add-permission/add-permission';
import { EditRole } from './roles/edit-role/edit-role';
import { Profil } from './users/profil/profil';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
@NgModule({
  declarations: [
    Users,
    Roles,
    Permissions,
    Administration,
    AddUser,
    EditUser,
    AddPermission,
    EditRole,
    Profil
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    MatTabsModule,
    MatCheckboxModule, 
    MatSnackBarModule,
    datatable,
    AdminRoutingModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
  ]
})
export class AdminModule { }
