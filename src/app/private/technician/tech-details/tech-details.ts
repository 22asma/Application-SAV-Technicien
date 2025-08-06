import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HistoryService } from '../services/history.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import moment from 'moment';

interface IJournalEntry {
  date: string;
  dateFormatted: string;
  type: string;
  rawType: PointageType; 
  tache?: string;
  heure: string;
}

interface ITechnicien {
  id: string;
  username: string;
  lastName: string;
  firstName: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export enum PointageType {
  ENTREE = 'ENTRY',
  SORTIE = 'EXIT',
  PAUSE = 'BREAK',
  REPRISE = 'RESUME',
  WORKING = 'WORKING',
  PAUSE_TACHE = 'TASK_PAUSED',
  REPRISE_TACHE = 'TASK_RESUME',
  FIN_TACHE = 'END_TASK'
}

@Component({
  selector: 'app-tech-details',
  standalone: false,
  templateUrl: './tech-details.html',
  styleUrls: ['./tech-details.css']
})
export class TechDetails {
  technicien: ITechnicien;
  journalData: IJournalEntry[] = [];
  loading = true;
  errorMessage = '';
  filterForm: FormGroup;
  showFilter = false;

  constructor(
    public dialogRef: MatDialogRef<TechDetails>,
    @Inject(MAT_DIALOG_DATA) public data: { technicien: ITechnicien },
    private historyService: HistoryService,
    private fb: FormBuilder,
    private dateAdapter: DateAdapter<Date>
  ) {
    this.technicien = data.technicien;
    this.dateAdapter.setLocale('fr'); // Set your locale here
    
    // Initialize filter form with default dates (today)
    this.filterForm = this.fb.group({
      startDate: [new Date()],
      endDate: [new Date()]
    });
  }

  ngOnInit(): void {
    this.loadHistory();
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  applyFilter(): void {
    if (this.filterForm.valid) {
      this.loadHistory();
      this.showFilter = false;
    }
  }

  resetFilter(): void {
  const today = new Date();
  this.filterForm.setValue({
    startDate: today,
    endDate: today
  });
  this.loadHistory();
} 

  loadHistory(): void {
    this.loading = true;
    this.errorMessage = '';
    
    const startDate = moment(this.filterForm.value.startDate).format('YYYY-MM-DD');
    const endDate = moment(this.filterForm.value.endDate).format('YYYY-MM-DD');

    this.historyService.getTechnicianHistory(
      this.technicien.id, 
      startDate,
      endDate
    ).subscribe({
      next: (response) => {
        console.log('Données reçues:', response);
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
  return historyItems.map(item => {
    const dateObj = new Date(item.heure);

    let taskDescription = '--';

    const isTaskRelatedType = [
      PointageType.WORKING,
      PointageType.PAUSE_TACHE,
      PointageType.REPRISE_TACHE,
      PointageType.FIN_TACHE
    ].includes(item.type as PointageType);

    if (isTaskRelatedType && !item.task) {
      taskDescription = '[Tâche manquante]'; // Plus explicite
      console.warn(`Type ${item.type} sans tâche à ${item.heure}`);
    }

    if (item.task) {
      taskDescription = item.task.titre || 
                       item.task.details || 
                       (item.task.description ? item.task.description.substring(0, 30) + '...' : '--');
    }

    return {
      date: dateObj.toLocaleString(),
      dateFormatted: dateObj.toLocaleDateString('fr-FR'),
      type: this.getTypeLabel(item.type),
      rawType: item.type as PointageType,
      tache: taskDescription,
      heure: dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
  });
}


  getTypeLabel(type: PointageType): string {
    const typeLabels: Record<PointageType, string> = {
      [PointageType.ENTREE]: 'Arrivée',
      [PointageType.SORTIE]: 'Départ',
      [PointageType.PAUSE]: 'Pause',
      [PointageType.REPRISE]: 'Reprise',
      [PointageType.WORKING]: 'Tâche démarrée',
      [PointageType.PAUSE_TACHE]: 'Tâche en pause',
      [PointageType.REPRISE_TACHE]: 'Tâche en reprise',
      [PointageType.FIN_TACHE]: 'Tâche terminée'
    };
    
    return typeLabels[type] || 'Inconnu';
  }

  getStatusLabel(): string {
    return this.technicien.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
  }

  getStatusClass(): string {
    return this.technicien.status;
  }

  getBadgeClass(type: PointageType): string {
    return type;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  // Dans votre composant TechDetails, ajoutez cette méthode
getHistoryTitle(): string {
  const startDate = this.filterForm.value.startDate;
  const endDate = this.filterForm.value.endDate;
  
  // Vérifie si c'est le filtre par défaut (aujourd'hui)
  const isToday = moment().isSame(startDate, 'day') && moment().isSame(endDate, 'day');
  
  if (isToday) {
    return "Historique du jour";
  } else {
    const startStr = moment(startDate).format('DD/MM/yyyy');
    const endStr = moment(endDate).format('DD/MM/yyyy');
    
    if (startStr === endStr) {
      return `Historique du ${startStr}`;
    } else {
      return `Historique du ${startStr} au ${endStr}`;
    }
  }
}
}