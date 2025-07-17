import { Role } from "./role";

export interface User {
  id?: string;
  username?: string;
  nom?: string;
  prenom?: string;
  roleId?: string;
  badgeId?: string;
  password?: string;
  statut?: string;
  roleName?: string; 
  role?: {
    id: string;
    name: string;
    rolePermissions?: any[];
    createdAt?: string;
    updatedAt?: string;
  };
}