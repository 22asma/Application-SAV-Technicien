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
  startDate?: string;
  endDate?: string;
  OrStatut?: string[];
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

    // Filtre par mot-clé
    if (filters.keyword) {
      params = params.set('keyword', filters.keyword);
    }
    
    // Filtre par statut unique (pour compatibilité)
    if (filters.statut) {
      params = params.set('OrStatuts', filters.statut);
    }

    // Filtre par statuts multiples (nouveau)
    if (filters.OrStatut && filters.OrStatut.length > 0) {
      // Le backend attend OrStatuts comme paramètre (avec "s")
      filters.OrStatut.forEach(statut => {
        params = params.append('OrStatuts', statut);
      });
    }

    // Filtres de dates
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }

    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    console.log('Paramètres envoyés au backend:', params.toString());

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
    
    // Gestion des statuts pour l'export
    if (filters.statut) {
      params = params.set('OrStatuts', filters.statut);
    }
    if (filters.OrStatut && filters.OrStatut.length > 0) {
      filters.OrStatut.forEach(statut => {
        params = params.append('OrStatuts', statut);
      });
    }

    // Filtres de dates pour l'export
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

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