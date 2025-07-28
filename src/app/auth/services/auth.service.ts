import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(this.checkTokenValidity());
  private apiUrl = environment.apiURL;
  private tokenExpirationTimer: any;
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'user_data';

  constructor(
    private http: HttpClient,
    private router: Router,
    private jwtHelper: JwtHelperService
  ) {}

  login(username: string, password: string): Observable<{access_token: string}> {
    return this.http.post<{access_token: string}>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        this.storeAuthData(response.access_token);
        localStorage.setItem('username', username);
        this.loggedIn.next(true);
        this.autoLogout();
      }),
      catchError(error => {
        this.clearAuth();
        return throwError(() => this.handleAuthError(error));
      })
    );
  }

  logout(redirect: boolean = true): void {
    localStorage.removeItem('access_token');
    this.loggedIn.next(false);
    if (redirect) {
      this.router.navigate(['/login']);
    }
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

 getCurrentUser(): any {
  const token = this.getToken();
  if (!token) {
    console.warn('Aucun token trouvé dans localStorage');
    return null;
  }

  if (this.jwtHelper.isTokenExpired(token)) {
    console.warn('Token expiré');
    return null;
  }

  const decoded = this.jwtHelper.decodeToken(token);
  console.log('Token décodé dans getCurrentUser:', decoded);

  // Extraction du rôle avec debug
  let role = decoded.role;
  if (!role) {
    console.warn('Rôle non trouvé dans la propriété "role"');
    
    if (decoded.realm_access?.roles) {
      role = decoded.realm_access.roles[0];
      console.warn('Rôle trouvé dans realm_access.roles');
    } else if (decoded.authorities) {
      role = decoded.authorities[0];
      console.warn('Rôle trouvé dans authorities');
    } else {
      role = 'ROLE_NON_TROUVE';
      console.error('Aucun rôle trouvé dans le token');
    }
  }

  const userData = {
    id: decoded.sub || decoded.userId || decoded.id,
    username: decoded.username || decoded.preferred_username,
    role: role,
    // Ajoutez toutes les autres propriétés du token pour debug
    _token_decoded: decoded // Temporaire pour debug
  };

  console.log('Données utilisateur extraites:', userData);
  return userData;
}

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
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