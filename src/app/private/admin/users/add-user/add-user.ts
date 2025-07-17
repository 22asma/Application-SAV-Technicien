import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UsersService } from '../../services/user.service';
import { RolesService } from '../../services/roles.service';
import { Role } from '../../types/role';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.html',
  styleUrls: ['./add-user.css'],
  standalone: false
})
export class AddUser implements OnInit {
  userForm: FormGroup;
  roles: Role[] = [];
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private roleService: RolesService,
    private dialogRef: MatDialogRef<AddUser>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userForm = this.fb.group({
     nom: ['', [Validators.required, Validators.minLength(2)]],
     prenom: ['', [Validators.required, Validators.minLength(2)]],
     username: ['', [Validators.required, Validators.minLength(3)]],
     roleId: ['', Validators.required],
     badgeId: [''],
     password: ['', [
      Validators.required, 
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
   ]]
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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
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
    if (field.errors['pattern'] && fieldName === 'password') {
      return 'Le mot de passe doit contenir au moins :\n- Une majuscule\n- Une minuscule\n- Un chiffre';
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
      
      this.usersService.addUser(this.userForm.value).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.dialogRef.close(response);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Erreur lors de la création de l\'utilisateur';
          console.error('Erreur:', error);
        }
      });
    } else {
      this.userForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}