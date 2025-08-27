import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TachesService } from '../services/tache.service';
import { Tache } from '../types/tache';
import { ORinterface } from '../types/ORinterface';
import moment from 'moment';
import { HistoryService } from '../../technician/services/history.service';

// Interface pour les tâches
export interface ITache {
  id: string;
  nom: string;
  statut: 'En cours' | 'Terminée' | 'En attente';
  technicien: string;
  dureeEstimee: number; // en heures
  description: string;
}

// Interface pour l'historique des tâches améliorée
interface ITaskHistoryEntry {
  date: string;
  dateFormatted: string;
  timeFormatted: string;
  dateObject: Date;
  type: string;
  rawType: PointageType;
  tacheId: string;
  tacheNom: string;
  heure: string;
  technicienNom: string;
  duration?: number; // durée en minutes si applicable
  isNewDay?: boolean; // pour marquer le début d'une nouvelle journée
}

export enum PointageType {
  ENTREE = 'ENTRY',
  SORTIE = 'EXIT',
  PAUSE = 'BREAK',
  REPRISE = 'RESUME',
  WORKING = 'WORKING',
  PAUSE_TACHE = 'TASK_PAUSED',
  REPRISE_TACHE = 'TASK_RESUME',
  FIN_TACHE = 'END_TASK',
  RESTART_TACHE = 'TASK_RESTART',   
  JOIN_TACHE = 'JOIN_TASK' 
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

  // Propriétés pour la timeline améliorées
  selectedTacheId: string | null = null;
  selectedTacheNom: string = '';
  tacheHistory: ITaskHistoryEntry[] = [];
  groupedTacheHistory: { [key: string]: ITaskHistoryEntry[] } = {};
  loadingHistory = false;
  showTimeline = false;
  timelineStats = {
    totalTime: 0, // en minutes
    pauseTime: 0, // en minutes
    workTime: 0, // en minutes
    sessionsCount: 0
  };

  constructor(
    public dialogRef: MatDialogRef<Taches>,
    @Inject(MAT_DIALOG_DATA) public data: { ordreInfo: ORinterface },
    private tachesService: TachesService,
    private historyService: HistoryService
  ) { }

