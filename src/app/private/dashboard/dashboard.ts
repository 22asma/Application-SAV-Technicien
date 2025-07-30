import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { UsersService } from '../admin/services/user.service';
import { ORService } from '../ortache/services/ordre-reparation.service';
import { HistoryService } from '../technician/services/history.service';
import { TachesService } from '../ortache/services/tache.service';
import { JwtHelperService } from '@auth0/angular-jwt';

interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
}

interface DashboardStats {
  totalOR: number;
  techniciensActifs: number;
  techniciensNonPointes: number;
  totalTechniciens: number;
  tachesCompletees: number;
  tachesEnAttente: number;
  tachesEnCours: number;
  meilleurTechnicien: {
    nom: string;
    tachesCompletes: number;
  } | null;
  tempsTravauxMoyen: number;
  equipementsUtilises: number;
  efficaciteGlobale: number;
  alertesActives: number;
  tachesPlanifiees: number;
  interventionsUrgentes: number;
  tempsMoyenIntervention: string;
  satisfactionClient: number;
}

interface ChartData {
  name: string;
  value: number;
}

interface ProgressionData {
  period: string;
  completed: number;
  total: number;
  percentage: number;
}

interface TimeSeriesData {
  date: string;
  value: number;
}

interface StatistiqueItem {
  titre: string;
  valeur: string | number;
  variation: string;
  icon: string;
  couleur: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  currentUser = {
    firstName: '',
    lastName: '',
    role: '',
    username: ''
  };

  stats: DashboardStats = {
    totalOR: 0,
    techniciensActifs: 0,
    techniciensNonPointes: 0,
    totalTechniciens: 0,
    tachesCompletees: 0,
    tachesEnAttente: 0,
    tachesEnCours: 0,
    meilleurTechnicien: null,
    tempsTravauxMoyen: 0,
    equipementsUtilises: 0,
    efficaciteGlobale: 0,
    alertesActives: 0,
    tachesPlanifiees: 0,
    interventionsUrgentes: 0,
    tempsMoyenIntervention: '0h 00m',
    satisfactionClient: 0
  };

   statutsChart: ChartData[] = [];
  performanceTechniciensChart: ChartData[] = [];
  

  // Propriétés pour les graphiques
  selectedPeriod: string = 'jour';
  chartType: string = 'bar';
  progressionDataJour: TimeSeriesData[] = [];
  progressionDataMois: TimeSeriesData[] = [];
  progressionDataAnnee: TimeSeriesData[] = [];

  // États de chargement
  loading = true;
  loadingExport = false;
  errorMessage = '';

  // Alertes
  alertes: string[] = [];

  constructor(
    private usersService: UsersService,
    private orService: ORService,
    private historyService: HistoryService,
    private tachesService: TachesService,
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDashboardData();
  }

  loadCurrentUser(): void {
    const rawUserData = localStorage.getItem('user_data');

    if (rawUserData) {
      try {
        const parsedData = JSON.parse(rawUserData);
        const userId = parsedData.id;

        if (!userId) {
          console.warn('ID utilisateur introuvable dans le localStorage');
          this.setDefaultUser();
          return;
        }

        this.usersService.getUserById(userId).subscribe({
          next: (user) => {
            this.currentUser = {
              firstName: user.firstName || '—',
              lastName: user.lastName || '—',
              username: user.username || '—',
              role: user.role?.name || '—'
            };
          },
          error: (err) => {
            console.error('Erreur récupération user par ID:', err);
            this.setDefaultUser();
          }
        });

      } catch (error) {
        console.error('Erreur parsing user_data:', error);
        this.setDefaultUser();
      }
    } else {
      console.warn('Aucune donnée utilisateur dans localStorage');
      this.setDefaultUser();
    }
  }

  private setDefaultUser(): void {
    this.currentUser = {
      firstName: 'Invité',
      lastName: '',
      username: 'guest',
      role: 'VISITEUR'
    };
  }

  private loadDashboardData(): void {
  this.loading = true;
  this.errorMessage = '';

  forkJoin({
    ordresReparation: this.orService.getAllOR({ page: 1, items: 1000 }),
    techniciens: this.usersService.getTechniciens({ page: 1, items: 1000 }),
    utilisateurs: this.usersService.getAllUser({ page: 1, items: 1000 })
  }).subscribe({
    next: (data) => {
      this.processORData(data.ordresReparation.result);
      this.stats.totalOR = data.ordresReparation.total;
      
      const techData = data.techniciens;
      this.stats.totalTechniciens = techData.total || (techData.result ? techData.result.length : 0);
      
      this.loadTechniciensHistory(techData.result || []);

      // Ajout des données statiques pour le résumé
      this.stats.tachesPlanifiees = 18;
      this.stats.interventionsUrgentes = 3;
      this.stats.tempsMoyenIntervention = '2h 15m';
      this.stats.satisfactionClient = 87; // 87%

      this.loadTachesForORs(data.ordresReparation.result).add(() => {
        this.loading = false;
      });
      },
      error: (error) => {
        console.error('Erreur chargement dashboard:', error);
        this.errorMessage = 'Erreur lors du chargement des données';
        this.loading = false;
      }
    });
  }


