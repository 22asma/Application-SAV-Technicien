import { ChangeDetectorRef, Component, HostListener, Input, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Location } from '@angular/common';
import { AuthService } from '../../auth/services/auth.service';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { TranslationService } from '../../../assets/i18n/translation.service';

export const userItems = [
  {
    icon: 'fal fa-user',
    label: 'Profile',
    route: '/admin/profil'
  },
  {
    icon: 'fal fa-power-off',
    label: 'Logout',
    action: 'logout'
  }
];

export const languages = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

export const staticNotifications = [
  {
    id: 1,
    message: 'Nouvelle commande reçue',
    time: '2 min ago',
    type: 'success'
  },
  {
    id: 2,
    message: 'Produit mis à jour avec succès',
    time: '15 min ago',
    type: 'info'
  },
  {
    id: 3,
    message: 'Erreur de synchronisation',
    time: '1 hour ago',
    type: 'error'
  },
  {
    id: 4,
    message: 'Commande annulée',
    time: '2 hours ago',
    type: 'warning'
  }
];

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {

  @Input() collapsed = false;
  @Input() screenWidth = 0;

  canShowSearchAsOverlay = false;
  hasNewNotification = true;
  userItems = userItems;
  languages = languages;
  notifications = staticNotifications;
  isMenuOpen = false;
  isNotificationOpen = false;
  isLanguageOpen = false;
  breadcrumbs: any[] = [];
  currentDate: string = '';
  interfaceName: string = 'Dashboard';
  selectedLanguage = languages[0];
  
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    private authService: AuthService,
    private translate: TranslateService,
    private translationService: TranslationService,
    private cdRef: ChangeDetectorRef
  ) {
     this.translate.setDefaultLang('fr');
    
    // Essayez de récupérer la langue sauvegardée
    const savedLang = localStorage.getItem('lang') || this.translate.getBrowserLang() || 'fr';
    this.translate.use(savedLang.match(/en|fr/) ? savedLang : 'fr');
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateInterfaceName();
      let route = this.activatedRoute.firstChild;
      this.breadcrumbs = [];
      while (route) {
        const routePath = route.snapshot.url.map(segment => segment.path);
        this.breadcrumbs.push({
          label: route.snapshot.data['breadcrumb'] || route.snapshot.url.map(segment => segment.path).join('/'),
          url: '/' + routePath.join('/')
        });
        route = route.firstChild;
      }
    });
  }

  ngOnInit(): void {
    this.checkCanShowSearchOverlay(window.innerWidth);
    this.loadNotifications();
    this.updateCurrentDate();
    this.updateInterfaceName();
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
    console.log('Langue changée vers:', event.lang);
    console.log('Traduction de "Dashboard":', this.translate.instant('Dashboard'));
  });
  }
  
   currentLang = 'fr';
   switchLanguage() {
    this.currentLang = this.currentLang === 'fr' ? 'en' : 'fr';
    this.translationService.changeLanguage(this.currentLang);
  }

selectLanguage(language: any, event?: Event): void {
  if (event) event.stopPropagation();
  
  this.selectedLanguage = language;
  this.isLanguageOpen = false;

  // Change la langue immédiatement
  this.translate.use(language.code).subscribe({
    next: () => {
      localStorage.setItem('lang', language.code);
      this.currentLang = language.code;
      this.updateCurrentDate();
      this.updateInterfaceName();
      this.cdRef.detectChanges(); // Force la mise à jour de la vue
    },
    error: (err) => console.error('Failed to change language', err)
  });
}
  // Ajout d'un HostListener pour fermer les menus lors d'un clic en dehors
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Vérifie si le clic est en dehors des menus
    if (!target.closest('.head-menu-item')) {
      this.isMenuOpen = false;
      this.isNotificationOpen = false;
      this.isLanguageOpen = false;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkCanShowSearchOverlay(window.innerWidth);
  }

  getHeadClass(): string {
    let styleClass = '';
    if (!this.collapsed && this.screenWidth > 768) {
      styleClass = 'head-trimmed';
    } else {
      styleClass = 'head-md-screen';
    }
    return styleClass;
  }

  checkCanShowSearchOverlay(innerWidth: number): void {
    this.canShowSearchAsOverlay = innerWidth < 845;
  }

  private loadNotifications(): void {
    const username = localStorage.getItem('username');
    if (!username) {
      console.error('Username not found in local storage');
      return;
    }
  }

  private updateCurrentDate(): void {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long', 
    year: 'numeric'
  };
  
  // Utilise la langue active
  this.currentDate = now.toLocaleDateString(this.translate.currentLang === 'fr' ? 'fr-FR' : 'en-US', options);
}

  private updateInterfaceName(): void {
   let route = this.activatedRoute;
  while (route.firstChild) {
    route = route.firstChild;
  }
  
  const routeMap: { [key: string]: string } = {
    'dashboard': 'Dashboard',
    'users': 'Gestion des utilisateurs',
    'technicien': 'Liste des Techniciens',
    'listeOR': 'Ordres de Réparation',
    'settings': 'Paramètres',
    'profile': 'Profil',
    'administration': 'Administrations'
  };
  
  this.interfaceName = routeMap[route.snapshot.routeConfig?.path || ''] || 'Dashboard';
}

  navigateBack(): void {
    this.location.back();
  }

  // Modification pour empêcher la propagation d'événement
  markAllAsRead(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.hasNewNotification = false;
    this.isNotificationOpen = false;
  }

  // Modification pour empêcher la propagation d'événement
  toggleNotifications(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isNotificationOpen = !this.isNotificationOpen;
    this.isLanguageOpen = false;
    this.isMenuOpen = false;
  }

  // Modification pour empêcher la propagation d'événement
  toggleLanguageMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isLanguageOpen = !this.isLanguageOpen;
    this.isNotificationOpen = false;
    this.isMenuOpen = false;
  }

  // Modification pour empêcher la propagation d'événement
  toggleUserMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isMenuOpen = !this.isMenuOpen;
    this.isNotificationOpen = false;
    this.isLanguageOpen = false;
  }

  getNotificationIcon(type: string): { iconClass: string, color: string } {
    switch (type) {
      case 'success':
        return { iconClass: 'fas fa-check-circle', color: '#10b981' };
      case 'info':
        return { iconClass: 'fas fa-info-circle', color: '#3b82f6' };
      case 'error':
        return { iconClass: 'fas fa-exclamation-circle', color: '#ef4444' };
      case 'warning':
        return { iconClass: 'fas fa-exclamation-triangle', color: '#f59e0b' };
      default:
        return { iconClass: 'fas fa-bell', color: '#6b7280' };
    }
  }

   logout(): void {
    this.authService.logout(); // Déconnexion directe sans confirmation
    this.closeAllMenus(); // Ferme les menus ouverts
  }

  private closeAllMenus(): void {
    this.isMenuOpen = false;
    this.isNotificationOpen = false;
    this.isLanguageOpen = false;
  }

  onUserItemClicked(item: any, event?: Event): void {
    if (event) event.stopPropagation();
    
    if (item.action === 'logout') {
      this.logout(); // Appel direct sans confirmation
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
    this.closeAllMenus();
  }
}