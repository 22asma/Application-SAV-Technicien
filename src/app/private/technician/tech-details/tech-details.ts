import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HistoryService } from '../services/history.service';

interface IJournalEntry {
  date: string;
  type: string;
  rawType: PointageType; // Add this property to store the original enum value
  tache?: string;
  heure: string;
}

interface ITechnicien {
  id: string;
  nom: string;
  prenom: string;
  username: string;
  status: 'ACTIF' | 'INACTIF';
}

export enum PointageType {
  ENTREE = 'ENTREE',
  SORTIE = 'SORTIE',
  PAUSE = 'PAUSE',
  REPRISE = 'REPRISE',
  WORKING = 'WORKING',
  PAUSE_TACHE = 'PAUSE_TACHE',
  FIN_TACHE = 'FIN_TACHE'
}

@Component({
  selector: 'app-tech-details',
  standalone: false,
  templateUrl: './tech-details.html',
  styleUrl: './tech-details.css'
})
export class TechDetails {
  technicien: ITechnicien;
  journalData: IJournalEntry[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<TechDetails>,
    @Inject(MAT_DIALOG_DATA) public data: { technicien: ITechnicien },
    private historyService: HistoryService
  ) {
    this.technicien = data.technicien;
  }

  ngOnInit(): void {
    this.loadTodayHistory();
  }
  
  loadTodayHistory(): void {
    this.loading = true;
    this.historyService.getTechnicianHistoryToday(this.technicien.id).subscribe({
      next: (response) => {
        this.journalData = this.transformHistoryData(response);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Erreur lors du chargement de l\'historique';
        this.loading = false;
      }
    });
  }

  private transformHistoryData(historyItems: any[]): IJournalEntry[] {
    return historyItems.map(item => ({
      date: new Date(item.heure).toLocaleString(),
      type: this.getTypeLabel(item.type),
      rawType: item.type as PointageType, // Store the original enum value
      tache: item.tache?.titre || item.tache?.description || 'Sans tâche',
      heure: new Date(item.heure).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }));
  }

  getTypeLabel(type: PointageType): string {
    const typeLabels: Record<PointageType, string> = {
      [PointageType.ENTREE]: 'Arrivée',
      [PointageType.SORTIE]: 'Départ',
      [PointageType.PAUSE]: 'Pause',
      [PointageType.REPRISE]: 'Reprise',
      [PointageType.WORKING]: 'Tâche démarrée',
      [PointageType.PAUSE_TACHE]: 'Tâche en pause',
      [PointageType.FIN_TACHE]: 'Tâche terminée'
    };
    
    return typeLabels[type] || 'Inconnu';
  }

  getStatusLabel(): string {
    return this.technicien.status === 'ACTIF' ? 'Actif' : 'Inactif';
  }

  getStatusClass(): string {
    return this.technicien.status.toLowerCase();
  }

  getBadgeClass(type: PointageType): string {
    return type.toLowerCase();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}