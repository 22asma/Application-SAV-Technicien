import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Tache } from '../types/tache';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TachesService {
  baseUrl = 'http://localhost:3000';

  constructor(private httpclient: HttpClient) { }

  getTachesByORId(ordreReparationId: string): Observable<Tache[]> {
    // Utilisation du paramètre de chemin comme le backend l'attend
    return this.httpclient.get<Tache[]>(
      `${this.baseUrl}/tache/${ordreReparationId}`
    );
  }

}