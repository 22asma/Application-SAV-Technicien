import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../types/user';
import { catchError, Observable } from 'rxjs';
import { Role } from '../types/role';

export interface PaginatedUsersResponse {
  data: User[];
  total: number;
  page: number;
  lastPage: number;
}

export interface UserFilters {
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
export class UsersService {
  baseUrl = 'http://localhost:3000';

  constructor(private httpclient: HttpClient) { }

  // Méthode mise à jour pour supporter les filtres
  getAllUser(filters: UserFilters = {}): Observable<PaginatedUsersResponse> {
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

    return this.httpclient.get<PaginatedUsersResponse>(`${this.baseUrl}/users`, { params });
  }

  // Méthode originale maintenue pour compatibilité
  getAllUserSimple(page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.httpclient.get<any>(`${this.baseUrl}/users`, { params });
  }

  // Méthode corrigée pour "masquer" un utilisateur (changer son statut)
  hideUser(id: string): Observable<any> {
    return this.httpclient.patch(`${this.baseUrl}/users/${id}/masquer`, {}).pipe(
      catchError(error => {
        console.error('Erreur lors du masquage de l\'utilisateur:', error);
        throw error;
      })
    );
  }

  // Méthode pour supprimer définitivement (si nécessaire)
  deleteUser(id: string): Observable<any> {
    return this.httpclient.delete(`${this.baseUrl}/users/${id}`);
  }

  addUser(user: User) {
    return this.httpclient.post(this.baseUrl + '/users', user);
  }

  editUser(id: string, userData: any): Observable<User> {
    // Ajoutez un log pour vérifier ce qui est envoyé
    console.log('Envoi au backend:', { id, userData });
    
    return this.httpclient.put<User>(`${this.baseUrl}/users/${id}`, userData).pipe(
      catchError(error => {
        console.error('Erreur détaillée:', error);
        throw error; // Rejette l'erreur pour le composant
      })
    );
  }

  getUserById(id: string) {
    return this.httpclient.get<User>(this.baseUrl + '/users/' + id);
  }

  addPermissionsToUser(id: string, user: User) {
    return this.httpclient.put(this.baseUrl + '/users/' + id + '/add-permissions', user);
  }
}