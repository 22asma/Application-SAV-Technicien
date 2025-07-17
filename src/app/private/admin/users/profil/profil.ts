import { Component, OnInit } from '@angular/core';
import { User } from '../../types/user';
import { AuthService } from '../../../../auth/services/auth.service';
import { UsersService } from '../../services/user.service';

@Component({
  selector: 'app-profil',
  standalone: false,
  templateUrl: './profil.html',
  styleUrl: './profil.css'
})
export class Profil implements OnInit{
  userProfile: User | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

 loadUserProfile(): void {
  this.isLoading = true;
  const currentUser = this.authService.getCurrentUser();
  
  if (!currentUser || !currentUser.id) {
    this.errorMessage = 'Utilisateur non connecté';
    this.isLoading = false;
    return;
  }

  this.usersService.getUserById(currentUser.id).subscribe({
    next: (user) => {
      // Normalisation du rôle
      if (user.role && typeof user.role === 'object') {
        user.roleName = user.role.name; // Correction ici - utiliser user.role.name
        console.log("role", user.roleName); // Affichera "Admin"
      }
      
      this.userProfile = user;
      console.log('Profil final normalisé:', this.userProfile);
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Erreur:', err);
      this.errorMessage = 'Échec du chargement';
      this.isLoading = false;
    }
  });
}
}