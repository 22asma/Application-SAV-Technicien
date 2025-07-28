import { Component, OnInit } from '@angular/core';
import { DataTableAction, DataTableColumn, PaginationParams } from '../../../shared/datatable/datatable';
import { MatDialog } from '@angular/material/dialog';
import { Taches } from '../taches/taches';
import { OrdreReparationFilters, ORService } from '../services/ordre-reparation.service';
import * as XLSX from 'xlsx';
import { ORinterface } from '../types/ORinterface';

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

  // Actions disponible
  actions: DataTableAction[] = [
    {
      icon: 'icon-eye',
      label: 'Voir détails',
      callback: (item) => this.viewDetails(item)
    }
  ];

  loading = true;
  errorMessage = '';
  currentPage: number = 1; 
  itemsPerPage: number = 10;
  total: number = 0; 
  lastPage: number = 1;
  totalEntries: number = 0;
  noDataFound = false;
  // Filtres
  filters: OrdreReparationFilters = {
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

        if (response.result.length === 0 && this.filters.keyword && this.filters.keyword.trim() !== '') {
          this.noDataFound = true;
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.errorMessage = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
        this.ordreReparation = [];
        this.total = 0;
        this.totalEntries = 0;
      }
    });
  }
 
   onPageChange(params: PaginationParams): void {
    console.log('Paramètres reçus:', params);
    
    // Mettre à jour les filtres
    this.filters = {
      ...this.filters,
      page: params.page,
      items: params.limit,
      keyword: params.searchQuery || ''
    };
    
    // Charger les nouvelles données
    this.loadORs();
  }

  onSearch(keyword: string): void {
    this.filters.keyword = keyword;
    this.filters.page = 1;
    this.loadORs();
  }

  onStatusFilter(statut: string): void {
    this.filters.statut = statut;
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
            id: orDetails.id, // <-- Ajout crucial de l'ID
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

  onRowSelect(selectedRows: OrdreReparation[]): void {
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
}