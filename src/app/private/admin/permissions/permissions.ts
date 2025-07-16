import { Component, OnInit } from '@angular/core';
import { Permission } from '../types/permission';
import { PermissionsService } from '../services/permissions.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AddPermission } from './add-permission/add-permission';

@Component({
  selector: 'app-permissions',
  standalone: false,
  templateUrl: './permissions.html',
  styleUrl: './permissions.css'
})
export class Permissions implements OnInit {
  permissionList: Permission[] = [];
  showMainPermissionModal = false;
  showSecondaryPermissionModal = false;
  selectedMainPermissionId: string | null = null;

  mainPermissionForm: FormGroup;
  secondaryPermissionForm: FormGroup;

  constructor(
    private permissionService: PermissionsService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.mainPermissionForm = this.fb.group({
      name: ['', Validators.required]
    });

    this.secondaryPermissionForm = this.fb.group({
      name: ['', Validators.required]
    });
  }
  
  
  ngOnInit(): void {
    this.displayPermissions();
  }

  // Dans permissions.component.ts
displayPermissions() {
  this.permissionService.getMainPermissions().subscribe((res) => {
    this.permissionList = res;
    console.log(res);
  });
}

// Modifier la méthode de comptage pour utiliser la nouvelle structure
getSecondaryPermissionsCount(permission: any): number {
  return permission.secondaryPermissions ? permission.secondaryPermissions.length : 0;
}

   openMainPermissionModal() {
    const dialogRef = this.dialog.open(AddPermission, {
      width: '500px',
      data: { isMainPermission: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newPermission = {
          name: result.name,
          mainPermissionId: null
        };

        this.permissionService.addPermission(newPermission).subscribe({
          next: () => this.displayPermissions(),
          error: (err) => console.error('Error adding main permission:', err)
        });
      }
    });
  }

  openSecondaryPermissionModal(mainPermissionId: string | undefined) {
    const dialogRef = this.dialog.open(AddPermission, {
      width: '500px',
      data: { isMainPermission: false, mainPermissionId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newPermission = {
          name: result.name,
          mainPermissionId: result.mainPermissionId
        };

        this.permissionService.addPermission(newPermission).subscribe({
          next: () => this.displayPermissions(),
          error: (err) => console.error('Error adding secondary permission:', err)
        });
      }
    });
  }
}