  private processORData(ordres: any[]): void {
    // Statistiques des statuts
    const statutsCount = {
      'NOT_STARTED': 0,
      'IN_PROGRESS': 0,
      'COMPLETED': 0
    };

    ordres.forEach(or => {
      statutsCount[or.statut as keyof typeof statutsCount]++;
    });

    this.stats.tachesEnAttente = statutsCount.NOT_STARTED;
    this.stats.tachesEnCours = statutsCount.IN_PROGRESS;
    this.stats.tachesCompletees = statutsCount.COMPLETED;

    // Données pour le graphique des statuts (pour le pie chart uniquement)
    this.statutsChart = [
      { name: 'En attente', value: statutsCount.NOT_STARTED },
      { name: 'En cours', value: statutsCount.IN_PROGRESS },
      { name: 'Terminées', value: statutsCount.COMPLETED }
    ];

    // Générer les alertes
    this.generateAlertes(ordres);
  }

  private loadTechniciensHistory(techniciens: any[]): void {
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Chargement historique pour ${techniciens.length} techniciens`); // Debug
    
    if (techniciens.length === 0) {
        this.stats.techniciensActifs = 0;
        this.stats.techniciensNonPointes = 0;
        return;
    }

    const historyRequests = techniciens.map(tech => 
        this.historyService.getTechnicianHistory(tech.id, today).pipe(
            map(history => ({ 
                technicien: tech, 
                history: Array.isArray(history) ? history : [] 
            })),
            catchError(error => {
                console.error(`Erreur historique pour ${tech.id}:`, error);
                return of({ technicien: tech, history: [] });
            })
        )
    );

    forkJoin(historyRequests).subscribe({
        next: (results) => {
            this.processTechniciensHistory(results);
        },
        error: (error) => {
            console.error('Erreur globale chargement historique:', error);
            this.stats.techniciensActifs = 0;
            this.stats.techniciensNonPointes = this.stats.totalTechniciens;
        }
    });
}

  private processTechniciensHistory(results: any[]): void {
    console.log('Processing history for technicians:', results); // Debug
    
    const today = new Date().toISOString().split('T')[0];
    let techniciensPointes = 0;
    const performanceData: { [key: string]: number } = {};

    results.forEach(result => {
        const tech = result.technicien;
        const history = result.history || [];
        
        // Vérifier si le technicien a pointé ENTRY aujourd'hui
        const hasEntryToday = history.some((h: any) => {
            const entryDate = new Date(h.heure).toISOString().split('T')[0];
            return h.type === 'ENTRY' && entryDate === today;
        });

        if (hasEntryToday) {
            techniciensPointes++;
            console.log(`Technicien ${tech.firstName} ${tech.lastName} a pointé aujourd'hui`);
        }

