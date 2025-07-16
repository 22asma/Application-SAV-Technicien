import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  baseUrl = 'http://localhost:3000/historique'; // Adaptez selon votre URL backend

  constructor(private http: HttpClient) { }

  getTechnicianHistoryToday(technicianId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/today/${technicianId}`);
  }

}