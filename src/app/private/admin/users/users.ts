import { Component, OnInit } from '@angular/core';
import { DataTableAction, DataTableColumn, PaginationParams } from '../../../shared/datatable/datatable';
import { UsersService, UserFilters } from '../services/user.service';
import { AddUser } from './add-user/add-user';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../types/user';
import { EditUser } from './edit-user/edit-user';
import { TranslateService } from '@ngx-translate/core';
import { QrCode } from './qr-code/qr-code';

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
  searchValue: string = '';
  filters: UserFilters = {
    page: 1,
    items: 10,
    keyword: '',
    roleId: ''
  };
  
  // Initialize with empty arrays, will be populated after translations load
  userColumns: DataTableColumn[] = [];
  userActions: DataTableAction[] = [];
  isTranslationsLoaded = false;

  constructor(
    private usersService: UsersService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {
    this.translate.get('users.columns.username').subscribe(translation => {
    console.log('Translation loaded:', translation);
  });
  }

  async ngOnInit(): Promise<void> {
    // Wait for translations to load before initializing
    await this.initializeTranslations();
    this.loadUsers();
  }

  async initializeTranslations(): Promise<void> {
    try {
      // Ensure French language is loaded
      await this.translate.use('fr').toPromise();
      
      // Wait a bit more to ensure all translations are loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Initialize columns with translations
      this.userColumns = [
        { 
          key: 'username', 
          label: this.translate.instant('users.columns.username') || 'Username', 
          sortable: true, 
          type: 'text', 
          width: '14%' 
        },
        { 
          key: 'lastName', 
          label: this.translate.instant('users.columns.lastName') || 'Nom', 
          sortable: true, 
          type: 'text', 
          width: '15%' 
        },
        { 
          key: 'firstName', 
          label: this.translate.instant('users.columns.firstName') || 'Prénom', 
          sortable: true, 
          type: 'text', 
          width: '15%' 
        },
        {
          key: 'roleName',
          label: this.translate.instant('users.columns.role') || 'Rôle',
          sortable: true,
          type: 'badge',
          width: '15%',
          badgeColors: {
            'Admin': 'badge-admin',
            'Technicien': 'badge-technicien',
            'Responsable': 'badge-responsable',
            'Ressource Humaine': 'badge-rh',
            'Technicien Supérieur': 'badge-default'
          }
        },
        {
          key: 'isTechnician',
          label: this.translate.instant('users.columns.isTechnician') || 'Technicien',
          sortable: true,
          type: 'badge',
          width: '12%',
          badgeColors: {
            'true': 'badge-technician',
            'false': 'badge-not-technician'
          },
        },
        {
          key: 'statut',
          label: this.translate.instant('users.columns.status') || 'Statut',
          sortable: true,
          type: 'badge',
          width: '15%',
          badgeColors: {
            'INACTIVE': 'status-en-attente',
            'ACTIVE': 'status-termine'
          }
        }
      ];

      this.userActions = [
        {
          icon: 'icon-edit',
          label: this.translate.instant('users.actions.edit') || 'Modifier',
          callback: (item: User) => this.editUser(item)
        }
      ];

      this.isTranslationsLoaded = true;
      console.log('Translations initialized:', {
        username: this.translate.instant('users.columns.username'),
        lastName: this.translate.instant('users.columns.lastName')
      });
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback to default labels if translations fail
      this.initializeDefaultColumns();
    }
  }

  private initializeDefaultColumns(): void {
    this.userColumns = [
      { key: 'username', label: 'Username', sortable: true, type: 'text', width: '14%' },
      { key: 'lastName', label: 'Nom', sortable: true, type: 'text', width: '15%' },
      { key: 'firstName', label: 'Prénom', sortable: true, type: 'text', width: '15%' },
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
          'Technicien Supérieur': 'badge-default'
        }
      },
      {
        key: 'isTechnician',
        label: 'Technicien',
        sortable: true,
        type: 'badge',
        width: '12%',
        badgeColors: {
          'true': 'badge-technician',
          'false': 'badge-not-technician'
        },
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

    this.userActions = [
      {
        icon: 'icon-edit',
        label: 'Modifier',
        callback: (item: User) => this.editUser(item)
      }
    ];
  }

  getTranslatedRole(roleName: string): string {
    const rolesMap: {[key: string]: string} = {
      'Admin': this.translate.instant('users.roles.admin') || 'Admin',
      'Technicien': this.translate.instant('users.roles.technician') || 'Technicien',
      'Responsable': this.translate.instant('users.roles.manager') || 'Responsable',
      'Ressource Humaine': this.translate.instant('users.roles.hr') || 'Ressource Humaine',
      'Technicien Supérieur': this.translate.instant('users.roles.senior_technician') || 'Technicien Supérieur'
    };
    return rolesMap[roleName] || roleName;
  }
  
  // ... rest of your existing methods remain the same
  
  onPageChange(params: PaginationParams): void {
    console.log('Paramètres reçus:', params);
    this.filters = {
      ...this.filters,
      page: params.page,
      items: params.limit,
      keyword: params.searchQuery || ''
    };
    this.searchValue = params.searchQuery || '';
    this.currentPage = params.page;
    this.itemsPerPage = params.limit;
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
          statut: user.statut?.toUpperCase() || 'INACTIF',
          isTechnician: user.isTechnician || false
        }));
        
        this.total = response.total;
        this.totalEntries = response.total;
        this.currentPage = response.page;
        this.lastPage = response.lastPage;
        this.searchValue = this.filters.keyword || '';
        
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

  // Méthode pour gérer l'effacement de la recherche
  onSearchCleared(): void {
    this.searchValue = '';
    this.filters.keyword = '';
    this.filters.page = 1;
    this.currentPage = 1;
    this.noDataFound = false;
    this.loadUsers();
  }

