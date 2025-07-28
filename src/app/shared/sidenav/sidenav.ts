import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { TranslateService } from '@ngx-translate/core';


interface SideNavToggle {
  screenWidth: number;
  collapsed: boolean;
}

export interface InavbarData {
  path: string;
  icon: string;
  title: string;
  expanded?: boolean;
  items?: InavbarData[];
}

export const navbarData: InavbarData[] = [
  { 
    path: '/dashboard', 
    title: 'Dashboard', 
    icon: 'fas fa-home'
  },
  {
    path: '/technician/technicien',
    title: 'Techniciens',
    icon: 'fas fa-user-tie'
  },
  {
    path: '/ortache/listeOR',
    title: 'Liste OR',
    icon: 'fas fa-clipboard-list'
  },
  {
    path: '/admin/administration',
    title: 'Administration',
    icon: 'fas fa-cog',
  },
  { 
    path: '/parametres', 
    title: 'Paramétrages', 
    icon: 'fas fa-sliders-h' 
  },
  { 
    path: '/auth/login', 
    title: 'Log Out', 
    icon: 'fas fa-sign-out-alt' 
  }
];


@Component({
  selector: 'app-sidenav',
  standalone: false,
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateX(0)' }),
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(-10px)' }))
      ])
    ])
  ]
})
export class Sidenav implements OnInit {
  @Output() onToggleSideNav: EventEmitter<SideNavToggle> = new EventEmitter();
  
  collapsed = true;
  pinned = false;
  screenWidth = 0;
  
  navData = navbarData;

  constructor(private router: Router, private authService: AuthService) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = window.innerWidth;
    if (this.screenWidth <= 768) {
      this.collapsed = true;
      this.pinned = false;
      this.onToggleSideNav.emit({ collapsed: this.collapsed, screenWidth: this.screenWidth });
    } else {
      if (!this.pinned) {
        this.collapsed = true;
        this.onToggleSideNav.emit({ collapsed: this.collapsed, screenWidth: this.screenWidth });
      }
    }
  }

  ngOnInit(): void {
    this.screenWidth = window.innerWidth;
    this.collapsed = true;
    this.onToggleSideNav.emit({ collapsed: this.collapsed, screenWidth: this.screenWidth });
  }

  onMouseEnter(): void {
    if (this.screenWidth > 768 && !this.pinned && this.collapsed) {
      this.collapsed = false;
      this.onToggleSideNav.emit({ collapsed: this.collapsed, screenWidth: this.screenWidth });
    }
  }

  onMouseLeave(): void {
    if (this.screenWidth > 768 && !this.pinned && !this.collapsed) {
      this.collapsed = true;
      this.onToggleSideNav.emit({ collapsed: this.collapsed, screenWidth: this.screenWidth });
    }
  }

  togglePin(): void {
    this.pinned = !this.pinned;
    if (this.pinned) {
      this.collapsed = false;
    } else {
      this.collapsed = true;
    }
    this.onToggleSideNav.emit({ collapsed: this.collapsed, screenWidth: this.screenWidth });
  }

  toggleSideNav(): void {
    this.collapsed = !this.collapsed;
    this.onToggleSideNav.emit({ collapsed: this.collapsed, screenWidth: this.screenWidth });
  }

  // sidenav.ts
  logout(): void {
  console.debug('[Auth] Début du processus de déconnexion');
  
    this.authService.logout();
    console.log('[Auth] Déconnexion effectuée avec succès');
    
    if (this.screenWidth <= 768) {
      this.collapsed = true;
      console.debug('[UI] Sidebar réduit après déconnexion sur mobile');
    }
    console.debug('[Auth] Déconnexion annulée par l\'utilisateur');
}

  toggleSubMenu(item: InavbarData): void {
  if (item.items && item.items.length) {
    item.expanded = !item.expanded;
  }
}

isActive(path: string): boolean {
  return this.router.isActive(path, true);
}

isAnyChildActive(item: InavbarData): boolean {
  if (!item.items) return false;
  return item.items.some(child => this.isActive(child.path));
}
}