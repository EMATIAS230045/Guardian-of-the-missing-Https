import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    imports: [FormsModule, CommonModule],
    templateUrl: './login.html'
})

export class LoginComponent {
    constructor(
        private router: Router, 
        private userService: UserService,
        private authService: AuthService
    ) {}

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
    
    // Add a generic login error property
    errorLoginGeneric = '';

    onSubmit() { this.onLoginSuccess(); }

    onSendCode() { this.router.navigate(['/verification']); }

    onLoginSuccess() {
        // Reset errors
        this.errorLoginEmail = '';
        this.errorLoginPassword = '';
        this.errorLoginGeneric = '';

        let esValido = true;
        if (!this.l_email.trim()) {
            this.errorLoginEmail = 'El correo es obligatorio.';
            esValido = false;
        } else if (!this.formatoEmailValido(this.l_email)) {
            this.errorLoginEmail = 'El formato del correo no es válido.';
            esValido = false;
        }

        if (!this.l_password.trim()) {
            this.errorLoginPassword = 'La contraseña es obligatoria.';
            esValido = false;
        }

        if (!esValido) { return; }

        const credentials = {
            correo: this.l_email.trim(),
            contrasena: this.l_password.trim()
        };

        this.authService.login(credentials).subscribe({
            next: (res) => {
                // TODO: Save token to localStorage, e.g., localStorage.setItem('token', res.access_token);
                // For now, we still trigger the local mock session state if needed, or simply route
                // If the backend returns user details eventually, you can sync it with UserService
                console.log("Login successful! Token:", res.access_token);
                this.router.navigate(['/home/dashboard']);
            },
            error: (err) => {
                console.error("Login error:", err);
                // Mostrar el error real devuelto por el backend
                this.errorLoginGeneric = err.message;
            }
        });
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