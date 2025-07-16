import { Component } from '@angular/core';
import { DataTableAction, DataTableColumn } from '../../../shared/datatable/datatable';
import { MatDialog } from '@angular/material/dialog';
import { TechDetails } from '../tech-details/tech-details';
import { UsersService } from '../../admin/services/user.service';
import * as XLSX from 'xlsx';
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

  constructor(
    private dialog: MatDialog,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.loadTechniciens();
  }

// Dans technicien.ts
loadTechniciens(): void {
  this.loading = true;
  const filters = { page: 1, limit: 10000 };

  this.usersService.getAllUser(filters).subscribe({
    next: (response) => {
      if (response?.data && Array.isArray(response.data)) {
        this.techniciens = response.data
          .filter(user => user.role?.name === 'Technicien')
          .map(tech => ({
            id: tech.id,
            nom: tech.nom || '',
            prenom: tech.prenom || '',
            username: tech.username,
            statut: tech.statut ? tech.statut.toUpperCase() : 'INACTIF' // Conversion en majuscules
          }));
        
        console.log('Techniciens formatés:', this.techniciens);
      } else {
        this.techniciens = [];
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('Erreur:', err);
      this.errorMessage = 'Erreur lors du chargement';
      this.loading = false;
    }
  });
}

// Et dans la méthode viewDetails:
viewDetails(technicien: any): void {
  // Prepare data for the modal
  const technicienInfo = {
    id: technicien.id,
    nom: technicien.nom,
    prenom: technicien.prenom,
    username: technicien.username,
    status: technicien.statut // On garde la valeur originale (en majuscules)
  };

  // Open the dialog
  const dialogRef = this.dialog.open(TechDetails, {
    width: '800px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    disableClose: false,
    hasBackdrop: true,
    backdropClass: 'transparent-backdrop',
    panelClass: 'modal-panel',
    data: {
      technicien: technicienInfo
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    console.log('Dialog fermé', result);
  });
}
  // Table columns configuration
 columns: DataTableColumn[] = [
  { key: 'nom', label: 'Nom', type: 'text', width: '20%' }, // Réduit de 20% à 15%
  { key: 'prenom', label: 'Prénom', type: 'text', width: '20%' }, // Réduit de 20% à 15%
  { key: 'username', label: 'Nom d\'utilisateur', type: 'text', width: '20%' },
  { 
    key: 'statut', 
    label: 'STATUT', 
    type: 'badge', 
    width: '20%', // Ajout d'une largeur fixe
    badgeColors: {
      'INACTIF': 'status-en-attente',
      'ACTIF': 'status-termine'
    }
  },
];

  // Table actions
  actions: DataTableAction[] = [
    {
      icon: 'icon-eye',
      label: 'Voir détails',
      callback: (item) => this.viewDetails(item)
    }
  ];

  // Datatable events
  onRowSelect(selectedRows: any[]) {
    console.log('Selected rows:', selectedRows);
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
      ...this.techniciens.map(t => [t.nom, t.prenom, t.username, t.statut])
    ];

    // Créer un workbook
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Techniciens');

    // Générer le fichier Excel
    XLSX.writeFile(wb, 'Techniciens.xlsx');
  }

  onFilterChange(filters: any) {
    console.log('Filters changed:', filters);
  }
}