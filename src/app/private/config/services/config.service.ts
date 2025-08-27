import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

export interface Configuration {
  id: string;
  parallelTasksPerTechnician: boolean;
  multiTechniciansPerTask: boolean;
  onlyCreatorEndTask: boolean;
  restartTask: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateConfigurationDto {
  parallelTasksPerTechnician?: boolean;
  multiTechniciansPerTask?: boolean;
  onlyCreatorEndTask?: boolean;
  restartTask: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private baseUrl = environment.apiURL;

  constructor(private http: HttpClient) {}

  getConfiguration(): Observable<Configuration> {
    return this.http.get<Configuration>(this.baseUrl+'/configuration');
  }

  updateConfiguration(id: string, dto: UpdateConfigurationDto): Observable<Configuration> {
    return this.http.patch<Configuration>(`${this.baseUrl}/configuration/${id}`, dto);
  }
}