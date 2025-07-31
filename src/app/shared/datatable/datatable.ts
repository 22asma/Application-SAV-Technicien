// Modifications dans datatable.component.ts

import { Component, Input, Output, EventEmitter, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  activeTab?: string;
  dateFilter?: DateFilterOptions;
}

export interface DateFilterOptions {
  day?: string;
  month?: string;
  year?: string;
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
    TranslateModule 
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
  @Input() entriesPerPage: number = 10;
  @Input() totalEntries: number = 0;
  @Input() currentPage: number = 1;
  @Input() lastPage: number = 1;
  @Input() showDateFilterButton: boolean = true;
  @Input() serverSideSearch: boolean = true; // Nouveau: pour indiquer si la recherche est côté serveur
  
  @Output() addClicked = new EventEmitter<void>();
  @Output() rowSelect = new EventEmitter<any[]>();
  @Output() tabChange = new EventEmitter<string>();
  @Output() exportData = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<PaginationParams>();

  activeTab: string = '';
  paginatedData: any[] = [];
  dateFilter: DateFilterOptions = {};
  showDateFilter: boolean = false;
  filteredData: any[] = [];
  searchQuery: string = '';
  private searchTimeout: any;
  
  months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];
  years = Array.from({length: 10}, (_, i) => new Date().getFullYear() - i);
  days = Array.from({length: 31}, (_, i) => (i + 1).toString());

  constructor(private translate: TranslateService) {}

  ngOnInit() {
    this.initializeData();
    this.initializeFilters();
  }

  initializeFilters() {
    if (this.tabs.length > 0) {
      this.activeTab = this.tabs[0].key;
    }
  }

  toggleDateFilter() {
    this.showDateFilter = !this.showDateFilter;
  }

  applyDateFilter() {
    this.currentPage = 1;
    this.emitPageChange();
    this.showDateFilter = false;
  }

  clearDateFilter() {
    this.dateFilter = {};
    this.applyDateFilter();
  }

  onTabChange(tabKey: string) {
    this.activeTab = tabKey;
    if (this.serverSideSearch) {
      this.applyFilter();
    } else {
      this.applyLocalFilter();
    }
    this.tabChange.emit(tabKey);
  }

  onEntriesPerPageChange() {
    this.currentPage = 1;
    this.emitPageChange();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.emitPageChange();
  }
  
  private emitPageChange() {
    const params: PaginationParams = {
      page: this.currentPage,
      limit: this.entriesPerPage,
      searchQuery: this.searchQuery.trim() || undefined,
      activeTab: this.activeTab,
      dateFilter: Object.keys(this.dateFilter).length ? this.dateFilter : undefined
    };
    console.log('Emission pagination:', params);
    this.pageChange.emit(params);
  }

  getTotalPages(): number {
    return this.lastPage;
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
    const tab = this.tabs.find(t => t.key === tabKey);
    return tab?.count || 0;
  }

  getCellValue(item: any, column: DataTableColumn): any {
    return item[column.key];
  }

  getBadgeClass(value: string, column: DataTableColumn): string {
    if (column.badgeColors && column.badgeColors[value]) {
      return column.badgeColors[value];
    }
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

  getPaginationInfo(): string {
    const start = (this.currentPage - 1) * this.entriesPerPage + 1;
    const end = Math.min(this.currentPage * this.entriesPerPage, this.totalEntries);
    
    return this.translate.instant('datatable.pagination_info', {
      start: start,
      end: end,
      total: this.totalEntries
    });
  }

  onSearchClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  onSearchFocus(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  getMinCurrentPageEntries(): number {
    return Math.min(this.currentPage * this.entriesPerPage, this.totalEntries);
  }
  
  // Méthode pour la recherche côté serveur (modifiée)
  applyFilter() {
    if (this.serverSideSearch) {
      this.currentPage = 1; 
      this.emitPageChange(); 
    } else {
      this.applyLocalFilter();
    }
  }

  // Méthode pour la recherche côté serveur avec debounce
  applyFilterWithDebounce() {
    if (this.serverSideSearch) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.applyFilter();
      }, 900); // Augmenté à 500ms pour plus de stabilité
    } else {
      this.applyLocalFilter();
    }
  }

  // Méthode pour le filtrage local (quand serverSideSearch = false)
  private applyLocalFilter() {
    let filtered = [...this.data];
    
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        return this.columns.some(column => {
          const value = item[column.key];
          return value && value.toString().toLowerCase().includes(query);
        });
      });
    }
    
    this.filteredData = filtered;
    this.totalEntries = filtered.length;
    this.updatePaginatedData();
  }

  private updatePaginatedData() {
    if (!this.serverSideSearch) {
      const startIndex = (this.currentPage - 1) * this.entriesPerPage;
      const endIndex = startIndex + this.entriesPerPage;
      this.paginatedData = this.filteredData.slice(startIndex, endIndex);
      this.lastPage = Math.ceil(this.totalEntries / this.entriesPerPage);
    } else {
      this.paginatedData = this.data;
    }
  }

  initializeData() {
    if (this.serverSideSearch) {
      this.paginatedData = this.data;
    } else {
      this.filteredData = [...this.data];
      this.totalEntries = this.data.length;
      this.updatePaginatedData();
    }
  }

  nngOnChanges(changes: SimpleChanges): void {
    if (
      changes['data'] || 
      changes['entriesPerPage'] || 
      changes['currentPage'] || 
      changes['totalEntries']
    ) {
      this.initializeData(); // met à jour le tableau et les infos affichées
    }
  }
}