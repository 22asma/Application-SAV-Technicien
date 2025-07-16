import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(!!this.getToken());
  private apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<{access_token: string}> {
    return this.http.post<{access_token: string}>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        this.storeToken(response.access_token);
        this.loggedIn.next(true);
      }),
      catchError(error => {
        this.clearAuth();
        return throwError(() => this.handleAuthError(error));
      })
    );
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  logout(): void {
    this.clearAuth();
    this.loggedIn.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private storeToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  private clearAuth(): void {
    localStorage.removeItem('access_token');
  }

  private handleAuthError(error: any): string {
    if (error.status === 401) {
      return 'Invalid username or password';
    }
    return error.error?.message || 'An unexpected error occurred';
  }
}