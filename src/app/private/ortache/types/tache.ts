export interface Tache {
  id: string;
  titre: string;        // Au lieu de 'nom'
  statut: StatutTache;  // Utilisez l'enum du backend
  details: string;      // Au lieu de 'description'
  ordreReparationId: string;
  // Ajoutez si nécessaire:
  createdAt?: Date;
  updatedAt?: Date;
}

// Vous pouvez créer un enum pour les statuts si nécessaire
export enum StatutTache {
  NON_DEMAREE = 'Non démarrée',
  EN_COURS = 'En cours',
  TERMINEE = 'Terminée',
  // Ajoutez d'autres valeurs si nécessaire
}