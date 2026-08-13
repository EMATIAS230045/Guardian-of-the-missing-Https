import { Component, Output, EventEmitter, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';

@Component({
    selector: 'app-navbar',
    imports: [CommonModule],
    templateUrl: './navbar.html'
})

export class NavbarComponent {
    constructor(public router: Router) {}
    userInfo = inject(UserService)
    @Output() openProfile = new EventEmitter<void>();
    get usuarioActual() { return this.userInfo.getUsuarioActual(); }
    openProfileUser() { this.openProfile.emit(); }
}
