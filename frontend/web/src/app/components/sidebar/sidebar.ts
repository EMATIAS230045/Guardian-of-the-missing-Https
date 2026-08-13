import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule],
    templateUrl: './sidebar.html',
})

export class SidebarComponent {
    constructor(public router: Router) {}
    userInfo = inject(UserService)
    get usuarioActual() { return this.userInfo.getUsuarioActual(); }

    dashboard() { this.router.navigate(['/home/dashboard']); }
    geofences() { this.router.navigate(['/home/geofences']); }
    historial() { this.router.navigate(['/home/historial']); }
    contacts() { this.router.navigate(['/home/contacts']); }
    groups() { this.router.navigate(['/home/groups']); }
    users() { this.router.navigate(['/home/users']); }
    cerrarSesion() { this.router.navigate(['/login']); }
}
