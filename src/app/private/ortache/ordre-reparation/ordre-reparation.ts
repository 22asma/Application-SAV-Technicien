// ordre-reparation.component.ts - Modifications nécessaires

import { Component, OnInit } from '@angular/core';
import { DataTableAction, DataTableColumn, PaginationParams } from '../../../shared/datatable/datatable';
import { MatDialog } from '@angular/material/dialog';
import { Taches } from '../taches/taches';
import { OrdreReparationFilters, ORService } from '../services/ordre-reparation.service';
import * as XLSX from 'xlsx';
import { ORinterface } from '../types/ORinterface';
import { DatePipe } from '@angular/common';

// Interface locale pour les options de filtre de statut
export interface StatusFilterOption {
  value: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'app-ordre-reparation',
  templateUrl: './ordre-reparation.html',
  styleUrls: ['./ordre-reparation.css'],
  standalone: false
})
export class OrdreReparation implements OnInit {
  ordreReparation: ORinterface[] = [];
  
  // Configuration des colonnes
  columns: DataTableColumn[] = [
    { key: 'numOR', label: 'N° OR', width: '15px', type: 'number', sortable: true },
    { key: 'vehicule', label: 'VÉHICULE', width: '15px', type: 'text' },
    { key: 'client', label: 'CLIENT', width: '15px', type: 'text' },
    { 
      key: 'dateOR', 
      label: 'DATE OR', 
      width: '15%', 
      type: 'text',
      sortable: true 
    },
    {
      key: 'statut',
      label: 'Statut',
      sortable: true,
      type: 'badge',
      width: '15%',
      badgeColors: {
        'NOT_STARTED': 'status-en-attente',
        'IN_PROGRESS': 'status-en-cours',
        'COMPLETED': 'status-termine'
      }
    }
  ];

  // Actions disponibles
  actions: DataTableAction[] = [
    {
      icon: 'icon-eye',
      label: 'Voir détails',
      callback: (item) => this.viewDetails(item)
    }
  ];

  // Options de filtre par statut pour le datatable
  statusFilterOptions: StatusFilterOption[] = [
    { value: 'NOT_STARTED', label: 'Non commencé' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'COMPLETED', label: 'Terminé' }
  ];

  loading = true;
  errorMessage = '';
  currentPage: number = 1; 
  itemsPerPage: number = 10;
  total: number = 0; 
  lastPage: number = 1;
  totalEntries: number = 0;
  noDataFound = false;
  searchValue: string = '';
  // Filtres
  filters: OrdreReparationFilters & {
    startDate?: string;
    endDate?: string;
    OrStatut?: string[];
  } = {
    page: 1,
    items: 10,
    keyword: ''
  };

  constructor(
    public dialog: MatDialog,
    private orService: ORService
  ) {}

  ngOnInit(): void {
    this.loadORs();
  }

  loadORs(): void {
    this.loading = true;
    this.errorMessage = '';
    this.noDataFound = false;
    
    this.orService.getAllOR(this.filters).subscribe({
      next: (response) => {
        this.ordreReparation = response.result;
        this.total = response.total;
        this.totalEntries = response.total;
        this.currentPage = response.page;
        this.lastPage = response.lastPage;
        this.ordreReparation = response.result.map(or => {
        const dateOR = or.createdAt ? this.extractDateFromCreatedAt(or.createdAt) : '';
        return {
          ...or,
          dateOR: dateOR // Ajoute le champ calculé
        };
        });
        if (response.result.length === 0 && this.filters.keyword && this.filters.keyword.trim() !== '') {
          this.noDataFound = true;
        }
        
        this.loading = false;
        this.searchValue = this.filters.keyword || '';
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.errorMessage = 'Erreur lors du chargement des ordres de réparation';
        this.loading = false;
        this.ordreReparation = [];
        this.total = 0;
        this.totalEntries = 0;
      }
    });
  }
 