        // Compter les tâches terminées
        const tachesTerminees = history.filter((h: any) => h.type === 'END_TASK').length;
        const nomComplet = `${tech.firstName} ${tech.lastName}`;
        performanceData[nomComplet] = tachesTerminees;
    });

    console.log(`Nombre total de techniciens pointés: ${techniciensPointes}`); // Debug
    this.stats.techniciensActifs = techniciensPointes;
    this.stats.techniciensNonPointes = this.stats.totalTechniciens - techniciensPointes;

    // Trouver le meilleur technicien
    const meilleurTech = Object.entries(performanceData)
        .sort(([,a], [,b]) => b - a)[0];

    if (meilleurTech && meilleurTech[1] > 0) {
        this.stats.meilleurTechnicien = {
            nom: meilleurTech[0],
            tachesCompletes: meilleurTech[1]
        };
    }

    // Mettre à jour le graphique
    this.performanceTechniciensChart = Object.entries(performanceData)
        .map(([nom, taches]) => ({ name: nom, value: taches }))
        .filter(item => item.value > 0)
        .slice(0, 5);
}
  private generateAlertes(ordres: any[]): void {
    this.alertes = [];

    // OR en retard (exemple: créés il y a plus de 7 jours et pas terminés)
    const orEnRetard = ordres.filter(or => {
      const dateCreation = new Date(or.dateCreation);
      const maintenant = new Date();
      const diffJours = (maintenant.getTime() - dateCreation.getTime()) / (1000 * 3600 * 24);
      return diffJours > 7 && or.statut !== 'COMPLETED';
    });

    if (orEnRetard.length > 0) {
      this.alertes.push(`${orEnRetard.length} ordre(s) de réparation en retard`);
    }

    // OR en attente
    const orEnAttente = ordres.filter(or => or.statut === 'NOT_STARTED');
    if (orEnAttente.length > 5) {
      this.alertes.push(`${orEnAttente.length} ordres en attente d'attribution`);
    }
  }

  // Actions d'export
  exportTechniciens(): void {
    this.loadingExport = true;
    
    this.usersService.exportTechniciensToExcel().subscribe({
      next: (blob: Blob) => {
        this.downloadFile(blob, 'techniciens_export.xlsx');
        this.loadingExport = false;
      },
      error: (error) => {
        console.error('Erreur export techniciens:', error);
        this.loadingExport = false;
      }
    });
  }

  exportOR(): void {
    this.loadingExport = true;
    
    this.orService.exportToExcel().subscribe({
      next: (blob: Blob) => {
        this.downloadFile(blob, 'or_export.xlsx');
        this.loadingExport = false;
      },
      error: (error) => {
        console.error('Erreur export OR:', error);
        this.loadingExport = false;
      }
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Total de toutes les tâches
  getTotalTaches(): number {
    return this.stats.tachesCompletees + this.stats.tachesEnAttente + this.stats.tachesEnCours;
  }

  // Méthodes utilitaires pour les templates
  getStatutClass(statut: string): string {
    switch (statut) {
      case 'NOT_STARTED': return 'status-en-attente';
      case 'IN_PROGRESS': return 'status-en-cours';
      case 'COMPLETED': return 'status-termine';
      default: return '';
    }
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  // Méthodes pour contrôler les graphiques d'avancement
  setPeriod(period: string): void {
    this.selectedPeriod = period;
  }

  setChartType(type: string): void {
    this.chartType = type;
  }

  getCurrentProgressionData(): TimeSeriesData[] {
    switch (this.selectedPeriod) {
      case 'jour': return this.progressionDataJour;
      case 'mois': return this.progressionDataMois;
      case 'annee': return this.progressionDataAnnee;
      default: return this.progressionDataJour;
    }
  }

  getMaxValue(): number {
    const data = this.getCurrentProgressionData();
    return Math.max(...data.map(d => d.value));
  }

  getLinePath(): string {
    const data = this.getCurrentProgressionData();
    const maxValue = this.getMaxValue();
    
    let path = '';
    data.forEach((item, index) => {
      const x = index * (400 / (data.length - 1));
      const y = 180 - (item.value / maxValue) * 160;
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    // Ajouter le remplissage
    if (data.length > 0) {
      const lastX = (data.length - 1) * (400 / (data.length - 1));
      path += ` L ${lastX} 180 L 0 180 Z`;
    }
    
    return path;
  }

  private processTachesData(taches: any[]): void {
  if (!taches || !Array.isArray(taches)) {
    console.error('Données de tâches invalides:', taches);
    this.stats.tachesCompletees = 0;
    this.stats.tachesEnAttente = 0;
    this.stats.tachesEnCours = 0;
    return;
  }

  // Debug: Log the first few tasks to see their structure
  console.log('Sample tasks:', taches.slice(0, 3));

  // Make the status check more flexible
  this.stats.tachesCompletees = taches.filter(t => 
    t.status?.toUpperCase() === 'COMPLETED' || 
    t.statut?.toUpperCase() === 'COMPLETED'
  ).length;
  
  this.stats.tachesEnAttente = taches.filter(t => 
    t.status?.toUpperCase() === 'NOT_STARTED' || 
    t.statut?.toUpperCase() === 'NOT_STARTED'
  ).length;
  
  this.stats.tachesEnCours = taches.filter(t => 
    t.status?.toUpperCase() === 'IN_PROGRESS' || 
    t.statut?.toUpperCase() === 'IN_PROGRESS'
  ).length;

  console.log('Processed tasks stats:', {
    total: taches.length,
    completees: this.stats.tachesCompletees,
    enAttente: this.stats.tachesEnAttente,
    enCours: this.stats.tachesEnCours
  });

  // Update the chart data as well
  this.statutsChart = [
    { name: 'En attente', value: this.stats.tachesEnAttente },
    { name: 'En cours', value: this.stats.tachesEnCours },
    { name: 'Terminées', value: this.stats.tachesCompletees }
  ];
}

  private loadTachesForORs(ords: any[]) {
  const tacheRequests = ords.map(or => 
    this.tachesService.getTachesByORId(or.id).pipe(
      catchError(error => {
        console.error(`Erreur chargement tâches pour OR ${or.id}:`, error);
        return of([]); // Continue même si une tâche échoue
      })
    )
  );

  return forkJoin(tacheRequests).subscribe({
    next: (tachesArrays) => {
      const allTaches = tachesArrays.flat();
      this.processTachesData(allTaches);
    },
    error: (error) => {
      console.error('Erreur globale chargement tâches:', error);
    }
  });
}

// Données statiques
taskDistribution = [
  { name: 'Terminées', value: 102, percentage: 65, color: '#10B981' },
  { name: 'En cours', value: 39, percentage: 25, color: '#F59E0B' },
  { name: 'En attente', value: 15, percentage: 10, color: '#EF4444' }
];

orCompletedData = [
  { label: 'Sem 1', value: 12 },
  { label: 'Sem 2', value: 18 },
  { label: 'Sem 3', value: 15 },
  { label: 'Sem 4', value: 22 },
  { label: 'Sem 5', value: 14 }
];

yAxisTicks = [0, 5, 10, 15, 20, 25];

get maxOrValue(): number {
  return Math.max(...this.orCompletedData.map(item => item.value));
}

getDonutOffset(percentage: number, previousPercentage = 0): number {
  const circumference = 502.65; // 2 * π * r (80)
  return circumference - (circumference * percentage / 100) + (circumference * previousPercentage / 100);
}

getBarColor(value: number): string {
  const ratio = value / this.maxOrValue;
  if (ratio > 0.8) return 'linear-gradient(to top, #10B981, #6EE7B7)';
  if (ratio > 0.5) return 'linear-gradient(to top, #3B82F6, #93C5FD)';
  return 'linear-gradient(to top, #F59E0B, #FCD34D)';
}

updateChartData(range: string): void {
  // Simuler un changement de données
  if (range === 'quarter') {
    this.taskDistribution = [
      { name: 'Terminées', value: 287, percentage: 68, color: '#10B981' },
      { name: 'En cours', value: 92, percentage: 22, color: '#F59E0B' },
      { name: 'En attente', value: 41, percentage: 10, color: '#EF4444' }
    ];
  } else {
    this.taskDistribution = [
      { name: 'Terminées', value: 102, percentage: 65, color: '#10B981' },
      { name: 'En cours', value: 39, percentage: 25, color: '#F59E0B' },
      { name: 'En attente', value: 15, percentage: 10, color: '#EF4444' }
    ];
  }
}

changeTimeRange(range: string): void {
  // Simuler un changement de données
  if (range === 'week') {
    this.orCompletedData = [
      { label: 'Lun', value: 4 },
      { label: 'Mar', value: 7 },
      { label: 'Mer', value: 5 },
      { label: 'Jeu', value: 8 },
      { label: 'Ven', value: 6 }
    ];
  } else if (range === 'year') {
    this.orCompletedData = [
      { label: 'Jan', value: 45 },
      { label: 'Fév', value: 52 },
      { label: 'Mar', value: 68 },
      { label: 'Avr', value: 61 },
      { label: 'Mai', value: 73 }
    ];
  } else {
    this.orCompletedData = [
      { label: 'Sem 1', value: 12 },
      { label: 'Sem 2', value: 18 },
      { label: 'Sem 3', value: 15 },
      { label: 'Sem 4', value: 22 },
      { label: 'Sem 5', value: 14 }
    ];
  }
}

// Données pour le résumé
summaryData = [
  { label: 'Total OR', value: this.stats.totalOR, icon: 'fas fa-clipboard-list', color: '#4299e1' },
  { label: 'Techniciens actifs', value: `${this.stats.techniciensActifs}/${this.stats.totalTechniciens}`, icon: 'fas fa-users', color: '#10B981' },
  { label: 'Tâches planifiées', value: this.stats.tachesPlanifiees, icon: 'fas fa-calendar-check', color: '#F59E0B' },
  { label: 'Interventions urgentes', value: this.stats.interventionsUrgentes, icon: 'fas fa-exclamation-triangle', color: '#EF4444' },
  { label: 'Temps moyen', value: this.stats.tempsMoyenIntervention, icon: 'fas fa-clock', color: '#667EEA' },
  { label: 'Satisfaction client', value: `${this.stats.satisfactionClient}%`, icon: 'fas fa-smile', color: '#9F7AEA' }
];


}