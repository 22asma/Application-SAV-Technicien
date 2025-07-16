import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { Role } from '../../types/role';
import { Permission } from '../../types/permission';
import { RolesService } from '../../services/roles.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-role',
  standalone: false,
  templateUrl: './edit-role.html',
  styleUrl: './edit-role.css'
})
export class EditRole {
  @Input() role!: Role;
  @Input() allPermissions: Permission[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() roleUpdated = new EventEmitter<Role>();

  editedName: string = '';
  selectedPermissions: string[] = [];
  availablePermissions: Permission[] = [];
  isNewRole: boolean = false;

  // Dans EditRole component
constructor(
  private rolesService: RolesService,
  private dialogRef: MatDialogRef<EditRole>,
  private snackBar: MatSnackBar,
  @Inject(MAT_DIALOG_DATA) public data: {role?: Role, allPermissions: Permission[]}
) {
  this.isNewRole = !data.role;
  this.role = data.role || { 
    id: '', 
    name: '', 
    rolePermissions: [] 
  };
  this.allPermissions = data.allPermissions || []; // Ajout d'une valeur par défaut
}

  ngOnInit(): void {
    this.editedName = this.role.name;
    this.selectedPermissions = this.role.rolePermissions?.map(rp => rp.permission.id) || [];
    this.preparePermissionsList();
  }

  preparePermissionsList(): void {
    this.availablePermissions = this.allPermissions.map(permission => {
      return {
        ...permission,
        isSelected: this.selectedPermissions.includes(permission.id)
      };
    });
  }

  onPermissionChange(permissionId: string, isChecked: boolean, event?: any): void {
    if (event) {
      event.stopPropagation(); // Empêche la propagation pour les sous-permissions
    }
    
    if (isChecked) {
      if (!this.selectedPermissions.includes(permissionId)) {
        this.selectedPermissions.push(permissionId);
      }
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(id => id !== permissionId);
    }
  }

   isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissions.includes(permissionId);
  }

areSomeSubPermissionsSelected(mainPermission: any): boolean {
  if (!mainPermission.secondaryPermissions) return false;
  const someSelected = mainPermission.secondaryPermissions.some((sp: any) => 
    this.selectedPermissions.includes(sp.id)
  );
  const notAllSelected = !this.areAllSubPermissionsSelected(mainPermission);
  return someSelected && notAllSelected;
}

  onSave(): void {
    const roleData = {
      name: this.editedName,
      permissionIds: this.selectedPermissions
    };

    if (this.isNewRole) {
      this.createRole(roleData);
    } else {
      this.updateRole(roleData);
    }
  }

  private createRole(roleData: any): void {
    this.rolesService.addRole(roleData).subscribe({
      next: (newRole) => {
        this.snackBar.open('Rôle créé avec succès', 'Fermer', { duration: 3000 });
        this.dialogRef.close(newRole);
      },
      error: (err) => {
        this.snackBar.open('Erreur lors de la création du rôle', 'Fermer', { duration: 3000 });
        console.error(err);
      }
    });
  }

  private updateRole(updateData: any): void {
    this.rolesService.updateRole(this.role.id, updateData).subscribe({
      next: (updatedRole) => {
        this.snackBar.open('Rôle mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.dialogRef.close(updatedRole);
      },
      error: (err) => {
        this.snackBar.open('Erreur lors de la mise à jour du rôle', 'Fermer', { duration: 3000 });
        console.error(err);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Ajoutez ces méthodes
isMainPermissionDisabled(mainPermission: any): boolean {
  // Désactiver si aucune sous-permission
  return !mainPermission.secondaryPermissions?.length;
}
// Modifiez la méthode togglePermissionGroup
// Ajoutez cette méthode
toggleMainPermission(mainPermission: any, isChecked: boolean): void {
  // Mettre à jour la permission principale
  this.onPermissionChange(mainPermission.id, isChecked);

  // Mettre à jour toutes les sous-permissions
  if (mainPermission.secondaryPermissions?.length) {
    mainPermission.secondaryPermissions.forEach((subPermission: any) => {
      this.onPermissionChange(subPermission.id, isChecked);
    });
  }
}

// Modifiez la méthode areAllSubPermissionsSelected
areAllSubPermissionsSelected(mainPermission: any): boolean {
  if (!mainPermission.secondaryPermissions?.length) return false;
  return mainPermission.secondaryPermissions.every((sp: any) => 
    this.isPermissionSelected(sp.id)
  );
}

// Modifiez isSubPermissionDisabled
isSubPermissionDisabled(mainPermission: any): boolean {
  // Ne pas désactiver si en mode édition avec des permissions déjà sélectionnées
  if (this.selectedPermissions.some(id => 
    mainPermission.secondaryPermissions?.some((sp: any) => sp.id === id)
  )) {
    return false;
  }
  return !this.isPermissionSelected(mainPermission.id);
}
}