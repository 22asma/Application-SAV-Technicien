import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ORService } from '../ortache/services/ordre-reparation.service';
import { TachesService } from '../ortache/services/tache.service';
import { UsersService } from '../admin/services/user.service'; // Import du service utilisateurs
import { Chart, registerables } from 'chart.js';
import { Tache } from '../ortache/types/tache';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HistoryService } from '../technician/services/history.service';

Chart.register(...registerables);

// Interface pour les statistiques des techniciens
interface TechnicianStats {
  totalTechnicians: number;
  activeTechnicians: number;
  topTasksCompleter: {
    name: string;
    completedTasks: number;
  } | null;
  fastestWorker: {
    name: string;
    averageTime: number;
  } | null;
}

interface AlertStats {
  unclockedTechnicians: number;
  lateTechnicians: number;
  lateTechniciansList: { firstName: string; lastName: string }[];
  orWithUnstartedTasks: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  providers: [DatePipe]
})
export class Dashboard implements OnInit, AfterViewInit {
  @ViewChild('pieChartCanvas', { static: false }) pieChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas', { static: false }) barChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  stats = {
    totalORToday: 0,
    totalTachesToday: 0,
    totalOR: 0,
    totalTaches: 0
  };

  // Nouvelles statistiques pour les techniciens
  technicianStats: TechnicianStats = {
    totalTechnicians: 0,
    activeTechnicians: 0,
    topTasksCompleter: null,
    fastestWorker: null
  };

  // Statistiques pour le pie chart (OR)
  pieChartStats = {
    NOT_STARTED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0
  };

  // Statistiques pour le bar chart (Tâches)
  barChartStats = {
    NOT_STARTED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    PAUSED: 0
  };

  // Statistiques des tâches détaillées
  taskStats = {
    averageDuration: 0,
    longestTask: null as Tache | null,
    fastestTask: null as Tache | null,
    totalTasks: 0
  };

  // Alertes
  alertStats: AlertStats = {
    unclockedTechnicians: 0,
    lateTechnicians: 0,
    lateTechniciansList: [], // Maintenant TypeScript sait que ce sera un tableau d'objets avec firstName et lastName
    orWithUnstartedTasks: 0
  };

  loading = true;
  technicianStatsLoading = true; // Loading séparé pour les statistiques techniciens
  pieChart: Chart | null = null;
  barChart: Chart | null = null;
  
  // Période sélectionnée (aujourd'hui ou mois)
  selectedPeriod: 'today' | 'month' = 'today';
  selectedMonth: Date = new Date();

  constructor(
    private orService: ORService,
    private tachesService: TachesService,
    private usersService: UsersService, // Injection du service utilisateurs
    private historyService: HistoryService, // Injection du service historique
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadTodayStats();
    this.loadTechnicianStats(); 
    this.loadAlertStats();
  }

  ngAfterViewInit(): void {

      this.loadPieChartData();
      this.loadTasksData();
  }

  // Nouvelle méthode pour charger les statistiques des techniciens
  loadTechnicianStats(): void {
    this.technicianStatsLoading = true;
    
    // Charger tous les techniciens
    this.usersService.getTechniciens({ page: 1, items: 1000, keyword: '' }).subscribe({
      next: (response) => {
        const technicians = response.result || [];
        
        // 1. Nombre total de techniciens
        this.technicianStats.totalTechnicians = technicians.length;
        
        // 2. Nombre de techniciens actifs (pointés aujourd'hui)
        this.countActiveTechnicians(technicians);
        
        // 3. & 4. Analyser les tâches pour trouver le meilleur performant
        this.analyzeTechnicianPerformance(technicians);
        
      },
      error: (error) => {
        console.error('Erreur lors du chargement des techniciens:', error);
        this.technicianStatsLoading = false;
      }
    });
  }

  // Compter les techniciens qui ont pointé aujourd'hui
  private countActiveTechnicians(technicians: any[]): void {
    const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '';
    let activeCount = 0;
    let processedCount = 0;

    if (technicians.length === 0) {
      this.technicianStats.activeTechnicians = 0;
      return;
    }

    technicians.forEach(tech => {
      this.historyService.getTechnicianHistory(tech.id, today).subscribe({
        next: (history) => {
          if (history && history.length > 0) {
            activeCount++;
          }
          processedCount++;
          
          if (processedCount === technicians.length) {
            this.technicianStats.activeTechnicians = activeCount;
          }
        },
        error: (error) => {
          processedCount++;
          if (processedCount === technicians.length) {
            this.technicianStats.activeTechnicians = activeCount;
          }
        }
      });
    });
  }

  // Analyser les performances des techniciens
  private analyzeTechnicianPerformance(technicians: any[]): void {
    // Charger toutes les tâches de tous les OR
    this.orService.getAllOR({ items: 1000 }).subscribe({
      next: (orResponse) => {
        const allORs = orResponse.result || [];
        this.loadAllTasksForTechnicianAnalysis(allORs, technicians);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des OR pour l\'analyse:', error);
        this.technicianStatsLoading = false;
      }
    });
  }

  private loadAllTasksForTechnicianAnalysis(ors: any[], technicians: any[]): void {
    if (ors.length === 0) {
      this.technicianStatsLoading = false;
      return;
    }

    const taskObservables = ors.map(or => 
      this.tachesService.getTachesByORId(or.id).pipe(
        catchError(error => {
          console.error(`Erreur chargement tâches pour OR ${or.id}:`, error);
          return of([]);
        })
      )
    );

    forkJoin(taskObservables).subscribe({
      next: (allTasksArrays) => {
        const allTasks = allTasksArrays.flat();
        this.calculateTechnicianPerformanceStats(allTasks, technicians);
        this.technicianStatsLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de l\'analyse des tâches:', error);
        this.technicianStatsLoading = false;
      }
    });
  }

 private calculateTechnicianPerformanceStats(tasks: Tache[], technicians: any[]): void {
    // Créer un map des techniciens pour accès rapide
    const technicianMap = new Map();
    technicians.forEach(tech => {
      technicianMap.set(tech.id, {
        ...tech,
        completedTasks: 0,
        totalDuration: 0,
        taskCount: 0
      });
    });

    // Analyser chaque tâche
    tasks.forEach(task => {
      // Vérifier chaque technicien assigné à la tâche
      task.techniciens.forEach(tech => {
        if (technicianMap.has(tech.id)) {
          const techStats = technicianMap.get(tech.id);
          
          // Compter les tâches terminées
          if (task.statut === 'COMPLETED') {
            techStats.completedTasks++;
          }

          // Calculer la durée si possible
          if (task.createdAt && task.updatedAt) {
            const created = new Date(task.createdAt);
            const updated = new Date(task.updatedAt);
            const duration = Math.abs(updated.getTime() - created.getTime()) / (1000 * 60 * 60); // en heures
            
            if (duration > 0) {
              techStats.totalDuration += duration;
              techStats.taskCount++;
            }
          }
        }
      });
    });

    // Trouver le technicien avec le plus de tâches terminées
    let maxCompletedTasks = 0;
    let topCompleter = null;
    
    // Trouver le technicien le plus rapide (moyenne la plus basse)
    let minAverageTime = Infinity;
    let fastestWorker = null;

    technicianMap.forEach((stats, techId) => {
      // Technicien avec le plus de tâches terminées
      if (stats.completedTasks > maxCompletedTasks) {
        maxCompletedTasks = stats.completedTasks;
        topCompleter = {
          name: `${stats.firstName} ${stats.lastName}`,
          completedTasks: stats.completedTasks
        };
      }

      // Technicien le plus rapide (qui a au moins fait quelques tâches)
      if (stats.taskCount >= 3) { // Minimum 3 tâches pour être considéré
        const averageTime = stats.totalDuration / stats.taskCount;
        if (averageTime < minAverageTime) {
          minAverageTime = averageTime;
          fastestWorker = {
            name: `${stats.firstName} ${stats.lastName}`,
            averageTime: averageTime
          };
        }
      }
    });

    this.technicianStats.topTasksCompleter = topCompleter;
    this.technicianStats.fastestWorker = fastestWorker;

    console.log('Statistiques techniciens calculées:', this.technicianStats);
}

  // Méthode utilitaire pour formater le temps moyen
  getFormattedAverageTime(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)} min`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}j ${remainingHours.toFixed(1)}h`;
    }
  }

  loadTodayStats(): void {
    const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd') || undefined;
    
    // Charger les OR d'aujourd'hui
    this.orService.getAllOR({
      startDate: today,
      endDate: today,
      items: 1000 // On met un nombre élevé pour récupérer tous les OR du jour
    }).subscribe({
      next: (response) => {
        this.stats.totalORToday = response.total;
        
        // Pour chaque OR, charger ses tâches
        this.countTachesForTodayOR(response.result);
      },
      error: (error) => {
        console.error('Erreur chargement OR:', error);
        this.loading = false;
      }
    });
  }

  countTachesForTodayOR(ords: any[]): void {
    let totalTaches = 0;
    let processedOrds = 0;

    if (ords.length === 0) {
      this.stats.totalTachesToday = 0;
      this.loading = false;
      return;
    }

    ords.forEach(ord => {
      this.tachesService.getTachesByORId(ord.id).subscribe({
        next: (taches) => {
          totalTaches += taches.length;
          processedOrds++;
          
          // Quand on a traité tous les OR
          if (processedOrds === ords.length) {
            this.stats.totalTachesToday = totalTaches;
            this.loading = false;
          }
        },
        error: (error) => {
          console.error(`Erreur chargement tâches pour OR ${ord.id}:`, error);
          processedOrds++;
          
          if (processedOrds === ords.length) {
            this.stats.totalTachesToday = totalTaches;
            this.loading = false;
          }
        }
      });
    });
  }

  loadPieChartData(): void {
    let startDate: string;
    let endDate: string;

    if (this.selectedPeriod === 'today') {
      const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '';
      startDate = today;
      endDate = today;
    } else {
      // Pour le mois sélectionné
      const firstDayOfMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1);
      const lastDayOfMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0);
      
      startDate = this.datePipe.transform(firstDayOfMonth, 'yyyy-MM-dd') || '';
      endDate = this.datePipe.transform(lastDayOfMonth, 'yyyy-MM-dd') || '';
    }

    // Réinitialiser les stats
    this.pieChartStats = {
      NOT_STARTED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0
    };

    // Charger les données pour chaque statut
    const statuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
    let completedRequests = 0;

    statuses.forEach(status => {
      this.orService.getAllOR({
        startDate: startDate,
        endDate: endDate,
        OrStatut: [status],
        items: 1000
      }).subscribe({
        next: (response) => {
          this.pieChartStats[status as keyof typeof this.pieChartStats] = response.total;
          completedRequests++;
          
          // Quand toutes les requêtes sont terminées, mettre à jour le chart
          if (completedRequests === statuses.length) {
            this.updateOrCreatePieChart();
          }
        },
        error: (error) => {
          console.error(`Erreur chargement OR pour statut ${status}:`, error);
          completedRequests++;
          
          if (completedRequests === statuses.length) {
            this.updateOrCreatePieChart();
          }
        }
      });
    });
  }

  updateOrCreatePieChart(): void {
    if (this.pieChart) {
      this.updatePieChart();
    } else {
      // Attendre un peu plus si le canvas n'est pas encore prêt
      setTimeout(() => {
        this.initializePieChart();
      }, 200);
    }
  }

  // Nouvelles méthodes pour les statistiques des tâches
  loadTasksData(): void {
    let startDate: string;
    let endDate: string;

    if (this.selectedPeriod === 'today') {
      const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '';
      startDate = today;
      endDate = today;
    } else {
      const firstDayOfMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1);
      const lastDayOfMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0);
      
      startDate = this.datePipe.transform(firstDayOfMonth, 'yyyy-MM-dd') || '';
      endDate = this.datePipe.transform(lastDayOfMonth, 'yyyy-MM-dd') || '';
    }

    // Réinitialiser les stats
    this.barChartStats = {
      NOT_STARTED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      PAUSED: 0
    };

    this.taskStats = {
      averageDuration: 0,
      longestTask: null,
      fastestTask: null,
      totalTasks: 0
    };

    // Charger d'abord tous les OR de la période
    this.orService.getAllOR({
      startDate: startDate,
      endDate: endDate,
      items: 1000
    }).subscribe({
      next: (response) => {
        this.loadAllTasksForORs(response.result);
      },
      error: (error) => {
        console.error('Erreur chargement OR pour tâches:', error);
      }
    });
  }

  loadAllTasksForORs(ors: any[]): void {
    if (ors.length === 0) {
      this.updateOrCreateBarChart();
      return;
    }

    let processedORs = 0;
    const allTasks: Tache[] = [];

    ors.forEach(or => {
      this.tachesService.getTachesByORId(or.id).subscribe({
        next: (tasks) => {
          allTasks.push(...tasks);
          processedORs++;
          
          if (processedORs === ors.length) {
            this.processTasksData(allTasks);
            this.updateOrCreateBarChart();
          }
        },
        error: (error) => {
          console.error(`Erreur chargement tâches pour OR ${or.id}:`, error);
          processedORs++;
          
          if (processedORs === ors.length) {
            this.processTasksData(allTasks);
            this.updateOrCreateBarChart();
          }
        }
      });
    });
  }

  processTasksData(tasks: Tache[]): void {
    this.taskStats.totalTasks = tasks.length;

    if (tasks.length === 0) return;

    // Compter les tâches par statut
    tasks.forEach(task => {
      // Mapping sécurisé des statuts
      const statusKey = task.statut as string;
      if (statusKey in this.barChartStats) {
        (this.barChartStats as any)[statusKey]++;
      } else {
        // Log pour debug si un statut inconnu est trouvé
        console.warn(`Statut de tâche inconnu: ${statusKey}`);
      }
    });

    // Calculer les durées (estimation basée sur les dates de création/mise à jour)
    const tasksWithDuration = tasks.filter(task => task.createdAt && task.updatedAt)
      .map(task => {
        const created = new Date(task.createdAt!);
        const updated = new Date(task.updatedAt!);
        const durationHours = Math.abs(updated.getTime() - created.getTime()) / (1000 * 60 * 60);
        return { ...task, duration: durationHours };
      });

    if (tasksWithDuration.length > 0) {
      // Durée moyenne
      const totalDuration = tasksWithDuration.reduce((sum, task) => sum + task.duration, 0);
      this.taskStats.averageDuration = totalDuration / tasksWithDuration.length;

      // Tâche la plus longue
      this.taskStats.longestTask = tasksWithDuration.reduce((longest, current) => 
        current.duration > longest.duration ? current : longest
      );

      // Tâche la plus rapide (exclure les durées de 0)
      const validTasks = tasksWithDuration.filter(task => task.duration > 0);
      if (validTasks.length > 0) {
        this.taskStats.fastestTask = validTasks.reduce((fastest, current) => 
          current.duration < fastest.duration ? current : fastest
        );
      }
    }

    console.log('Statistiques des tâches:', this.taskStats);
    console.log('Répartition par statut:', this.barChartStats);
  }

  initializeBarChart(): void {
    if (!this.barChartCanvas || !this.barChartCanvas.nativeElement) {
      console.log('Canvas bar chart non disponible, tentative dans 500ms...');
      setTimeout(() => {
        this.initializeBarChart();
      }, 500);
      return;
    }

    const ctx = this.barChartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Impossible d\'obtenir le contexte 2D du canvas bar chart');
      return;
    }

    // Détruire le chart existant s'il y en a un
    if (this.barChart) {
      this.barChart.destroy();
    }

    console.log('Création du bar chart avec les données:', this.barChartStats);

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['À faire', 'En cours', 'Terminé', 'En pause'],
        datasets: [{
          label: 'Nombre de tâches',
          data: [
            this.barChartStats.NOT_STARTED,
            this.barChartStats.IN_PROGRESS,
            this.barChartStats.COMPLETED,
            this.barChartStats.PAUSED
          ],
          backgroundColor: [
            'rgba(255, 167, 38, 0.8)',   // Orange pour à faire
            'rgba(66, 165, 245, 0.8)',   // Bleu pour en cours
            'rgba(102, 187, 106, 0.8)',  // Vert pour terminé
            'rgba(156, 39, 176, 0.8)'    // Violet pour en pause
          ],
          borderColor: [
            '#FF9800',
            '#2196F3',
            '#4CAF50',
            '#9C27B0'
          ],
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.label}: ${context.raw} tâche(s)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });

    console.log('Bar chart créé avec succès');
  }

  updateBarChart(): void {
    if (this.barChart) {
      this.barChart.data.datasets[0].data = [
        this.barChartStats.NOT_STARTED,
        this.barChartStats.IN_PROGRESS,
        this.barChartStats.COMPLETED,
        this.barChartStats.PAUSED
      ];
      this.barChart.update();
      console.log('Bar chart mis à jour avec:', this.barChartStats);
    } else {
      console.log('Bar chart non initialisé, création en cours...');
      this.initializeBarChart();
    }
  }

  updateOrCreateBarChart(): void {
    if (this.barChart) {
      this.updateBarChart();
    } else {
      setTimeout(() => {
        this.initializeBarChart();
      }, 200);
    }
  }

  initializePieChart(): void {
    if (!this.pieChartCanvas || !this.pieChartCanvas.nativeElement) {
      console.log('Canvas non disponible, tentative dans 500ms...');
      setTimeout(() => {
        this.initializePieChart();
      }, 500);
      return;
    }

    const ctx = this.pieChartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Impossible d\'obtenir le contexte 2D du canvas');
      return;
    }

    // Détruire le chart existant s'il y en a un
    if (this.pieChart) {
      this.pieChart.destroy();
    }

    console.log('Création du pie chart avec les données:', this.pieChartStats);

    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['En attente', 'En cours', 'Terminé'],
        datasets: [{
          data: [
            this.pieChartStats.NOT_STARTED,
            this.pieChartStats.IN_PROGRESS,
            this.pieChartStats.COMPLETED
          ],
          backgroundColor: [
            '#FFA726', // Orange pour en attente
            '#42A5F5', // Bleu pour en cours
            '#66BB6A'  // Vert pour terminé
          ],
          borderColor: [
            '#FF9800',
            '#2196F3',
            '#4CAF50'
          ],
          borderWidth: 2,
          hoverBackgroundColor: [
            '#FFB74D',
            '#64B5F6',
            '#81C784'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12,
                family: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
                const percentage = total > 0 ? ((context.raw as number / total) * 100).toFixed(1) : '0';
                return `${context.label}: ${context.raw} (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    console.log('Pie chart créé avec succès');
  }

  updatePieChart(): void {
    if (this.pieChart) {
      this.pieChart.data.datasets[0].data = [
        this.pieChartStats.NOT_STARTED,
        this.pieChartStats.IN_PROGRESS,
        this.pieChartStats.COMPLETED
      ];
      this.pieChart.update();
      console.log('Pie chart mis à jour avec:', this.pieChartStats);
    } else {
      console.log('Pie chart non initialisé, création en cours...');
      this.initializePieChart();
    }
  }

  onPeriodChange(period: 'today' | 'month'): void {
    this.selectedPeriod = period;
    console.log('Changement de période vers:', period);
    this.loadPieChartData();
    this.loadTasksData();
  }

  onMonthChange(event: any): void {
    this.selectedMonth = new Date(event.target.value);
    console.log('Changement de mois vers:', this.selectedMonth);
    if (this.selectedPeriod === 'month') {
      this.loadPieChartData();
      this.loadTasksData();
    }
  }

  getTotalTaches(): number {
    return this.stats.totalTachesToday;
  }

  getTotalORForPieChart(): number {
    return this.pieChartStats.NOT_STARTED + this.pieChartStats.IN_PROGRESS + this.pieChartStats.COMPLETED;
  }

  getTotalTasksForBarChart(): number {
    return this.barChartStats.NOT_STARTED + this.barChartStats.IN_PROGRESS + this.barChartStats.COMPLETED + this.barChartStats.PAUSED;
  }

  getFormattedDuration(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    return `${hours.toFixed(1)} min`;
  }

  getFormattedMonth(): string {
    return this.datePipe.transform(this.selectedMonth, 'yyyy-MM') || '';
  }

  getPeriodLabel(): string {
    if (this.selectedPeriod === 'today') {
      return 'Aujourd\'hui';
    } else {
      return this.datePipe.transform(this.selectedMonth, 'MMMM yyyy', 'fr-FR') || '';
    }
  }

  // Nouvelles méthodes utilitaires pour les tâches
  getTaskDurationInfo(task: any): { duration: number, formattedDuration: string } {
    if (!task.createdAt || !task.updatedAt) {
      return { duration: 0, formattedDuration: '0 min' };
    }
    
    const created = new Date(task.createdAt);
    const updated = new Date(task.updatedAt);
    const durationHours = Math.abs(updated.getTime() - created.getTime()) / (1000 * 60 * 60);
    
    return {
      duration: durationHours,
      formattedDuration: this.getFormattedDuration(durationHours)
    };
  }

  getCompletionRate(): number {
    const total = this.getTotalTasksForBarChart();
    if (total === 0) return 0;
    return Math.round((this.barChartStats.COMPLETED / total) * 100);
  }

  getInProgressRate(): number {
    const total = this.getTotalTasksForBarChart();
    if (total === 0) return 0;
    return Math.round((this.barChartStats.IN_PROGRESS / total) * 100);
  }

  private loadAlertStats(): void {
  const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '';
  
  // 1. Charger tous les techniciens
  this.usersService.getTechniciens({ page: 1, items: 1000, keyword: '' }).subscribe({
    next: (techResponse) => {
      const technicians = techResponse.result || [];
      
      // 2. Pour chaque technicien, vérifier le pointage
      this.checkTechniciansClockStatus(technicians, today);
      
      // 3. Charger les OR avec tâches non démarrées
      this.loadORWithUnstartedTasks(today);
    },
    error: (error) => {
      console.error('Erreur lors du chargement des techniciens:', error);
    }
  });
}

private checkTechniciansClockStatus(technicians: any[], today: string): void {
  let processedCount = 0;
  let unclockedCount = 0;
  let lateCount = 0;
  const lateTechniciansList: { firstName: string, lastName: string }[] = [];

  technicians.forEach(tech => {
    this.historyService.getTechnicianHistory(tech.id, today).subscribe({
      next: (history) => {
        processedCount++;
        
        // Vérifier si le technicien a pointé
        const hasEntry = history.some((entry: any) => entry.type === 'ENTRY');
        
        if (!hasEntry) {
          unclockedCount++;
        } else {
          // Vérifier si le pointage est en retard (> 8h)
          const entry = history.find((entry: any) => entry.type === 'ENTRY');
          if (entry) {
            const entryTime = new Date(entry.heure).getHours();
            if (entryTime > 8) { // Après 8h du matin
              lateCount++;
              lateTechniciansList.push({
                firstName: tech.firstName,
                lastName: tech.lastName
              });
            }
          }
        }
        
        // Mettre à jour les stats quand tous les techniciens sont traités
        if (processedCount === technicians.length) {
          this.alertStats.unclockedTechnicians = unclockedCount;
          this.alertStats.lateTechnicians = lateCount;
          this.alertStats.lateTechniciansList = lateTechniciansList;
        }
      },
      error: (error) => {
        processedCount++;
        console.error(`Erreur historique technicien ${tech.id}:`, error);
      }
    });
  });
}

private loadORWithUnstartedTasks(today: string): void {
  // Charger tous les OR d'aujourd'hui
  this.orService.getAllOR({
    startDate: today,
    endDate: today,
    items: 1000
  }).subscribe({
    next: (orResponse) => {
      const ors = orResponse.result || [];
      let processedOrs = 0;
      let orsWithUnstartedTasks = 0;
      
      if (ors.length === 0) {
        this.alertStats.orWithUnstartedTasks = 0;
        return;
      }
      
      // Pour chaque OR, vérifier s'il a des tâches non démarrées
      ors.forEach(or => {
        this.tachesService.getTachesByORId(or.id!).subscribe({
          next: (tasks) => {
            processedOrs++;
            
            // Vérifier si au moins une tâche n'est pas démarrée
            const hasUnstarted = tasks.some((task: Tache) => 
              task.statut === 'NOT_STARTED' 
            );
            
            if (hasUnstarted) {
              orsWithUnstartedTasks++;
            }
            
            if (processedOrs === ors.length) {
              this.alertStats.orWithUnstartedTasks = orsWithUnstartedTasks;
            }
          },
          error: (error) => {
            processedOrs++;
            console.error(`Erreur tâches OR ${or.id}:`, error);
          }
        });
      });
    },
    error: (error) => {
      console.error('Erreur chargement OR:', error);
    }
  });
}
}