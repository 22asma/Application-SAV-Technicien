// Modifications dans datatable.component.ts

import { Component, Input, Output, EventEmitter, OnInit, SimpleChanges, HostListener, ElementRef } from '@angular/core';
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
  statusFilter?: string;
  dateRange?: {
    start?: Date | null;
    end?: Date | null;
  };
}

export interface StatusFilterOption {
  value: string;
  label: string;
  count?: number;
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
  @Input() serverSideSearch: boolean = true; 
  @Input() statusFilterOptions: StatusFilterOption[] = [];
  @Input() dateRangeFilterEnabled: boolean = true;
  @Input() showDateFilter: boolean = false;
  @Input() searchValue: string = '';

  @Output() addClicked = new EventEmitter<void>();
  @Output() rowSelect = new EventEmitter<any[]>();
  @Output() tabChange = new EventEmitter<string>();
  @Output() exportData = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<PaginationParams>();
  @Output() statusFilter = new EventEmitter<string[]>();
  @Output() dateRangeFilter = new EventEmitter<{start: Date|null, end: Date|null}>();
  @Output() searchCleared = new EventEmitter<void>();
  activeTab: string = '';
  paginatedData: any[] = [];
  filteredData: any[] = [];
  searchQuery: string = ''; 
  private searchTimeout: any;
  showStatusFilter: boolean = false;
  selectedStatuses: string[] = [];
  dateRange: { start: Date | null, end: Date | null } = { start: null, end: null };

  constructor(private translate: TranslateService,private elementRef: ElementRef) {}

  ngOnInit() {
    this.searchQuery = this.searchValue || '';
    this.initializeData();
    this.initializeFilters();
  }

  initializeFilters() {
    if (this.tabs.length > 0) {
      this.activeTab = this.tabs[0].key;
    }
  }

  applyDateFilter() {
    this.currentPage = 1;
    this.emitPageChange();
    this.showDateFilter = false;
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

  // Méthode pour appliquer le filtre avec debounce
applyFilterWithDebounce() {
  if (this.serverSideSearch) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilter();
    }, 500);
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

 toggleStatusFilter() {
  this.showStatusFilter = !this.showStatusFilter;
  // Ferme l'autre filtre si ouvert
  if (this.showStatusFilter && this.showDateFilter) {
    this.showDateFilter = false;
  }
} 
  toggleDateRangeFilter() {
    this.showDateFilter = !this.showDateFilter;
    if (this.showDateFilter && this.showStatusFilter) {
      this.showStatusFilter = false;
    }
  }

  clearDateRangeFilter() {
    this.dateRange = { start: null, end: null };
    this.applyDateRangeFilter();
  }

// Ajoutez cette méthode pour gérer le filtre de statut multiple :
applyStatusFilterMultiple() {
  this.statusFilter.emit(this.selectedStatuses);
  this.showStatusFilter = false;
}


onStatusChange(status: string, isChecked: boolean) {
  if (isChecked) {
    if (!this.selectedStatuses.includes(status)) {
      this.selectedStatuses.push(status);
    }
  } else {
    this.selectedStatuses = this.selectedStatuses.filter(s => s !== status);
  }
  console.log('Statuts sélectionnés:', this.selectedStatuses);
}

// Ajoutez cette méthode pour vérifier si un statut est sélectionné :
isStatusSelected(status: string): boolean {
  return this.selectedStatuses.includes(status);
}

// Modifiez toggleStatusSelection pour supporter la sélection multiple :
toggleStatusSelection(status: string) {
  if (this.selectedStatuses.includes(status)) {
    this.selectedStatuses = this.selectedStatuses.filter(s => s !== status);
  } else {
    this.selectedStatuses.push(status);
  }
  console.log('Statuts sélectionnés après toggle:', this.selectedStatuses);
}

applyStatusFilter() {
  this.currentPage = 1;
  this.statusFilter.emit([...this.selectedStatuses]);
  this.emitPageChange();
  this.showStatusFilter = false; // Ferme le menu après application
}
// Modifiez clearStatusFilter :
clearStatusFilter() {
  this.selectedStatuses = [];
  this.statusFilter.emit([]);
  this.applyStatusFilter();
}

ngOnChanges(changes: SimpleChanges): void {
  if (changes['data'] || changes['entriesPerPage'] || changes['currentPage'] || changes['totalEntries']) {
    this.initializeData();
  }
  
  // Synchronise la valeur de recherche avec le parent
  if (changes['searchValue']) {
    this.searchQuery = this.searchValue || '';
  }
}

private emitPageChange() {
  const params: PaginationParams = {
    page: this.currentPage,
    limit: this.entriesPerPage,
    searchQuery: this.searchQuery.trim() || undefined,
    activeTab: this.activeTab,
    statusFilter: this.selectedStatuses.length > 0 ? this.selectedStatuses.join(',') : undefined,
    dateRange: (this.dateRange.start || this.dateRange.end) ? {
      start: this.dateRange.start || undefined,
      end: this.dateRange.end || undefined
    } : undefined
  };
  this.pageChange.emit(params);
}

// Méthode pour appliquer le filtre immédiatement
applyFilter() {
  if (this.serverSideSearch) {
    this.currentPage = 1;
    this.emitPageChange();
  } else {
    this.applyLocalFilter();
  }
}

clearSearch() {
  this.searchQuery = '';
  this.applyFilter();
  // Émettez un événement pour notifier le parent
  this.searchCleared.emit();
}
// Corrigez la méthode applyDateRangeFilter :
applyDateRangeFilter() {
  this.currentPage = 1;
  this.dateRangeFilter.emit(this.dateRange);
  this.emitPageChange();
  this.showDateFilter = false;
}

@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
  if (!this.elementRef.nativeElement.contains(event.target)) {
    this.showStatusFilter = false;
    this.showDateFilter = false;
  }
}
}