  onPageChange(params: PaginationParams): void {
    console.log('Paramètres reçus:', params);

    // Met à jour les filtres avec tous les paramètres
    this.filters = {
      ...this.filters,
      page: params.page,
      items: params.limit,
      keyword: params.searchQuery || ''
    };

    // Gestion du filtre de statut (peut contenir plusieurs statuts séparés par virgule)
    if (params.statusFilter) {
      // Divise la chaîne par virgule pour obtenir un tableau
      this.filters.OrStatut = params.statusFilter.split(',').filter(s => s.trim());
    } else {
      delete this.filters.OrStatut;
    }

    // Gestion du filtre de date
    if (params.dateRange) {
      if (params.dateRange.start) {
        this.filters.startDate = this.formatDateForBackend(params.dateRange.start);
      } else {
        delete this.filters.startDate;
      }

      if (params.dateRange.end) {
        this.filters.endDate = this.formatDateForBackend(params.dateRange.end);
      } else {
        delete this.filters.endDate;
      }
    } else {
      delete this.filters.startDate;
      delete this.filters.endDate;
    }

    // Met à jour les variables locales
    this.currentPage = params.page;
    this.itemsPerPage = params.limit;
    this.searchValue = params.searchQuery || '';
    console.log('Filtres finaux envoyés au backend:', this.filters);
    this.loadORs();
  }

  /**
   * Formate une date pour l'envoyer au backend
   */
  private formatDateForBackend(date: Date): string {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0];
  }

  onSearch(keyword: string): void {
    this.filters.keyword = keyword;
    this.filters.page = 1;
    this.loadORs();
  }

  onStatusFilter(statut: string): void {
    this.filters.OrStatut = statut ? [statut] : undefined;
    this.filters.page = 1;
    this.loadORs();
  }

  /**
   * Gestionnaire pour le filtre de date depuis le datatable
   */
  onDateRangeFilter(dateRange: {start: Date|null, end: Date|null}): void {
    console.log('Filtre de date reçu:', dateRange);
    
    if (dateRange.start) {
      this.filters.startDate = this.formatDateForBackend(dateRange.start);
    } else {
      delete this.filters.startDate;
    }

    if (dateRange.end) {
      this.filters.endDate = this.formatDateForBackend(dateRange.end);
    } else {
      delete this.filters.endDate;
    }

    this.filters.page = 1;
    this.loadORs();
  }

  /**
   * Gestionnaire pour le filtre de statut depuis le datatable
   */
  onStatusFilterChange(statuses: string[]): void {
    console.log('Filtre de statut reçu:', statuses);
    
    if (statuses && statuses.length > 0) {
      this.filters.OrStatut = statuses;
    } else {
      delete this.filters.OrStatut;
    }

    this.filters.page = 1;
    this.loadORs();
  }

  // Voir les détails d'un OR
  viewDetails(ordre: any): void {
    this.orService.getORById(ordre.id).subscribe({
      next: (orDetails) => {
        const dialogRef = this.dialog.open(Taches, {
          width: '900px',
          data: {
            ordreInfo: {
              id: orDetails.id,
              numeroOR: `OR-${orDetails.numeroOR}`,
              vehicule: orDetails.vehicule,
              client: orDetails.client
            },
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          console.log('La modal des tâches a été fermée');
        });
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.errorMessage = 'Impossible de charger les détails';
      }
    });
  }

  onExportData(format: string): void {
    if (format === 'excel') {
      this.exportORToExcel();
    }
  }

  private exportORToExcel(): void {
    this.loading = true;
    
    this.orService.exportToExcel(this.filters).subscribe({
      next: (blob: Blob) => {
        this.downloadExcelFile(blob);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur export:', error);
        this.errorMessage = 'Échec de l\'export des OR';
        this.loading = false;
      }
    });
  }

  private downloadExcelFile(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `or_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  onRowSelect(selectedRows: any[]): void {
    console.log('Lignes sélectionnées:', selectedRows);
  }

  onFilterChange(filters: any): void {
    console.log('Filtres changés:', filters);
  }

  // Méthode pour réinitialiser la recherche
  clearSearch(): void {
    this.filters.keyword = '';
    this.filters.page = 1;
    this.noDataFound = false;
    this.loadORs();
  }

  /**
   * Méthode pour réinitialiser tous les filtres
   */
  clearAllFilters(): void {
    this.filters = {
      page: 1,
      items: 10,
      keyword: ''
    };
    this.noDataFound = false;
    this.loadORs();
  }

 private extractDateFromCreatedAt(createdAt: string): string {
  try {
    const dateObj = new Date(createdAt);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

 onSearchCleared(): void {
    this.searchValue = '';
    this.filters.keyword = '';
    this.filters.page = 1;
    this.currentPage = 1;
    this.noDataFound = false;
    this.loadORs();
  }
}