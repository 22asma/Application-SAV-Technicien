import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  showPassword = false;
  returnUrl: string;
  isLoading = false;
  errorMessage = '';
  showErrorDialog = false;
  dialogMessage = '';
  formSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/technician/technicien';
  }

  onSubmit() {
    this.formSubmitted = true;
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const { username, password, rememberMe } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: () => {
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', username);
        }
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
       this.isLoading = false;
       this.showLoginError(err.message || 'Nom d\'utilisateur ou mot de passe incorrect');
       console.log('Error occurred:', err); // Pour débogage
      }
    });
  }

showLoginError(message: string) {
  this.dialogMessage = message;
  this.showErrorDialog = true;
  console.log('Dialog should show now'); // Pour débogage
}

  closeErrorDialog() {
    this.showErrorDialog = false;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  getUsernameErrorMessage() {
    if (this.username?.hasError('required')) {
      return this.formSubmitted ? 'Username is required' : '';
    }
    return this.username?.hasError('username') ? 'Please enter a valid username' : '';
  }

  getPasswordErrorMessage() {
    if (this.password?.hasError('required')) {
      return 'Password is required';
    }
    return '';
  }

}