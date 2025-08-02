import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../types/user';
import { catchError, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

export interface PaginatedUsersResponse {
 result: User[]; 
  total: number;
  page: number;
  lastPage: number;
  nextPage?: number | null;
}

export interface UserFilters {
  page?: number;
  items?: number; 
  roleId?: string;
  keyword?: string;
}

export interface ChangePasswordDto {
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private baseUrl = environment.apiURL;

  constructor(private httpclient: HttpClient) { }

 getAllUser(filters: UserFilters = {}): Observable<PaginatedUsersResponse> {
  let params = new HttpParams();

  const page = filters.page || 1;
  const items = filters.items || 10;

  params = params.set('page', page.toString());
  params = params.set('items', items.toString());

  if (filters.roleId) {
    params = params.set('roleId', filters.roleId);
  }

  if (filters.keyword) {
    params = params.set('keyword', filters.keyword);
  }

  console.log('Requête pagination (params):', params.toString());

  return this.httpclient.get<PaginatedUsersResponse>(`${this.baseUrl}/users`, { params }).pipe(
    tap(response => {
      console.log('Réponse pagination complète :', response);
      console.log('Détail pagination :', {
        result: response.result,
        total: response.total,
        page: response.page,
        lastPage: response.lastPage,
        nextPage: response.nextPage
      });
    }),
    catchError(error => {
      console.error('Erreur pagination:', error);
      throw error;
    })
  );
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
  console.log('Envoi au backend:', { id, userData });
  
  return this.httpclient.patch<User>(`${this.baseUrl}/users/${id}`, userData).pipe(
    catchError(error => {
      console.error('Erreur détaillée:', error);
      throw error;
    })
  );
}

  getUserById(id: string) {
    return this.httpclient.get<User>(this.baseUrl + '/users/' + id);
  }

  addPermissionsToUser(id: string, user: User) {
    return this.httpclient.put(this.baseUrl + '/users/' + id + '/add-permissions', user);
  }

changePassword(userId: string, dto: ChangePasswordDto): Observable<any> {
    return this.httpclient.patch(`${this.baseUrl}/users/${userId}/change-password`, dto).pipe(
      catchError(error => {
        console.error('Erreur lors du changement de mot de passe:', error);
        throw error;
      })
    );
  }

  getTechniciens(filters: UserFilters = {}): Observable<PaginatedUsersResponse> {
    let params = new HttpParams();
    
    const page = filters.page || 1;
    const items = filters.items || 10;
    
    params = params.set('page', page.toString());
    params = params.set('items', items.toString());
    
    // Paramètre exact comme dans votre curl
    params = params.set('isTechnician', 'true'); // Notez le 'true' en string

    if (filters.keyword) {
      params = params.set('keyword', filters.keyword);
    }

    return this.httpclient.get<PaginatedUsersResponse>(`${this.baseUrl}/users`, { params }).pipe(
      tap(response => {
        console.log('Techniciens reçus:', response.result);
        // Vérifiez que les données contiennent bien isTechnician: true
        response.result.forEach(tech => {
          if (!tech.isTechnician) {
            console.warn('Utilisateur non technicien reçu:', tech);
          }
        });
      }),
      catchError(error => {
        console.error('Erreur:', error);
        throw error;
      })
    );
}

exportToExcel(filters: UserFilters = {}): Observable<Blob> {
  let params = new HttpParams();

  const page = filters.page || 1;
  const items = filters.items || 10;

  params = params.set('page', page.toString());
  params = params.set('items', items.toString());

  if (filters.roleId) {
    params = params.set('roleId', filters.roleId);
  }

  if (filters.keyword) {
    params = params.set('keyword', filters.keyword);
  }

  return this.httpclient.get(`${this.baseUrl}/users/export`, { 
    params,
    responseType: 'blob' // Important pour recevoir un fichier
  }).pipe(
    catchError(error => {
      console.error('Erreur lors de l\'export:', error);
      throw error;
    })
  );
}

exportTechniciensToExcel(filters: UserFilters = {}): Observable<Blob> {
  let params = new HttpParams();

  const page = filters.page || 1;
  const items = filters.items || 10;
  
  params = params.set('page', page.toString());
  params = params.set('items', items.toString());
  
  // Utiliser le filtre isTechnician au lieu du rôle
  params = params.set('isTechnician', 'true');

  if (filters.keyword) {
    params = params.set('keyword', filters.keyword);
  }

  return this.httpclient.get(`${this.baseUrl}/users/export`, { 
    params,
    responseType: 'blob'
  }).pipe(
    catchError(error => {
      console.error('Erreur lors de l\'export des techniciens:', error);
      throw error;
    })
  );
}

}