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

  // Configuration des colonnes
  userColumns: DataTableColumn[] = [
    { key: 'nom', label: 'Nom', sortable: true, type: 'text', width: '15%' },
    { key: 'prenom', label: 'Prénom', sortable: true, type: 'text', width: '15%' },
    { key: 'username', label: 'Username', sortable: true, type: 'text', width: '20%' },
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
        'INACTIF': 'status-en-attente',
        'ACTIF': 'status-termine'
      }
    }
  ];

  userActions: DataTableAction[] = [
    {
      icon: 'icon-edit',
      label: 'Modifier',
      callback: (item: User) => this.editUser(item)
    },
    {
      icon: 'icon-trash',
      label: 'Désactiver',
      callback: (item: User) => this.hideUser(item)
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
    
    // Récupérer tous les utilisateurs sans pagination
    const filters: UserFilters = {
      page: 1,
      limit: 10000 // Limite élevée pour récupérer tous les utilisateurs
    };
    
    this.usersService.getAllUser(filters).subscribe({
      next: (response) => {
        console.log('Réponse du backend:', response);
        
        if (response && response.data && Array.isArray(response.data)) {
          this.users = response.data.map((user: any) => ({
            ...user,
            roleName: user.role?.name || 'Aucun rôle'
          }));
        } else {
          console.error('Format de réponse inattendu:', response);
          this.users = [];
        }
        
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
        console.error('Error loading users:', error);
      }
    });
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

  // Méthode pour "masquer" un utilisateur (changer son statut)
  hideUser(user: User): void {
    const action = user.statut === 'ACTIF' ? 'désactiver' : 'activer';
    const message = `Êtes-vous sûr de vouloir ${action} ${user.nom} ${user.prenom}?`;
    
    if (confirm(message)) {
      this.usersService.hideUser(user.id!).subscribe({
        next: (response) => {
          console.log('Statut de l\'utilisateur modifié:', response);
          this.loadUsers(); // Recharger la liste pour voir le changement
        },
        error: (error) => {
          console.error('Erreur lors du changement de statut:', error);
          this.errorMessage = 'Erreur lors du changement de statut de l\'utilisateur';
        }
      });
    }
  }

  // Méthode pour supprimer définitivement (si nécessaire)
  deleteUser(user: User): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${user.nom} ${user.prenom}?`)) {
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
      this.exportToExcel(this.users);
    }
  }

  private exportToExcel(data: User[]): void {
    // Créer les en-têtes
    const headers = this.userColumns.map(col => col.label);
    
    // Créer les données
    const rows = data.map(user => 
      this.userColumns.map(col => {
        const value = user[col.key as keyof User];
        return value ? value.toString() : '';
      })
    );
    
    // Créer le contenu CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onRowSelect(selectedRows: User[]): void {
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
}