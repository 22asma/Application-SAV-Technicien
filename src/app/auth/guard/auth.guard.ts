import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

 canActivate(): boolean {
  const token = this.authService.getToken();
  console.log("🛡️ AuthGuard - token détecté :", token); // AJOUTE CECI ICI

  if (token) return true;

  console.warn("⛔ Accès refusé, redirection vers /auth/login");
  this.router.navigate(['/auth/login']);
  return false;
}

}