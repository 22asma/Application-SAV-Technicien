import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'badge' | 'date' | 'number' | 'actions' | 'client';
  width?: string;
  badgeColors?: { [key: string]: string };
}

export interface DataTableAction {
  icon: string;
  label: string;
  callback: (item: any) => void;
  condition?: (item: any) => boolean;
}

export interface DataTableTab {
  key: string;
  label: string;
  count?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  searchQuery?: string;
  dateFilter?: string;
  monthFilter?: string;
  yearFilter?: string;
  activeTab?: string;
}

@Component({
  selector: 'app-datatable',
  standalone: true,
  templateUrl: './datatable.html',
  styleUrl: './datatable.css',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class datatable implements OnInit {
  @Input() data: any[] = [];
  @Input() columns: DataTableColumn[] = [];
  @Input() actions: DataTableAction[] = [];
  @Input() tabs: DataTableTab[] = [];
  @Input() showSearch: boolean = true;
  @Input() showFilters: boolean = true;
  @Input() showExport: boolean = true;
  @Input() showPagination: boolean = true;
  @Input() entriesPerPageOptions: number[] = [10, 25, 50, 100];
  @Input() showAddButton: boolean = false;
  
  // Propriétés pour la pagination backend
  @Input() totalEntries: number = 0;
  @Input() currentPage: number = 1;
  @Input() lastPage: number = 1;
  @Input() useBackendPagination: boolean = false;
  
  @Output() addClicked = new EventEmitter<void>();
  @Output() rowSelect = new EventEmitter<any[]>();
  @Output() tabChange = new EventEmitter<string>();
  @Output() exportData = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<PaginationParams>();

  // Variables internes
  filteredData: any[] = [];
  paginatedData: any[] = [];
  searchQuery: string = '';
  activeTab: string = '';
  entriesPerPage: number = 10;

  // Filtres
  dateFilter: string = '';
  monthFilter: string = '';
  yearFilter: string = '';
  uniqueDates: string[] = [];
  months = [
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];
  years: number[] = [];

  ngOnInit() {
    this.initializeData();
    this.initializeFilters();
  }

  initializeData() {
    if (this.useBackendPagination) {
      // Pour la pagination backend, on utilise directement les données reçues
      this.paginatedData = [...this.data];
    } else {
      // Pour la pagination frontend (comportement original)
      this.filteredData = [...this.data];
      this.totalEntries = this.data.length;
      this.updatePagination();
    }
  }

  initializeFilters() {
    if (!this.useBackendPagination) {
      // Initialiser les filtres de date seulement pour la pagination frontend
      this.uniqueDates = [...new Set(this.data.map(item => item.dateCreation))];
      this.years = [...new Set(this.data.map(item => new Date(item.dateCreation).getFullYear()))];
    }
    
    // Initialiser le premier onglet
    if (this.tabs.length > 0) {
      this.activeTab = this.tabs[0].key;
    }
  }

  getMinCurrentPageEntries(): number {
    if (this.useBackendPagination) {
      return Math.min(this.currentPage * this.entriesPerPage, this.totalEntries);
    }
    return Math.min(this.currentPage * this.entriesPerPage, this.totalEntries);
  }

   onSearchClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Méthode pour gérer le focus sur la barre de recherche
  onSearchFocus(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Dans votre datatable.component.ts, modifiez la méthode applyFilter() :

applyFilter() {
  if (this.useBackendPagination) {
    // Pour la pagination backend, émettre l'événement de changement de page
    this.currentPage = 1;
    this.emitPageChange();
  } else {
    // Comportement pour la pagination frontend
    this.filteredData = this.data.filter(item => {
      let matches = true;

      // Filtre de recherche
      if (this.searchQuery && this.searchQuery.trim()) {
        const searchLower = this.searchQuery.toLowerCase();
        matches = matches && Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        );
      }

      // Filtre par onglet
      if (this.activeTab) {
        matches = matches && item.statut === this.activeTab;
      }

      return matches;
    });

    this.totalEntries = this.filteredData.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Émettre l'événement de changement de filtre
  this.filterChange.emit({
    searchQuery: this.searchQuery,
    activeTab: this.activeTab
  });
}

// Assurez-vous que cette méthode existe et fonctionne correctement
updatePagination() {
  if (!this.useBackendPagination) {
    const startIndex = (this.currentPage - 1) * this.entriesPerPage;
    const endIndex = startIndex + this.entriesPerPage;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
  }
}

  // Alternative avec debounce pour améliorer les performances
  private searchTimeout: any;
  
  applyFilterWithDebounce() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilter();
    }, 300); // Délai de 300ms
  }

  resetFilters() {
    this.searchQuery = '';
    this.dateFilter = '';
    this.monthFilter = '';
    this.yearFilter = '';
    this.applyFilter();
  }

  onTabChange(tabKey: string) {
    this.activeTab = tabKey;
    this.applyFilter();
    this.tabChange.emit(tabKey);
  }

  onEntriesPerPageChange() {
    this.currentPage = 1;
    if (this.useBackendPagination) {
      this.emitPageChange();
    } else {
      this.updatePagination();
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    if (this.useBackendPagination) {
      this.emitPageChange();
    } else {
      this.updatePagination();
    }
  }

  private emitPageChange() {
    const params: PaginationParams = {
      page: this.currentPage,
      limit: this.entriesPerPage,
      searchQuery: this.searchQuery,
      dateFilter: this.dateFilter,
      monthFilter: this.monthFilter,
      yearFilter: this.yearFilter,
      activeTab: this.activeTab
    };
    this.pageChange.emit(params);
  }

  getTotalPages(): number {
    if (this.useBackendPagination) {
      return this.lastPage;
    }
    return Math.ceil(this.totalEntries / this.entriesPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getTabCount(tabKey: string): number {
    if (this.useBackendPagination) {
      // Pour la pagination backend, retourner le count depuis les tabs
      const tab = this.tabs.find(t => t.key === tabKey);
      return tab?.count || 0;
    }
    return this.data.filter(item => item.statut === tabKey).length;
  }

  getCellValue(item: any, column: DataTableColumn): any {
    return item[column.key];
  }

  getBadgeClass(value: string, column: DataTableColumn): string {
    if (column.badgeColors && column.badgeColors[value]) {
      return column.badgeColors[value];
    }
    // Fallback si pas de configuration personnalisée
    return `status-${value.toLowerCase().replace(' ', '-')}`;
  }

  executeAction(action: DataTableAction, item: any) {
    action.callback(item);
  }

  shouldShowAction(action: DataTableAction, item: any): boolean {
    return action.condition ? action.condition(item) : true;
  }

  exportToExcel() {
    this.exportData.emit('excel');
  }
}