import { Component, inject } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../services/user';

@Component({
    selector: 'app-contacts',
    imports: [NgFor, NgIf, CommonModule, FormsModule],
    templateUrl: './contacts.html'
})

export class ContactsComponent {
    users = inject(UserService);
    miUsuarioId = 0;

    terminoBusqueda = '';

    get contactos(): User[] {
        return this.users.getContactos(this.miUsuarioId);
    }

    get contactosFiltrados(): User[] {
        if (!this.terminoBusqueda.trim()) {
            return this.contactos;
        }

        const termino = this.terminoBusqueda.trim().toLowerCase();
        return this.contactos.filter(contacto =>
            contacto.username.toLowerCase().includes(termino) ||
            contacto.email.toLowerCase().includes(termino)
        );
    }

    // Estado de paginación
    paginaActual = 1;
    resultadosPorPagina = 10;

    get totalPaginas(): number { return Math.max(1, Math.ceil(this.contactosFiltrados.length / this.resultadosPorPagina)); }

    get contactosPaginados(): User[] {
        const inicio = (this.paginaActual - 1) * this.resultadosPorPagina;
        return this.contactosFiltrados.slice(inicio, inicio + this.resultadosPorPagina);
    }

    get numerosDePagina(): number[] { return Array.from({ length: this.totalPaginas }, (_, i) => i + 1); }

    irAPagina(pagina: number) {
        if (pagina < 1 || pagina > this.totalPaginas) return;
        this.paginaActual = pagina;
    }

    paginaAnterior() { this.irAPagina(this.paginaActual - 1); }
    paginaSiguiente() { this.irAPagina(this.paginaActual + 1); }
}
