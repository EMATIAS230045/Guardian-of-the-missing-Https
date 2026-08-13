import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-newpassword',
    imports: [CommonModule, FormsModule],
    templateUrl: './newpassword.html'
})

export class NewpasswordComponent {
    constructor(private router: Router) {}

    password = '';
    passwordconfirm = '';

    errorPassword = '';
    errorPasswordConfirm = '';

    passwordActualizada = false;

    changePassword() {
        if (!this.validarPassword()) {
            return;
        }

        // TODO: aquí se actualizaría la contraseña real en el servicio/backend
        this.passwordActualizada = true;
    }

    private validarPassword(): boolean {
        this.errorPassword = '';
        this.errorPasswordConfirm = '';
        let esValido = true;

        if (!this.password.trim()) {
            this.errorPassword = 'La contraseña es obligatoria.';
            esValido = false;
        } else {
            const tieneLongitudMinima = this.password.length >= 8;
            const tieneNumero = /\d/.test(this.password);
            const tieneSimbolo = /[^A-Za-z0-9]/.test(this.password);

            if (!tieneLongitudMinima) {
                this.errorPassword = 'La contraseña debe tener al menos 8 caracteres.';
                esValido = false;
            } else if (!tieneNumero) {
                this.errorPassword = 'La contraseña debe contener al menos un número.';
                esValido = false;
            } else if (!tieneSimbolo) {
                this.errorPassword = 'La contraseña debe contener al menos un símbolo.';
                esValido = false;
            }
        }

        if (!this.passwordconfirm.trim()) {
            this.errorPasswordConfirm = 'Debes confirmar la contraseña.';
            esValido = false;
        } else if (this.passwordconfirm !== this.password) {
            this.errorPasswordConfirm = 'Las contraseñas no coinciden.';
            esValido = false;
        }

        return esValido;
    }

    regresarAlLogin() {
        this.router.navigate(['/login']);
    }
}