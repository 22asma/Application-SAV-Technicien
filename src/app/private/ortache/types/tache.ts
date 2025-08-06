export interface Tache {
  id: string;
  titre: string;        
  statut: StatutTache;  
  details: string;      
  ordreReparationId: string;
  techniciens: Array<{
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    statut: string;
    badgeId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Vous pouvez créer un enum pour les statuts si nécessaire
export enum StatutTache {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED ='PAUSED'
  // Ajoutez d'autres valeurs si nécessaire
}