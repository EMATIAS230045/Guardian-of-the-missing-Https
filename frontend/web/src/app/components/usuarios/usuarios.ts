import { Component, inject } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../services/user';

@Component({
    selector: 'app-usuarios',
    imports: [NgFor, NgIf, CommonModule, FormsModule],
    templateUrl: './usuarios.html'
})

export class UsuariosComponent {
    users = inject(UserService);
    terminoBusqueda = '';

    // Estado de paginación
    paginaActual = 1;
    resultadosPorPagina = 10;

    get usuariosFiltrados(): User[] {
        if (!this.terminoBusqueda.trim()) {
            return this.users.user();
        }

        const termino = this.terminoBusqueda.trim().toLowerCase();
        return this.users.user().filter(u =>
            u.username.toLowerCase().includes(termino) ||
            u.email.toLowerCase().includes(termino)
        );
    }

    get totalPaginas(): number { return Math.max(1, Math.ceil(this.usuariosFiltrados.length / this.resultadosPorPagina));  }

    get usuariosPaginados(): User[] {
        const inicio = (this.paginaActual - 1) * this.resultadosPorPagina;
        return this.usuariosFiltrados.slice(inicio, inicio + this.resultadosPorPagina);
    }

    get numerosDePagina(): number[] { return Array.from({ length: this.totalPaginas }, (_, i) => i + 1); }

    irAPagina(pagina: number) {
        if (pagina < 1 || pagina > this.totalPaginas) return;
        this.paginaActual = pagina;
    }

    paginaAnterior() { this.irAPagina(this.paginaActual - 1); }
    paginaSiguiente() { this.irAPagina(this.paginaActual + 1); }
}