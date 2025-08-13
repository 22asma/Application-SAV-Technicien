import { Component } from '@angular/core';
import { DataTableAction, DataTableColumn, PaginationParams } from '../../../shared/datatable/datatable';
import { MatDialog } from '@angular/material/dialog';
import { TechDetails } from '../tech-details/tech-details';
import { UserFilters, UsersService } from '../../admin/services/user.service';
import { QrCode } from '../../admin/users/qr-code/qr-code';
import { User } from '../../admin/types/user';

@Component({
  selector: 'app-technicien',
  standalone: false,
  templateUrl: './technicien.html',
  styleUrl: './technicien.css'
})
export class Technicien {
  techniciens: any[] = [];
  loading = true;
  errorMessage = '';
  currentPage = 1;  
  itemsPerPage = 10;
  total = 0; 
  lastPage = 1;
  totalEntries = 0;
  noDataFound = false;
  searchValue: string = '';
  filters: UserFilters = {
    page: 1,
    items: 10,
    keyword: ''
  };
  
  columns: DataTableColumn[] = [
    { key: 'username', label: 'Nom d\'utilisateur', type: 'text', width: '18%' },
    { key: 'lastName', label: 'Nom', type: 'text', width: '18%' },
    { key: 'firstName', label: 'Prénom', type: 'text', width: '18%' },
    { 
      key: 'roleName', 
      label: 'Rôle', 
      type: 'badge',
      width: '15%',
      badgeColors: {
        'Technicien': 'badge-technicien',
        'Technicien Supérieur': 'badge-default'
      }
    },
    { 
      key: 'statut', 
      label: 'STATUT', 
      type: 'badge', 
      width: '20%',
      badgeColors: {
        'INACTIVE': 'status-en-attente',
        'ACTIVE': 'status-termine'
      }
    },
  ];

   actions: DataTableAction[] = [
    {
      icon: 'icon-eye',
      label: 'Voir détails',
      callback: (item) => this.viewDetails(item)
    }
  ];

  constructor(
    private dialog: MatDialog,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.loadTechniciens();
  }

 loadTechniciens(): void {
    this.loading = true;
    this.errorMessage = '';
    this.noDataFound = false;
    
    this.usersService.getTechniciens(this.filters).subscribe({
      next: (response) => {
        console.log('Réponse:', response);
        
        if (!response?.result) {
          console.error('Format de réponse inattendu');
          this.techniciens = [];
          this.noDataFound = true;
          return;
        }

        this.techniciens = response.result.map(tech => ({
          id: tech.id,
          badgeId: tech.badgeId,
          lastName: tech.lastName || tech.lastName || 'N/A',
          firstName: tech.firstName || tech.firstName || 'N/A',
          username: tech.username,
          statut: tech.statut?.toUpperCase() || 'INACTIF',
          isTechnician: true,
          roleName: tech.role?.name || 'Aucun rôle' // Ajout du nom du rôle
        }));

        this.total = response.total;
        this.lastPage = response.lastPage;
        this.totalEntries = response.total;
        this.currentPage = response.page;
        
        if (this.techniciens.length === 0) {
          this.noDataFound = true;
        }
        this.searchValue = this.filters.keyword || '';
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = err.error?.message || 'Erreur lors du chargement';
        this.loading = false;
        this.techniciens = [];
        this.total = 0;
        this.noDataFound = true;
      }
    });
  }

 onPageChange(params: PaginationParams): void {
  console.log('Paramètres reçus:', params);

  // Met à jour les filtres
  this.filters = {
    ...this.filters,
    page: params.page,
    items: params.limit,
    keyword: params.searchQuery || ''
  };

  this.currentPage = params.page;
  this.itemsPerPage = params.limit;
  this.searchValue = params.searchQuery || '';

  this.loadTechniciens();
}
  onSearch(keyword: string): void {
    this.filters.keyword = keyword;
    this.filters.page = 1;
    this.loadTechniciens();
  }

  // Méthode pour gérer l'effacement de la recherche
  onSearchCleared(): void {
    this.searchValue = '';
    this.filters.keyword = '';
    this.filters.page = 1;
    this.currentPage = 1;
    this.noDataFound = false;
    this.loadTechniciens();
  }

  viewDetails(technicien: any): void {
    // Prepare data for the modal
    const technicienInfo = {
      id: technicien.id,
      lastName: technicien.lastName,
      firstName: technicien.firstName,
      username: technicien.username,
      status: technicien.statut // On garde la valeur originale (en majuscules)
    };

    // Open the dialog
    const dialogRef = this.dialog.open(TechDetails, {
      width: '1100px',
      height: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      hasBackdrop: true,
      backdropClass: 'transparent-backdrop',
      data: {
        technicien: technicienInfo
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog fermé', result);
    });
  }
  // Datatable events
  onRowSelect(selectedRows: any[]) {
    console.log('Selected rows:', selectedRows);
  }

 onExportData(format: string): void {
  if (format === 'excel') {
    this.exportTechniciensToExcelBackend();
  }
}

private exportTechniciensToExcelBackend(): void {
  this.loading = true;
  
  this.usersService.exportTechniciensToExcel(this.filters).subscribe({
    next: (blob: Blob) => {
      this.handleExportResponse(blob);
      this.loading = false;
    },
    error: (error) => {
      console.error('Erreur lors de l\'export:', error);
      this.errorMessage = 'Erreur lors de l\'export des données';
      this.loading = false;
    }
  });
}

private handleExportResponse(blob: Blob): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const date = new Date().toISOString().split('T')[0];
  a.download = `techniciens_export_${date}.xlsx`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

  onFilterChange(filters: any) {
    console.log('Filters changed:', filters);
  }

  // Méthode pour réinitialiser la recherche
  clearSearch(): void {
    this.filters.keyword = '';
    this.filters.page = 1;
    this.noDataFound = false;
    this.loadTechniciens();
  }

  // Ajoutez cette méthode à votre classe Users
  showBarcodeModal(user: User): void {
    const dialogRef = this.dialog.open(QrCode, {
      width: '400px',
      data: { 
        badgeId: user.badgeId || user.id, // Utilise badgeId ou id comme fallback
        userName: `${user.firstName} ${user.lastName}`
      }
    });
  }
  
  handleBarcodeClick(technicien: any): void {
  console.log('Données du technicien:', technicien); // Vérifiez les données dans la console
  
  if (!technicien?.badgeId) {
    console.error('Aucun badgeId trouvé pour ce technicien');
    alert('Ce technicien n\'a pas de badge ID défini');
    return;
  }

  this.dialog.open(QrCode, {
    width: '350px',
    data: { 
      badgeId: technicien.badgeId, // Utilisez uniquement badgeId sans fallback
      userName: `${technicien.firstName} ${technicien.lastName}`
    }
  });
}
}