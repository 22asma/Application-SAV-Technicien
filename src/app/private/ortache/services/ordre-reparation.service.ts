import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ORinterface } from '../types/ORinterface';
export interface PaginatedOrdreReparationsResponse {
  data: ORinterface[];
  total: number;
  page: number;
  lastPage: number;
}

export interface OrdreReparationFilters {
  page?: number;
  limit?: number;
  searchQuery?: string;
  dateFilter?: string;
  monthFilter?: string;
  yearFilter?: string;
  activeTab?: string;
}
@Injectable({
  providedIn: 'root'
})
export class ORService {
  baseUrl = 'http://localhost:3000';

  constructor(private httpclient: HttpClient) { }

  getAllOrdreReparation(filters: OrdreReparationFilters = {}): Observable<PaginatedOrdreReparationsResponse> {
      let params = new HttpParams();
      
      // Paramètres de pagination (avec valeurs par défaut)
      params = params.set('page', (filters.page || 1).toString());
      params = params.set('limit', (filters.limit || 10).toString());
      
      // Ajouter les filtres de recherche s'ils existent
      if (filters.searchQuery && filters.searchQuery.trim()) {
        params = params.set('search', filters.searchQuery.trim());
      }
      if (filters.dateFilter) {
        params = params.set('dateFilter', filters.dateFilter);
      }
      if (filters.monthFilter) {
        params = params.set('monthFilter', filters.monthFilter);
      }
      if (filters.yearFilter) {
        params = params.set('yearFilter', filters.yearFilter);
      }
      if (filters.activeTab) {
        params = params.set('statut', filters.activeTab);
      }
  
      return this.httpclient.get<PaginatedOrdreReparationsResponse>(`${this.baseUrl}/ordre-reparation`, { params });
    }
  
    // Méthode originale maintenue pour compatibilité
    getAllOrdreReparationSimple(page: number = 1, limit: number = 10): Observable<any> {
      const params = new HttpParams()
        .set('page', page.toString())
        .set('limit', limit.toString());
      
      return this.httpclient.get<any>(`${this.baseUrl}/ordre-reparation`, { params });
    }

  getORById(id: string) {
    return this.httpclient.get<ORinterface>(`${this.baseUrl}/ordre-reparation/${id}`);
  }
}