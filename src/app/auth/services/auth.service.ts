import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../../environments/environment.development';
import { PermissionsService } from '../../private/admin/services/permissions.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(this.checkTokenValidity());
  private apiUrl = environment.apiURL;
  private tokenExpirationTimer: any;
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'user_data';
  private userPermissions = new BehaviorSubject<string[]>([]);

  constructor(
    private http: HttpClient,
    private router: Router,
    private jwtHelper: JwtHelperService,
  ) {
    const storedPermissions = localStorage.getItem('user_permissions');
    if (storedPermissions) {
      this.userPermissions.next(JSON.parse(storedPermissions));
    }
  }

  login(username: string, password: string): Observable<{access_token: string}> {
  return this.http.post<{access_token: string}>(`${this.apiUrl}/login`, { username, password }).pipe(
    tap(response => {
      this.storeAuthData(response.access_token);
      localStorage.setItem('username', username);
      this.loggedIn.next(true);
    }),
    switchMap(response => {
      return this.fetchUserPermissions().pipe(
        map(() => response),
        catchError(error => {
          console.error('[AuthService] Error fetching permissions:', error);
          this.clearAuth();
          return throwError(() => error);
        })
      );
    }),
    catchError(error => {
      this.clearAuth();
      return throwError(() => this.handleAuthError(error));
    })
  );
}

 private fetchUserPermissions(): Observable<void> {
   const user = this.getCurrentUser();
    
    if (!user || !user.id) {
      return throwError(() => 'User not authenticated');
    }

   return this.http.get<any>(`${this.apiUrl}/users/${user.id}`).pipe(
      tap(userData => {
        const permissionMap: { [key: string]: string } = {
        'Créer un utilisateur': 'user.create',
        'Voir la liste des utilisateurs': 'user.view',
        'Supprimer un utilisateur': 'user.delete',
        'Modifier un utilisateur': 'user.edit',
        'Consulter historique des tâches': 'task.history',
        'Voir la liste des tâches': 'task.view',
        'Voir les détails de OR': 'or.detail',
        'Consulter les OR': 'or.view',
        'Modifier les options paramétrables': 'settings.options.edit',
        'Voir les paramètres système': 'settings.view',
        'Gérer Paramétres ': 'settings.manage',
        'Gérer Liste OR': 'or.list.manage',
        'Gérer Taches': 'task.manage',
        'Gérer Utilisateurs': 'user.manage',
        'Gérer Roles': 'role.manage',
        'Gérer Permissions': 'permissions.manage',
        'Voir la liste des Roles': 'role.view',
        'Voir la liste des Permissions': 'permissions.view',
        'Ajouter une permission main': 'permissions.create',
        'Ajouter une sous permission': 'souspermissions.create',
        'Ajouter un Role': 'role.create',
        'Modifier un Role': 'role.edit',
        'Voir la liste des techniciens': 'technicien.view'
      };

      const permissionsList = userData.role?.rolePermissions?.map((rp: any) => ({
          id: rp.permission.id,
          name: rp.permission.name
        })) || [];

      console.log('[AuthService] Simplified permissions list:', permissionsList);

      const permissionNames = permissionsList
          .map((p: any) => permissionMap[p.name])
          .filter((p: string | undefined) => !!p);

       this.userPermissions.next(permissionNames);
        localStorage.setItem('user_permissions', JSON.stringify(permissionNames));
      }),
      map(() => {}),
      catchError(error => {
        console.error('[AuthService] Error in fetchUserPermissions:', error);
        return throwError(() => error);
      })
    );
  }
 

getCurrentUser(): any {
  const token = this.getToken();
  if (!token) {
    return null;
  }

  if (this.jwtHelper.isTokenExpired(token)) {
    return null;
  }

  const decoded = this.jwtHelper.decodeToken(token);
  
  const storedPermissions = localStorage.getItem('user_permissions');
  const permissions = storedPermissions ? JSON.parse(storedPermissions) : [];

  return {
    id: decoded.sub,
    username: decoded.username || decoded.preferred_username,
    permissions: permissions
  };
}

// Ajoutez aussi des logs dans les méthodes de permission
hasPermission(permission: string): boolean {
  const hasPerm = this.userPermissions.getValue().includes(permission);
  return hasPerm;
}

hasAnyPermission(permissions: string[]): boolean {
  const userPermissions = this.userPermissions.getValue();
  const hasAny = permissions.some(p => userPermissions.includes(p));
  return hasAny;
}

  getUserPermissions(): Observable<string[]> {
    return this.userPermissions.asObservable();
  }
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
logout(redirect: boolean = true): void {
  localStorage.removeItem(this.TOKEN_KEY);
  localStorage.removeItem(this.USER_KEY);
  localStorage.removeItem('user_permissions');
  localStorage.removeItem('username');

  this.loggedIn.next(false);
  this.userPermissions.next([]); 

  if (redirect) {
    this.router.navigate(['/auth/login']);
  }
   if (this.tokenExpirationTimer) {
        clearTimeout(this.tokenExpirationTimer);
    }
    console.clear(); 
}

  refreshToken(): Observable<string> {
    return this.http.post<{access_token: string}>(`${this.apiUrl}/refresh`, {}).pipe(
      tap(response => {
        this.storeAuthData(response.access_token);
        this.autoLogout();
      }),
      map(response => response.access_token),
      catchError(error => {
        this.logout();
        return throwError(() => 'Session expired. Please login again.');
      })
    );
  }

  private storeAuthData(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    // Optionally store user data if your token contains it
    const user = this.jwtHelper.decodeToken(token);
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  checkTokenValidity(): boolean {
    const token = this.getToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  private autoLogout(): void {
    const token = this.getToken();
    if (!token) return;

    const expirationDate = this.jwtHelper.getTokenExpirationDate(token);
    if (!expirationDate) return;

    const expiresIn = expirationDate.getTime() - new Date().getTime();
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expiresIn);
  }

  private handleAuthError(error: any): string {
    switch (error.status) {
      case 400:
        return error.error?.message || 'Invalid request';
      case 401:
        this.logout(false);
        return error.error?.message || 'Invalid credentials';
      case 403:
        this.logout(false);
        return 'You are not authorized to access this resource';
      case 404:
        return 'Service not found';
      case 500:
        return 'Server error occurred';
      default:
        return error.error?.message || 'An unexpected error occurred';
    }
  }
}