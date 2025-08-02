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
  passwordForm: FormGroup;
  roles: Role[] = [];
  isLoading = false;
  isPasswordLoading = false;
  errorMessage = '';
  passwordErrorMessage = '';
  passwordSuccessMessage = '';
  showPasswordForm = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private roleService: RolesService,
    private dialogRef: MatDialogRef<EditUser>,
    @Inject(MAT_DIALOG_DATA) public data: { user: any }
  ) {
    this.userForm = this.fb.group({
    firstName: [data.user.firstName || data.user.firstname || '', Validators.required],
    lastName: [data.user.lastName || data.user.lastname || '', Validators.required],
    roleId: [data.user.role?.id || '', Validators.required],
    statut: [data.user.statut || 'ACTIVE', Validators.required],
    isTechnician: [data.user.isTechnician || false]
   });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }
  
  ngOnInit(): void {
    this.loadRoles();
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmPassword')?.value 
      ? null : { mismatch: true };
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (this.showPasswordForm) {
      this.passwordForm.reset();
      this.passwordErrorMessage = '';
      this.passwordSuccessMessage = '';
    }
  }

  onChangePassword(): void {
    if (this.passwordForm.valid) {
      this.isPasswordLoading = true;
      this.passwordErrorMessage = '';
      this.passwordSuccessMessage = '';

      const dto = {
        newPassword: this.passwordForm.value.newPassword,
        confirmPassword: this.passwordForm.value.confirmPassword
      };

      this.usersService.changePassword(this.data.user.id, dto).subscribe({
        next: () => {
          this.passwordSuccessMessage = 'Mot de passe changé avec succès';
          this.isPasswordLoading = false;
          setTimeout(() => {
            this.showPasswordForm = false;
            this.passwordForm.reset();
          }, 2000);
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.isPasswordLoading = false;
          this.passwordErrorMessage = error.error?.message || 'Erreur lors du changement de mot de passe';
        }
      });
    }
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
      firstName: this.userForm.value.firstName,
      lastName: this.userForm.value.lastName,
      roleId: this.userForm.value.roleId,
      statut: this.userForm.value.statut,
      isTechnician: this.userForm.value.isTechnician
    };

    this.usersService.editUser(this.data.user.id, userData).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 404) {
          this.errorMessage = 'Utilisateur non trouvé. Veuillez rafraîchir la liste.';
        } else {
          this.errorMessage = error.error?.message || 'Échec de la mise à jour';
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