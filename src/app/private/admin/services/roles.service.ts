import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Role } from '../types/role';
import { catchError, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.development';


@Injectable({
  providedIn: 'root'
})
export class RolesService {

  private baseUrl = environment.apiURL;

  constructor(private httpclient: HttpClient) { }

   getAllRole() {
    return this.httpclient.get<Role[]>(this.baseUrl+'/role', {
      params: new HttpParams().set('includePermissions', 'true')
    });
  }

  deleteRole(id: string){
    return this.httpclient.delete(this.baseUrl+'/role/' + id);
  }

  addRole(role : Role) {
    return this.httpclient.post(this.baseUrl + '/role',role);
  }

updateRole(id: string, updateData: any): Observable<any> {
  const url = `${this.baseUrl}/role/${id}`;  // Removed '/api' from the path
  console.log('URL:', url);
  console.log('Data:', updateData);
  
  return this.httpclient.patch(url, updateData)
    .pipe(
      tap(response => console.log('Réponse:', response)),
      catchError(error => {
        console.error('Erreur complète:', error);
        throw error;
      })
    );
}
  getRoleById(id : string){
    return this.httpclient.get<Role>(this.baseUrl + '/role/' +id );
  }
  
  addPermissionsToRole(id: string,role:Role){
    return this.httpclient.put(this.baseUrl + '/role/' + id+ '/add-permissions', role);
  }
}