  ngOnInit(): void {
    if (!this.data?.ordreInfo?.id) {
      this.errorMessage = 'Aucun OR sélectionné ou ID manquant';
      console.error(this.errorMessage);
      this.dialogRef.close();
      return;
    }

    this.ordreInfo = {
      ...this.data.ordreInfo,
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

  // Méthode améliorée pour charger l'historique d'une tâche spécifique
  loadTacheTimeline(tacheId: string): void {
    const tache = this.taches.find(t => t.id === tacheId);
    if (!tache) return;

    this.selectedTacheId = tacheId;
    this.selectedTacheNom = tache.titre || 'Tâche inconnue';
    this.loadingHistory = true;
    this.showTimeline = true;
    this.tacheHistory = [];
    this.groupedTacheHistory = {};
    this.resetTimelineStats();

    if (!tache.techniciens || tache.techniciens.length === 0) {
      this.loadingHistory = false;
      return;
    }

    // Charger l'historique pour chaque technicien assigné sur une période plus large
    const startDate = moment().subtract(60, 'days').format('YYYY-MM-DD');
    const endDate = moment().add(1, 'days').format('YYYY-MM-DD');

    const historyPromises = tache.techniciens.map(technicien => {
      return this.historyService.getTechnicianHistory(technicien.id, startDate, endDate).toPromise();
    });

    Promise.all(historyPromises)
      .then(responses => {
        let allHistory: any[] = [];

        responses.forEach((response, index) => {
          if (response && Array.isArray(response)) {
            const taskRelatedEntries = response.filter(entry => {
              return entry.task && entry.task.id === tacheId;
            });

            taskRelatedEntries.forEach(entry => {
              entry.technicienInfo = tache.techniciens[index];
            });

            allHistory = allHistory.concat(taskRelatedEntries);
          }
        });

        // Transformer, trier et grouper l'historique
        this.tacheHistory = this.transformTaskHistoryData(allHistory);
        this.groupedTacheHistory = this.groupHistoryByDate(this.tacheHistory);
        this.calculateTimelineStats(this.tacheHistory);
        this.loadingHistory = false;
      })
      .catch(err => {
        console.error('Erreur lors du chargement de l\'historique de la tâche:', err);
        this.loadingHistory = false;
      });
  }

  private transformTaskHistoryData(historyItems: any[]): ITaskHistoryEntry[] {
    const entries = historyItems
      .filter(item => {
        const taskTypes = [
          PointageType.WORKING,
          PointageType.PAUSE_TACHE,
          PointageType.REPRISE_TACHE,
          PointageType.RESTART_TACHE,
          PointageType.FIN_TACHE,
          PointageType.JOIN_TACHE
        ];
        return taskTypes.includes(item.type as PointageType);
      })
      .map(item => {
        const dateObj = new Date(item.heure);

        return {
          date: dateObj.toISOString(),
          dateFormatted: dateObj.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          timeFormatted: dateObj.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          dateObject: dateObj,
          type: this.getTypeLabel(item.type),
          rawType: item.type as PointageType,
          tacheId: item.task?.id || '',
          tacheNom: item.task?.titre || item.task?.details || 'Tâche inconnue',
          heure: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          technicienNom: item.technicienInfo ?
            `${item.technicienInfo.lastName} ${item.technicienInfo.firstName}` :
            'Technicien inconnu'
        };
      })
      .sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime());

    // Marquer les nouveaux jours et calculer les durées
    return this.markNewDaysAndCalculateDurations(entries);
  }

  private markNewDaysAndCalculateDurations(entries: ITaskHistoryEntry[]): ITaskHistoryEntry[] {
    let previousDate: string | null = null;

    for (let i = 0; i < entries.length; i++) {
      const currentEntry = entries[i];
      const currentDate = currentEntry.dateObject.toDateString();

      // Marquer le début d'une nouvelle journée
      if (currentDate !== previousDate) {
        currentEntry.isNewDay = true;
        previousDate = currentDate;
      }

      // Calculer la durée jusqu'au prochain événement du même type ou de fin
      if (i < entries.length - 1) {
        const nextEntry = entries[i + 1];
        const duration = (nextEntry.dateObject.getTime() - currentEntry.dateObject.getTime()) / (1000 * 60);

        if (duration > 0 && duration < 480) { // Maximum 8 heures
          currentEntry.duration = Math.round(duration);
        }
      }
    }

    return entries;
  }

  private groupHistoryByDate(history: ITaskHistoryEntry[]): { [key: string]: ITaskHistoryEntry[] } {
    const grouped: { [key: string]: ITaskHistoryEntry[] } = {};

    history.forEach(entry => {
      const dateKey = entry.dateObject.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });

    return grouped;
  }

  private calculateTimelineStats(history: ITaskHistoryEntry[]): void {
    this.resetTimelineStats();

    let workStartTime: Date | null = null;
    let pauseStartTime: Date | null = null;

    for (const entry of history) {
      switch (entry.rawType) {
        case PointageType.WORKING:
        case PointageType.REPRISE_TACHE:
        case PointageType.RESTART_TACHE:
          workStartTime = entry.dateObject;
          this.timelineStats.sessionsCount++;
          if (pauseStartTime) {
            const pauseDuration = (entry.dateObject.getTime() - pauseStartTime.getTime()) / (1000 * 60);
            this.timelineStats.pauseTime += pauseDuration;
            pauseStartTime = null;
          }
          break;

        case PointageType.PAUSE_TACHE:
          if (workStartTime) {
            const workDuration = (entry.dateObject.getTime() - workStartTime.getTime()) / (1000 * 60);
            this.timelineStats.workTime += workDuration;
            workStartTime = null;
          }
          pauseStartTime = entry.dateObject;
          break;

        case PointageType.FIN_TACHE:
          if (workStartTime) {
            const workDuration = (entry.dateObject.getTime() - workStartTime.getTime()) / (1000 * 60);
            this.timelineStats.workTime += workDuration;
            workStartTime = null;
          }
          break;
      }
    }

    this.timelineStats.totalTime = this.timelineStats.workTime + this.timelineStats.pauseTime;
  }

  private resetTimelineStats(): void {
    this.timelineStats = {
      totalTime: 0,
      pauseTime: 0,
      workTime: 0,
      sessionsCount: 0
    };
  }

  getTypeLabel(type: PointageType): string {
    const typeLabels: Record<PointageType, string> = {
      [PointageType.ENTREE]: 'Arrivée',
      [PointageType.SORTIE]: 'Départ',
      [PointageType.PAUSE]: 'Pause',
      [PointageType.REPRISE]: 'Reprise',
      [PointageType.WORKING]: 'Tâche démarrée',
      [PointageType.PAUSE_TACHE]: 'Tâche en pause',
      [PointageType.REPRISE_TACHE]: 'Tâche reprise',
      [PointageType.RESTART_TACHE]: 'Tâche redémarrée',
      [PointageType.FIN_TACHE]: 'Tâche terminée',
      [PointageType.JOIN_TACHE]: 'Rejoindre tâche'
    };

    return typeLabels[type] || 'Inconnu';
  }

  closeTimeline(): void {
    this.showTimeline = false;
    this.selectedTacheId = null;
    this.selectedTacheNom = '';
    this.tacheHistory = [];
    this.groupedTacheHistory = {};
    this.resetTimelineStats();
  }

  getPourcentageAvancement(): number {
    if (!this.taches || this.taches.length === 0) return 0;

    const statutsTermines = ['COMPLETED'];
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

  canShowTimeline(tache: Tache): boolean {
    return ['IN_PROGRESS', 'COMPLETED', 'PAUSED'].includes(tache.statut);
  }

  getTimelineIcon(rawType: PointageType): string {
    switch (rawType) {
      case PointageType.WORKING: return '▶️';
      case PointageType.PAUSE_TACHE: return '⏸️';
      case PointageType.REPRISE_TACHE: return '▶️';
      case PointageType.RESTART_TACHE: return '🔄';
      case PointageType.FIN_TACHE: return '🏁';
      case PointageType.JOIN_TACHE: return '👥';
      default: return '📍';
    }
  }

  getTimelineClass(rawType: PointageType): string {
    switch (rawType) {
      case PointageType.WORKING: return 'timeline-start';
      case PointageType.PAUSE_TACHE: return 'timeline-pause';
      case PointageType.REPRISE_TACHE: return 'timeline-resume';
      case PointageType.RESTART_TACHE: return 'timeline-restart';
      case PointageType.FIN_TACHE: return 'timeline-end';
      case PointageType.JOIN_TACHE: return 'timeline-join';
      default: return 'timeline-default';
    }
  }

  // Nouvelles méthodes utilitaires pour l'affichage
  getGroupedHistoryKeys(): string[] {
    return Object.keys(this.groupedTacheHistory).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h${remainingMinutes}min` : `${hours}h`;
    }
  }

  getRelativeTime(date: Date): string {
    return moment(date).fromNow();
  }

  isRecentEntry(date: Date): boolean {
    return moment().diff(moment(date), 'hours') < 24;
  }
}