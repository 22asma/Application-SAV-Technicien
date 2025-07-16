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
    loading = true;
    errorMessage = '';
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
        'NON_DEMARE': 'status-en-attente',
        'EN_COURS': 'status-en-cours',
        'TERMINE': 'status-termine'
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

  // Données et états
  data: any[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

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
      
      // Récupérer tous les utilisateurs sans pagination
      const filters: OrdreReparationFilters = {
        page: 1,
        limit: 10000 // Limite élevée pour récupérer tous les utilisateurs
      };
      
      this.orService.getAllOrdreReparation(filters).subscribe({
        next: (response) => {
          console.log('Réponse du backend:', response);
          
          if (response && response.data && Array.isArray(response.data)) {
            this.ordreReparation = response.data.map((ordreReparations: any) => ({
              ...ordreReparations,
              numeroOR: ordreReparations.numeroOR || 'Aucun rôle'
            }));
          } else {
            console.error('Format de réponse inattendu:', response);
            this.ordreReparation = [];
          }
          
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors du chargement des utilisateurs';
          this.loading = false;
          console.error('Error loading OrdreReparation:', error);
        }
      });
    }
  

  onRowSelect(selectedRows: OrdreReparation[]): void {
     console.log('Lignes sélectionnées:', selectedRows);
   }
 
   // Cette méthode n'est plus nécessaire car le datatable gère tout
   onFilterChange(filters: any): void {
     console.log('Filtres changés:', filters);
   }
 
   // Cette méthode n'est plus nécessaire car le datatable gère tout
   onPageChange(params: PaginationParams): void {
     console.log('Changement de page:', params);
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

  onExportData(format: string) {
      if (format === 'excel') {
        this.exportToExcel();
      } else {
        console.warn(`Format ${format} non supporté`);
      }
    }
  
    private exportToExcel() {
      // Préparer les données au format Excel
      const data = [
        ['Nom', 'Prénom', 'Nom d\'utilisateur', 'Statut'], // En-têtes
        ...this.ordreReparation.map(t => [t.numeroOR, t.vehicule, t.client])
      ];
  
      // Créer un workbook
      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Techniciens');
  
      // Générer le fichier Excel
      XLSX.writeFile(wb, 'Techniciens.xlsx');
    }
  // Ajout d'un nouvel OR
  onAddClicked(): void {
    console.log('Ajouter un nouvel OR');
    // Implémentez la logique d'ajout ici
  }
}