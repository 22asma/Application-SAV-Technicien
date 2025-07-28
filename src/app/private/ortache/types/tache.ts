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
  NON_DEMAREE = 'NON_DEMAREE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  // Ajoutez d'autres valeurs si nécessaire
}