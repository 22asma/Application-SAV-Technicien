import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appHasPermission]'
})
export class HasPermissionDirective implements OnDestroy {
  private permissionSubscription?: Subscription;
  private requiredPermissions: string[] = [];
  private hasView = false; // Ajoutez cette variable pour suivre l'état

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  @Input() set appHasPermission(value: string | string[]) {
    this.requiredPermissions = Array.isArray(value) ? value : [value];
    this.updateView();

    if (this.permissionSubscription) {
      this.permissionSubscription.unsubscribe();
    }

    this.permissionSubscription = this.authService.getUserPermissions().subscribe(() => {
      this.updateView();
    });
  }

  private updateView(): void {
    const hasPermission = this.authService.hasAnyPermission(this.requiredPermissions);
    
    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  ngOnDestroy(): void {
    if (this.permissionSubscription) {
      this.permissionSubscription.unsubscribe();
    }
  }
}