import { Component } from '@angular/core';

@Component({
  selector: 'app-parametres',
  standalone: false,
  templateUrl: './parametres.html',
  styleUrl: './parametres.css'
})
export class Parametres {
  parametres = {
    autoriserPauseSurTacheActive: true,
    autoriserTachesParalleles: false,
    autoriserTacheMultiTechnicien: true,
    inclurePauseDansTempsTache: false,
    clotureUniquementParCreateur: true,
    scanBadgeObligatoire: true,
    heureDebutJournee: '08:00',
    heureFinJournee: '17:00',
    dureePauseParDefaut: 60,
    dureeMaxInactivite: 90
  };

  enregistrerParametres() {
    // Ici vous pouvez implémenter la logique pour sauvegarder les paramètres
    console.log('Paramètres enregistrés:', this.parametres);
    // Exemple: appel à un service API pour sauvegarder
  }

}
