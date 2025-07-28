import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Tache } from '../types/tache';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class TachesService {
  private baseUrl = environment.apiURL;

  constructor(private httpclient: HttpClient) { }

  getTachesByORId(ordreReparationId: string): Observable<Tache[]> {
    // Utilisation du paramètre de chemin comme le backend l'attend
    return this.httpclient.get<Tache[]>(
      `${this.baseUrl}/tasks/${ordreReparationId}`
    );
  }

}