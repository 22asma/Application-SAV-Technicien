import { Component, OnInit } from '@angular/core';
import { HistoryService } from '../services/history.service';

interface TechnicianActivity {
  technicien: {
    id: string;
    firstName: string;
    lastName: string;
    badgeId: string;
  };
  historiques: Array<{
    id: string;
    type: string;
    heure: string;
    task?: {
      id: string;
      titre: string;
      status: string;
      ordreReparation?: {
        id: string;
        numOr: string;
      };
    };
  }>;
}

interface ProcessedTechnician {
  id: string;
  firstName: string;
  lastName: string;
  badgeId: string;
  entree?: string;
  sortie?: string;
  pauses: Array<{ debut: string; fin?: string }>;
  tachesCommencees: Array<{
    id: string;
    titre: string;
    heure: string;
    ordreReparation?: string;
  }>;
  tachesTerminees: Array<{
    id: string;
    titre: string;
    heure: string;
    ordreReparation?: string;
  }>;
  tempsTotal: string;
  statut: 'Présent' | 'En pause' | 'Sorti' | 'Non pointé';
}

@Component({
  selector: 'app-presence-tech',
  standalone: false,
  templateUrl: './presence-tech.html',
  styleUrl: './presence-tech.css'
})
export class PresenceTech implements OnInit {
  techniciens: ProcessedTechnician[] = [];
  loading = true;
  errorMessage = '';
  selectedDate: string;
  totalPresents = 0;
  totalEnPause = 0;
  totalSortis = 0;
  searchTerm: string = '';
  expandedTechIds: Set<string> = new Set();

  constructor(private historyService: HistoryService) {
    // Initialiser avec la date d'aujourd'hui
    this.selectedDate = new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadDailyAttendance();
  }

  loadDailyAttendance(): void {
  this.loading = true;
  this.errorMessage = '';

  this.historyService.loadDailyAttendance(this.selectedDate, this.selectedDate)
    .subscribe({
      next: (response) => {
        this.techniciens = this.processActivityData(response);
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.errorMessage = 'Erreur lors du chargement des données';
        this.loading = false;
      }
    });
}

  private processActivityData(data: TechnicianActivity[]): ProcessedTechnician[] {
    return data.map(item => {
      const historiques = item.historiques || [];
      const processed: ProcessedTechnician = {
        id: item.technicien.id,
        firstName: item.technicien.firstName,
        lastName: item.technicien.lastName,
        badgeId: item.technicien.badgeId,
        pauses: [],
        tachesCommencees: [],
        tachesTerminees: [],
        tempsTotal: '0h 0m',
        statut: 'Non pointé'
      };

      // Trier les historiques par heure
      const sortedHistoriques = historiques.sort((a, b) => 
        new Date(a.heure).getTime() - new Date(b.heure).getTime()
      );

      let currentPause: { debut: string; fin?: string } | null = null;
      let entryTime: Date | null = null;
      let totalMinutes = 0;

      sortedHistoriques.forEach(hist => {
        const heure = new Date(hist.heure);
        const heureStr = heure.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        switch (hist.type) {
          case 'ENTRY':
            processed.entree = heureStr;
            processed.statut = 'Présent';
            entryTime = heure;
            break;

          case 'EXIT':
            processed.sortie = heureStr;
            processed.statut = 'Sorti';
            if (entryTime) {
              totalMinutes += (heure.getTime() - entryTime.getTime()) / (1000 * 60);
            }
            break;

          case 'BREAK':
            currentPause = { debut: heureStr };
            processed.pauses.push(currentPause);
            processed.statut = 'En pause';
            if (entryTime) {
              totalMinutes += (heure.getTime() - entryTime.getTime()) / (1000 * 60);
            }
            break;

          case 'RESUME':
            if (currentPause) {
              currentPause.fin = heureStr;
            }
            processed.statut = 'Présent';
            entryTime = heure;
            break;

          case 'WORKING':
          case 'TASK_RESTART':
            if (hist.task) {
              processed.tachesCommencees.push({
                id: hist.task.id,
                titre: hist.task.titre,
                heure: heureStr,
                ordreReparation: hist.task.ordreReparation?.numOr
              });
            }
            break;

          case 'END_TASK':
            if (hist.task) {
              processed.tachesTerminees.push({
                id: hist.task.id,
                titre: hist.task.titre,
                heure: heureStr,
                ordreReparation: hist.task.ordreReparation?.numOr
              });
            }
            break;
        }
      });

      // Calculer le temps total si le technicien est encore présent
     if (processed.statut === 'Présent' && entryTime) {
        totalMinutes += (new Date().getTime() - (entryTime as Date).getTime()) / (1000 * 60);
      }

      // Formater le temps total
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.floor(totalMinutes % 60);
      processed.tempsTotal = `${hours}h ${minutes}m`;

      return processed;
    }).filter(tech => tech.entree); // Ne garder que les techniciens qui ont pointé
  }

  private calculateStats(): void {
    this.totalPresents = this.techniciens.filter(t => t.statut === 'Présent').length;
    this.totalEnPause = this.techniciens.filter(t => t.statut === 'En pause').length;
    this.totalSortis = this.techniciens.filter(t => t.statut === 'Sorti').length;
  }

  onDateChange(): void {
    this.loadDailyAttendance();
  }

  refresh(): void {
    this.loadDailyAttendance();
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'Présent': return 'status-present';
      case 'En pause': return 'status-pause';
      case 'Sorti': return 'status-sorti';
      default: return 'status-absent';
    }
  }

  formatPauses(pauses: Array<{ debut: string; fin?: string }>): string {
    if (pauses.length === 0) return 'Aucune pause';
    
    return pauses.map(pause => 
      pause.fin ? `${pause.debut} - ${pause.fin}` : `${pause.debut} - En cours`
    ).join(', ');
  }

  get filteredTechnicians() {
  return this.techniciens.filter(tech =>
    tech.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
    tech.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
    tech.badgeId.toLowerCase().includes(this.searchTerm.toLowerCase())
  );
}

toggleDetails(techId: string): void {
  if (this.expandedTechIds.has(techId)) {
    this.expandedTechIds.delete(techId);
  } else {
    this.expandedTechIds.add(techId);
  }
}
}
