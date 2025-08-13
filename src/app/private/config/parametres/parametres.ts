import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Configuration, ConfigurationService, UpdateConfigurationDto } from '../services/config.service';

@Component({
  selector: 'app-parametres',
  standalone: false,
  templateUrl: './parametres.html',
  styleUrl: './parametres.css'
})
export class Parametres implements OnInit {
  // Configuration dynamique depuis le backend
  configuration: Configuration | null = null;
  isLoading = false;
  
  // Paramètres statiques (restent dans le front-end)
  parametresStatiques = {
    autoriserPauseSurTacheActive: true,
    inclurePauseDansTempsTache: false,
    scanBadgeObligatoire: true,
    heureDebutJournee: '08:00',
    heureFinJournee: '17:00',
    dureePauseParDefaut: 60,
    dureeMaxInactivite: 90
  };

  constructor(
    private configService: ConfigurationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.chargerParametresStatiques();
    this.chargerConfiguration();
  }

  chargerConfiguration() {
    this.isLoading = true;
    this.configService.getConfiguration().subscribe({
      next: (config) => {
        this.configuration = config;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la configuration:', error);
        this.snackBar.open('Erreur lors du chargement de la configuration', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  enregistrerParametres() {
    if (!this.configuration) {
      this.snackBar.open('Configuration non chargée', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading = true;

    // Préparer les données à envoyer (seulement les paramètres du backend)
    const updateDto: UpdateConfigurationDto = {
      parallelTasksPerTechnician: this.configuration.parallelTasksPerTechnician,
      multiTechniciansPerTask: this.configuration.multiTechniciansPerTask,
      onlyCreatorEndTask: this.configuration.onlyCreatorEndTask
    };

    this.configService.updateConfiguration(this.configuration.id, updateDto).subscribe({
      next: (updatedConfig) => {
        this.configuration = updatedConfig;
        this.isLoading = false;
        this.snackBar.open('Configuration sauvegardée avec succès', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // Sauvegarder les paramètres statiques localement
        this.sauvegarderParametresStatiques();
        console.log('Paramètres statiques sauvegardés localement:', this.parametresStatiques);
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde:', error);
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  // Méthode utilitaire pour charger les paramètres statiques depuis localStorage
  chargerParametresStatiques() {
    const savedParams = localStorage.getItem('parametresStatiques');
    if (savedParams) {
      this.parametresStatiques = { ...this.parametresStatiques, ...JSON.parse(savedParams) };
    }
  }

  // Méthode pour sauvegarder les paramètres statiques
  sauvegarderParametresStatiques() {
    localStorage.setItem('parametresStatiques', JSON.stringify(this.parametresStatiques));
  }

  // Méthode appelée lors du changement d'un paramètre dynamique
  onConfigurationChange(property: keyof Configuration, value: any) {
    if (this.configuration) {
      (this.configuration as any)[property] = value;
    }
  }
}