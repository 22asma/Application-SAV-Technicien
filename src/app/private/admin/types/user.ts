export interface User {
  id?: string;
  username?: string;
  lastName?: string;  // Changé de lastname à lastName
  firstName?: string; // Changé de firstname à firstName
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