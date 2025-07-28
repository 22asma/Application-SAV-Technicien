// assets/i18n/translation.service.ts
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  constructor(private translate: TranslateService) {
    const savedLang = localStorage.getItem('lang') || 'fr';
    this.translate.setDefaultLang(savedLang);
    this.translate.use(savedLang);
  }

  changeLanguage(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  getCurrentLanguage(): string {
    return this.translate.currentLang;
  }
}
