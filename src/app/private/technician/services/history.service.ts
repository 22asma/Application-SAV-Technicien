import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private baseUrl = environment.apiURL;

  constructor(private http: HttpClient) { }

  getTechnicianHistory(technicianId: string, startDate: string, endDate?: string): Observable<any> {
    let params = new HttpParams().set('startDate', startDate);
    
    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get(`${this.baseUrl}/activity/${technicianId}`, { params });
  }

  // Optionnel: garder une méthode simplifiée pour aujourd'hui
  getTechnicianHistoryToday(technicianId: string): Observable<any> {
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    return this.getTechnicianHistory(technicianId, today);
  }
}