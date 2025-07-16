import { Component, OnInit } from '@angular/core';
import { Role } from '../types/role';
import { RolesService } from '../services/roles.service';
import { Permission } from '../types/permission';
import { MatDialog } from '@angular/material/dialog';
import { EditRole } from './edit-role/edit-role';
import { PermissionsService } from '../services/permissions.service';

@Component({
  selector: 'app-roles',
  standalone: false,
  templateUrl: './roles.html',
  styleUrl: './roles.css'
})
export class Roles implements OnInit{
  roleList: Role[] = [];
  allPermissions: Permission[] = [];
  constructor(
    private roleService: RolesService,
    private dialog: MatDialog,
    private permissionService: PermissionsService
  ) {}

  ngOnInit(): void {
    this.displayRoles();
  }

  displayRoles() {
    this.roleService.getAllRole().subscribe({
      next: (res) => {
        this.roleList = res;
        console.log('Roles with permissions:', res);
      },
      error: (err) => {
        console.error('Error fetching roles:', err);
      }
    });
  }
  
  // Fonction pour compter les permissions (optionnel)
  countPermissions(role: Role): number {
    return role.rolePermissions?.length || 0;
  }

 async openEditModal(role: Role): Promise<void> {
  // Attendre le chargement des permissions si nécessaire
  if (!this.allPermissions.length) {
    await this.loadAllPermissions();
  }

  const dialogRef = this.dialog.open(EditRole, {
    width: '650px',
    data: {
      role: {...role}, // Crée une copie du rôle
      allPermissions: [...this.allPermissions] // Crée une copie des permissions
    }
  });

  dialogRef.afterClosed().subscribe(updated => {
    if (updated) {
      this.displayRoles();
    }
  });
}

async openNewRoleModal(): Promise<void> {
  // Chargez les permissions si elles ne sont pas déjà chargées
  if (!this.allPermissions.length) {
    await this.loadAllPermissions();
  }

  const dialogRef = this.dialog.open(EditRole, {
    width: '650px', // Même taille que le modal d'édition
    data: {
      allPermissions: [...this.allPermissions] // Passez une copie des permissions
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.displayRoles(); // Rafraîchir la liste après création
    }
  });
}

// Modifiez loadAllPermissions pour retourner une Promise
loadAllPermissions(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.permissionService.getMainPermissions().subscribe({
        next: (permissions) => {
          this.allPermissions = permissions;
          resolve();
        },
        error: (err) => {
          console.error('Error loading permissions:', err);
          reject(err);
        }
      });
    });
  }
}