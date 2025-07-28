import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, tap } from 'rxjs';
import { ORinterface } from '../types/ORinterface';
import { environment } from '../../../../environments/environment.development';

export interface PaginatedOrdreReparationsResponse {
  result: ORinterface[]; 
  total: number;
  page: number;
  lastPage: number;
  nextPage?: number | null;
}

export interface OrdreReparationFilters {
  page?: number;
  items?: number; 
  searchQuery?: string;
  statut?: string;
  keyword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ORService {
  private baseUrl = `${environment.apiURL}/RepairOrders`;

  constructor(private http: HttpClient) { }

  getAllOR(filters: OrdreReparationFilters = {}): Observable<PaginatedOrdreReparationsResponse> {
    let params = new HttpParams();
    
    // Paramètres de pagination
    const page = filters.page || 1;
    const items = filters.items || 10;
    
    params = params.set('page', page.toString());
    params = params.set('items', items.toString());

    if (filters.keyword) {
    params = params.set('keyword', filters.keyword);
    }
    
    if (filters.statut) {
      params = params.set('statut', filters.statut);
    }

    return this.http.get<PaginatedOrdreReparationsResponse>(this.baseUrl, { params }).pipe(
      tap(response => {
      console.log('Réponse pagination complète OR:', response);
      console.log('Détail pagination :', {
        result: response.result,
        total: response.total,
        page: response.page,
        lastPage: response.lastPage,
        nextPage: response.nextPage
      });
    }),
      catchError(error => {
        console.error('Erreur chargement OR:', error);
        throw error;
      })
    );
  }

  getORById(id: string): Observable<ORinterface> {
    return this.http.get<ORinterface>(`${this.baseUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Erreur détail OR:', error);
        throw error;
      })
    );
  }

  exportToExcel(filters: OrdreReparationFilters = {}): Observable<Blob> {
  let params = new HttpParams();

  // Paramètres de base
  if (filters.page) params = params.set('page', filters.page.toString());
  if (filters.items) params = params.set('items', filters.items.toString());
  
  // Filtres supplémentaires
  if (filters.keyword) params = params.set('keyword', filters.keyword);
  if (filters.statut) params = params.set('statut', filters.statut);

  return this.http.get(`${this.baseUrl}/export`, { 
    params,
    responseType: 'blob'
  }).pipe(
    catchError(error => {
      console.error('Erreur export OR:', error);
      throw error;
    })
  );
}
}