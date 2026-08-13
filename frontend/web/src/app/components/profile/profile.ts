import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';

@Component({
    selector: 'app-profile',
    imports: [CommonModule],
    templateUrl: './profile.html'
})

export class ProfileComponent {
    users = inject(UserService);
    @Output() close = new EventEmitter<void>();
    get usuarioActual() { return this.users.getUsuarioActual(); }
    cerrar() { this.close.emit(); }
}
