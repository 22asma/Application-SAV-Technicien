import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {
 @Input() collapsed = false;
 @Input() screenWidth = 0;
  
  currentYear: number = new Date().getFullYear();
  companyName: string = 'Your Company';
  version: string = '1.0.0';

getFooterClass(): string {
  let styleClass = '';
  if (!this.collapsed && this.screenWidth > 768) {
    styleClass = 'footer-trimmed'; // Sidenav OUVERTE = espace réduit
  } else if (this.collapsed && this.screenWidth <= 768 && this.screenWidth > 0) {
    styleClass = 'footer-md-screen';
  }
  return styleClass;
}

}
