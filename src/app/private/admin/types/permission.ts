export interface Permission {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  secondaryPermissions: [
    { id: string, name: string },
  ]
  mainPermission?: {
    id: string;
    name: string;
  } | null;
}