clearSearch(): void {
  this.filters.keyword = '';
  this.filters.page = 1;
  this.noDataFound = false;
  this.loadUsers();
}

// 🔥 AJOUT : Méthode pour gérer l'effacement depuis le datatable
onSearchClear(): void {
  this.clearSearch();
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
  const action = user.statut === 'ACTIF' 
    ? this.translate.instant('users.actions.toggle_status.deactivate') 
    : this.translate.instant('users.actions.toggle_status.activate');
  
  const message = this.translate.instant(
    'users.confirm_status_change', 
    { action: action, name: `${user.lastName} ${user.firstName}` }
  );
  
  if (confirm(message)) {
    this.usersService.hideUser(user.id!).subscribe({
      next: (response) => {
        console.log('Statut de l\'utilisateur modifié:', response);
        this.loadUsers();
      },
      error: (error) => {
        console.error('Erreur lors du changement de statut:', error);
        this.errorMessage = this.translate.instant('users.errors.status_change');
      }
    });
  }
}

deleteUser(user: User): void {
  const message = this.translate.instant(
    'users.confirm_delete',
    { name: `${user.lastName} ${user.firstName}` }
  );
  
  if (confirm(message)) {
    this.usersService.deleteUser(user.id!).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.errorMessage = this.translate.instant('users.errors.delete');
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

handleBarcodeClick(user: any): void {
  console.log('Bouton code-barres cliqué pour l\'utilisateur:', user);
  
  if (!user) {
    console.error('Aucun utilisateur trouvé');
    return;
  }

  if (!this.dialog) {
    console.error('MatDialog non disponible');
    return;
  }

  try {
    const dialogRef = this.dialog.open(QrCode, {
      width: '350px',
      maxWidth: '90vw',
      panelClass: 'barcode-modal',
      data: { 
        badgeId: user.badgeId || user.id?.toString() || 'DEFAULT',
        userName: `${user.firstName || user.firstname || ''} ${user.lastName || user.lastname || ''}`.trim()
      }
    });

    dialogRef.afterClosed().subscribe({
      next: (result) => {
        console.log('Modal barcode fermé', result);
      },
      error: (err) => console.error('Erreur fermeture modal:', err)
    });

  } catch (error) {
    console.error('Erreur ouverture modal barcode:', error);
  }
}
}