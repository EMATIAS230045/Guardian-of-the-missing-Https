import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';

@Component({
    selector: 'app-login',
    imports: [FormsModule, CommonModule],
    templateUrl: './login.html'
})

export class LoginComponent {
    constructor(private router: Router, private userService: UserService) {}

    l_email = '';
    l_password = '';
    r_email = '';
    r_password = '';
    r_passwordconfirm = '';
    r_bloodType = '';
    r_phonenumber = '';
    loginForm: boolean = true;
    registerForm2: boolean = false;

    errorLoginEmail = '';
    errorLoginPassword = '';
    errorRegisterEmail = '';
    errorRegisterPassword = '';
    errorRegisterPasswordConfirm = '';

    onSubmit() { this.onLoginSuccess(); }

    onSendCode() { this.router.navigate(['/verification']); }

    onLoginSuccess() {
        if (!this.validarLogin()) { return; }
        const usuario = this.userService.user().find( u => u.email.toLowerCase() === this.l_email.trim().toLowerCase() );
        if (usuario) { this.userService.iniciarSesion(usuario.id); }
        this.router.navigate(['/home/dashboard']);
    }

    private validarLogin(): boolean {
        this.errorLoginEmail = '';
        this.errorLoginPassword = '';
        let esValido = true;

        // Validar campo lleno
        if (!this.l_email.trim()) {
            this.errorLoginEmail = 'El correo es obligatorio.';
            esValido = false;
        } else if (!this.formatoEmailValido(this.l_email)) {
            this.errorLoginEmail = 'El formato del correo no es válido.';
            esValido = false;
        } else {
            // Validar que el correo exista en el UserService
            const usuarioEncontrado = this.userService.user().find(
                (u) => u.email.toLowerCase() === this.l_email.trim().toLowerCase()
            );

            if (!usuarioEncontrado) {
                this.errorLoginEmail = 'No existe una cuenta con este correo.';
                esValido = false;
            } else {
                if (!this.l_password.trim()) {
                    this.errorLoginPassword = 'La contraseña es obligatoria.';
                    esValido = false;
                } else if (this.l_password !== usuarioEncontrado.password) {
                    this.errorLoginPassword = 'Contraseña incorrecta.';
                    esValido = false;
                }
            }
        }

        return esValido;
    }

    private formatoEmailValido(email: string): boolean {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email.trim());
    }

    switchForm() {
        this.loginForm = !this.loginForm;
        this.registerForm_off();
        this.limpiarCamposLogin();
        this.limpiarCamposRegistro();
    }

    registerForm_on() {
        if (!this.validarRegistroPaso1()) {
            return;
        }
        this.registerForm2 = true;
    }

    registerForm_off() {
        this.registerForm2 = false;
        this.limpiarCamposRegistro();
    }

    private validarRegistroPaso1(): boolean {
        this.errorRegisterEmail = '';
        this.errorRegisterPassword = '';
        this.errorRegisterPasswordConfirm = '';
        let esValido = true;

        // Validar correo: lleno y formato
        if (!this.r_email.trim()) {
            this.errorRegisterEmail = 'El correo es obligatorio.';
            esValido = false;
        } else if (!this.formatoEmailValido(this.r_email)) {
            this.errorRegisterEmail = 'El formato del correo no es válido.';
            esValido = false;
        }

        // Validar contraseña: llena, 8+ caracteres, al menos 1 número, al menos 1 símbolo
        if (!this.r_password.trim()) {
            this.errorRegisterPassword = 'La contraseña es obligatoria.';
            esValido = false;
        } else {
            const tieneLongitudMinima = this.r_password.length >= 8;
            const tieneNumero = /\d/.test(this.r_password);
            const tieneSimbolo = /[^A-Za-z0-9]/.test(this.r_password);

            if (!tieneLongitudMinima) {
                this.errorRegisterPassword = 'La contraseña debe tener al menos 8 caracteres.';
                esValido = false;
            } else if (!tieneNumero) {
                this.errorRegisterPassword = 'La contraseña debe contener al menos un número.';
                esValido = false;
            } else if (!tieneSimbolo) {
                this.errorRegisterPassword = 'La contraseña debe contener al menos un símbolo.';
                esValido = false;
            }
        }

        // Validar confirmación: llena y que coincida
        if (!this.r_passwordconfirm.trim()) {
            this.errorRegisterPasswordConfirm = 'Debes confirmar la contraseña.';
            esValido = false;
        } else if (this.r_passwordconfirm !== this.r_password) {
            this.errorRegisterPasswordConfirm = 'Las contraseñas no coinciden.';
            esValido = false;
        }

        return esValido;
    }

    private limpiarCamposLogin() {
        this.l_email = '';
        this.l_password = '';
        this.errorLoginEmail = '';
        this.errorLoginPassword = '';
    }

    private limpiarCamposRegistro() {
        this.r_email = '';
        this.r_password = '';
        this.r_passwordconfirm = '';
        this.r_bloodType = '';
        this.r_phonenumber = '';
        this.errorRegisterEmail = '';
        this.errorRegisterPassword = '';
        this.errorRegisterPasswordConfirm = '';
    }

    // Al completar el segundo formulario de registro, regresa al login
    registrarUsuarioCompleto() {
        // GUARDAR AQUI EL USUARIO REGISTRADO
        this.registerForm2 = false;
        this.loginForm = true;
        this.limpiarCamposRegistro();
    }
}