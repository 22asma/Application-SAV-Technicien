import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

interface SideNavToggle {
  screenWidth: number;
  collapsed: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrls: ['./app.css']
})
export class App implements OnInit{
  title = 'app-sav';
  isSideNavCollapsed = false;
  screenWidth = 0;
  showLayout = false;

  constructor(private router: Router, 
    private cdRef: ChangeDetectorRef,
    private translate: TranslateService
  ) {
  this.router.events.pipe(
    filter(event => event instanceof NavigationEnd)
  ).subscribe((event: NavigationEnd) => {
    this.updateLayoutVisibility(event.url);
  });
}

  ngOnInit() {
    // Configuration de la traduction
    this.translate.setDefaultLang('fr');
    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang?.match(/en|fr/) ? browserLang : 'fr');
  }

 private updateLayoutVisibility(url: string): void {
  this.showLayout = !url.startsWith('/auth');

  if (url.startsWith('/private') && localStorage.getItem('isLoggedIn') !== 'true') {
    this.router.navigate(['/dashboard']);
  }

  this.cdRef.detectChanges(); // force Angular à relancer la vérification
}


  onToggleSideNav(data: SideNavToggle): void {
    this.screenWidth = data.screenWidth;
    this.isSideNavCollapsed = data.collapsed;
  }

  getBodyclass(): string {
    let styleClass = '';
    if (this.isSideNavCollapsed && this.screenWidth > 768) {
      styleClass = 'body-trimmed';
    } else if (this.isSideNavCollapsed && this.screenWidth <= 768 && this.screenWidth > 0) {
      styleClass = 'body-md-screen';
    }
    return styleClass;
  }
}