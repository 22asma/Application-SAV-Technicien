import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Role } from '../../types/role';
import { UsersService } from '../../services/user.service';
import { RolesService } from '../../services/roles.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-edit-user',
  standalone: false,
  templateUrl: './edit-user.html',
  styleUrl: './edit-user.css'
})
export class EditUser implements OnInit {
  userForm: FormGroup;
  roles: Role[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private roleService: RolesService,
    private dialogRef: MatDialogRef<EditUser>,
    @Inject(MAT_DIALOG_DATA) public data: { user: any }
  ) {
    this.userForm = this.fb.group({
      username: [data.user.username, Validators.required],
      roleId: [data.user.role?.id || '', Validators.required],
      statut: [data.user.statut === 'Actif'] // Initialise avec true si Actif, false sinon
    });
  }
  
   ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getAllRole().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rôles:', error);
        this.errorMessage = 'Erreur lors du chargement des rôles';
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Ce champ est requis';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Minimum ${requiredLength} caractères requis`;
      }
    }
    
    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.invalid && (field.touched || field.dirty));
  }

 onSubmit(): void {
  if (this.userForm.valid) {
    this.isLoading = true;
    this.errorMessage = '';
    
    const userData = {
      username: this.userForm.value.username,
      roleId: this.userForm.value.roleId  // Notez que c'est roleId directement, pas un objet role
    };

    console.log('Sending PATCH with:', userData);

    this.usersService.editUser(this.data.user.id, userData).subscribe({
      next: (response) => {
        console.log('Update successful:', response);
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Update failed:', error);
        this.errorMessage = error.error?.message || 'Échec de la mise à jour';
        if (error.status === 404) {
          this.errorMessage = 'Utilisateur introuvable';
        }
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
   onCancel(): void {
    this.dialogRef.close();
  }

}
