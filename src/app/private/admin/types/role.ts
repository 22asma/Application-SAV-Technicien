export interface Role {
  id: string;
  name: string;
  rolePermissions: {
    id: string;
    permission: {
      id: string;
      name: string;
    };
  }[];
}