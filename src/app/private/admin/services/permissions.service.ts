import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Permission } from '../types/permission';


@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  baseUrl = 'http://localhost:3000';

  constructor(private httpclient: HttpClient) { }

  getAllPermission(){
    return this.httpclient.get<Permission[]>(this.baseUrl+'/permission');
  }

  deletePermission(id: string){
    return this.httpclient.delete(this.baseUrl+'/permission/' + id);
  }

 addPermission(permission: any) {
    return this.httpclient.post<Permission>(this.baseUrl + '/permission/', permission);
  }

  editPermission(id: string,permission:Permission){
    return this.httpclient.put(this.baseUrl + '/permission/' + id, permission);
  }

  getPermissionById(id : string){
    return this.httpclient.get<Permission>(this.baseUrl + '/permission/' +id );
  }
  
 addPermissionsToPermission(mainPermissionId: string, permissionUpdate: any) {
    return this.httpclient.put(
      `${this.baseUrl}/permission/${mainPermissionId}/add-permissions`, 
      permissionUpdate
    );
  }

getMainPermissions() {
  return this.httpclient.get<any[]>(this.baseUrl + '/permission/main');
}
}
