import { Component, OnInit } from '@angular/core';
import { DataTableAction, DataTableColumn, PaginationParams } from '../../../shared/datatable/datatable';
import { UsersService, UserFilters } from '../services/user.service';
import { AddUser } from './add-user/add-user';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../types/user';
import { EditUser } from './edit-user/edit-user';

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {
  users: User[] = [];
  loading = true;
  errorMessage = '';
  currentPage: number = 1; 
  itemsPerPage: number = 10;
  total: number = 0; 
  lastPage: number = 1;
  totalEntries: number = 0;
  noDataFound = false;
  
  filters: UserFilters = {
    page: 1,
    items: 10,
    keyword: '',
    roleId: ''
  };
  
  // Configuration des colonnes
  userColumns: DataTableColumn[] = [
    { key: 'username', label: 'Username', sortable: true, type: 'text', width: '17%' },
    { key: 'lastName', label: 'Nom', sortable: true, type: 'text', width: '17%' },
    { key: 'firstName', label: 'Prénom', sortable: true, type: 'text', width: '17%' },
    {
      key: 'roleName',
      label: 'Rôle',
      sortable: true,
      type: 'badge',
      width: '15%',
      badgeColors: {
        'Admin': 'badge-admin',
        'Technicien': 'badge-technicien',
        'Responsable': 'badge-responsable',
        'Ressource Humaine': 'badge-rh',
        'Aucun rôle': 'badge-default'
      }
    },
    {
      key: 'statut',
      label: 'Statut',
      sortable: true,
      type: 'badge',
      width: '15%',
      badgeColors: {
        'INACTIVE': 'status-en-attente',
        'ACTIVE': 'status-termine'
      }
    }
  ];

  userActions: DataTableAction[] = [
    {
      icon: 'icon-edit',
      label: 'Modifier',
      callback: (item: User) => this.editUser(item)
    }
  ];

  constructor(
    private usersService: UsersService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.noDataFound = false;
    
    console.log('Chargement avec filtres:', this.filters);
    
    this.usersService.getAllUser(this.filters).subscribe({
      next: (response) => {
        console.log('Réponse du serveur:', response);
        
        this.users = response.result.map((user: any) => ({
          ...user,
          nom: user.lastname, 
          prenom: user.firstname,
          roleName: user.role?.name || 'Aucun rôle',
          statut: user.statut?.toUpperCase() || 'INACTIF'
        }));
        
        this.total = response.total;
        this.totalEntries = response.total;
        this.currentPage = response.page;
        this.lastPage = response.lastPage;
        console.log('Données brutes reçues:', response.result);
        // Vérifier si c'est une recherche qui ne donne aucun résultat
        if (response.result.length === 0 && this.filters.keyword && this.filters.keyword.trim() !== '') {
          this.noDataFound = true;
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.errorMessage = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
        this.users = [];
        this.total = 0;
        this.totalEntries = 0;
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

  // 🔁 Ces valeurs doivent aussi être mises à jour manuellement :
  this.currentPage = params.page;
  this.itemsPerPage = params.limit;

  this.loadUsers();
}


  onSearch(keyword: string): void {
    this.filters.keyword = keyword;
    this.filters.page = 1;
    this.loadUsers();
  }

  onRoleFilter(roleId: string): void {
    this.filters.roleId = roleId;
    this.filters.page = 1;
    this.loadUsers();
  }

  editUser(user: User): void {
    const dialogRef = this.dialog.open(EditUser, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Utilisateur modifié:', result);
        this.loadUsers();
      }
    });
  }

  hideUser(user: User): void {
    const action = user.statut === 'ACTIF' ? 'désactiver' : 'activer';
    const message = `Êtes-vous sûr de vouloir ${action} ${user.lastName} ${user.firstName}?`;
    
    if (confirm(message)) {
      this.usersService.hideUser(user.id!).subscribe({
        next: (response) => {
          console.log('Statut de l\'utilisateur modifié:', response);
          this.loadUsers();
        },
        error: (error) => {
          console.error('Erreur lors du changement de statut:', error);
          this.errorMessage = 'Erreur lors du changement de statut de l\'utilisateur';
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${user.lastName} ${user.firstName}?`)) {
      this.usersService.deleteUser(user.id!).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
        }
      });
    }
  }

  onAddClicked(): void {
    const dialogRef = this.dialog.open(AddUser, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Utilisateur créé:', result);
        this.loadUsers();
      }
    });
  }

 onExportData(format: string): void {
  console.log('Export au format:', format);
  
  if (format === 'excel') {
    this.exportToExcelBackend();
  }
}

private exportToExcelBackend(): void {
  this.loading = true;
  
  this.usersService.exportToExcel(this.filters).subscribe({
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
  
  // Créez un nom de fichier avec la date actuelle
  const date = new Date().toISOString().split('T')[0];
  a.download = `users_export_${date}.xlsx`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
  onRowSelect(selectedRows: User[]): void {
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
    this.loadUsers();
  }
}