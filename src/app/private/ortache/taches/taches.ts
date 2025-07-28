// taches.component.ts
import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TachesService } from '../services/tache.service';
import { Tache } from '../types/tache';
import { ORinterface } from '../types/ORinterface';

// Interface pour les tâches
export interface ITache {
  id: string;
  nom: string;
  statut: 'En cours' | 'Terminée' | 'En attente';
  technicien: string;
  dureeEstimee: number; // en heures
  description: string;
}

@Component({
  selector: 'app-taches',
  standalone: false,
  templateUrl: './taches.html',
  styleUrl: './taches.css'
})
export class Taches implements OnInit {
  ordreInfo: ORinterface | null = null;
  taches: Tache[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<Taches>,
    @Inject(MAT_DIALOG_DATA) public data: { ordreInfo: ORinterface },
    private tachesService: TachesService
  ) {}

  ngOnInit(): void {
    if (!this.data?.ordreInfo?.id) {
      this.errorMessage = 'Aucun OR sélectionné ou ID manquant';
      console.error(this.errorMessage);
      this.dialogRef.close();
      return;
    }
    
    this.ordreInfo = {
      ...this.data.ordreInfo,
      // Assurez-vous que toutes les propriétés nécessaires sont là
      id: this.data.ordreInfo.id,
      numeroOR: this.data.ordreInfo.numeroOR || 0,
      vehicule: this.data.ordreInfo.vehicule || 'Inconnu',
      client: this.data.ordreInfo.client || 'Inconnu'
    };
    
    this.loadTaches();
  }

  loadTaches(): void {
    if (!this.ordreInfo?.id) {
      console.error('Aucun OR sélectionné');
      return;
    }
    
    this.tachesService.getTachesByORId(this.ordreInfo.id)
      .subscribe({
        next: (taches) => {
          this.taches = taches;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur chargement tâches:', err);
          this.errorMessage = 'Erreur lors du chargement des tâches';
          this.loading = false;
        }
      });
  }

getPourcentageAvancement(): number {
  if (!this.taches || this.taches.length === 0) return 0;
  
  const statutsTermines = ['COMPLETED', 'COMPLETED']; // Peut être adapté selon vos besoins
  const tachesTerminees = this.taches.filter(tache => 
    statutsTermines.includes(tache.statut)
  ).length;
  
  return Math.round((tachesTerminees / this.taches.length) * 100);
}

  onFermerModal(): void {
    this.dialogRef.close();
  }

  getStatutClass(statut: string): string {
   if (!statut) return 'unknown';
   return statut.toLowerCase().replace(/_/g, '-');
}

getStatutIcon(statut: string): string {
  // Adaptez les icônes aux statuts du backend
  switch (statut) {
    case 'IN_PROGRESS': return '⚡';
    case 'COMPLETED': return '✅';
    case 'PAUSED': return '⏸️';
    case 'NOT_STARTED': return '❓';
    default: return '❓';
  }
}

getNombreTachesParStatut(statut: string): number {
  return this.taches.filter(tache => tache.statut === statut).length;
}

getTechniciensNames(techniciens: any[]): string {
    return techniciens.map(t => `${t.lastName} ${t.firstName}`).join(', ');
  }
}