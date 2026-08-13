import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user';

@Component({
    selector: 'app-sendcode',
    imports: [CommonModule, FormsModule],
    templateUrl: './sendcode.html'
})

export class SendcodeComponent {
    private users = inject(UserService);
    private router = inject(Router);

    // Paso 1: correo
    email = '';
    errorEmail = '';
    mostrarPasoCodigo = false;

    // Paso 2: código de verificación
    codigo = '';
    errorCodigo = '';

    enviarCorreo() {
        this.errorEmail = '';
        if (!this.email.trim()) { this.errorEmail = 'El correo es obligatorio.'; return; }
        if (!this.formatoEmailValido(this.email)) { this.errorEmail = 'El formato del correo no es válido.'; return; }
        const usuarioEncontrado = this.users.user().find( u => u.email.toLowerCase() === this.email.trim().toLowerCase() );
        if (!usuarioEncontrado) { this.errorEmail = 'No existe una cuenta registrada con este correo.'; return; }

        // Aqui se enviaría el codigo al correo del usuario

        this.mostrarPasoCodigo = true;
    }

    private formatoEmailValido(email: string): boolean {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email.trim());
    }

    verificarCodigo() {
        this.errorCodigo = '';
        if (!this.codigo.trim()) { this.errorCodigo = 'El código es obligatorio.'; return; }

        // Aqui se debe validar el codigo de verificacion enviado al correo

        this.router.navigate(['/login']);
    }
}
