import { Component, inject } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { UserService, ContactGroup, User } from '../../services/user';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-groups',
    imports: [NgFor, NgIf, FormsModule, CommonModule],
    templateUrl: './groups.html'
})

export class GroupsComponent {
    users = inject(UserService);
    miUsuarioId = 0;
    terminoBusqueda = '';
    
    // Estado del modal
    modalAbierto = false;
    nombreNuevoGrupo = '';
    contactosSeleccionados: number[] = [];
    errorModal = '';

    // Estado del modal de miembros
    modalMiembrosAbierto = false;
    grupoSeleccionadoId: number | null = null;

    get grupos(): ContactGroup[] {
        const usuario = this.users.user().find(u => u.id === this.miUsuarioId);
        return usuario ? usuario.groups : [];
    }

    get misContactos(): User[] {
        return this.users.getContactos(this.miUsuarioId);
    }

    get miembrosDelGrupoSeleccionado(): User[] {
        if (this.grupoSeleccionadoId === null) return [];
        return this.users.getContactosDeGrupo(this.miUsuarioId, this.grupoSeleccionadoId);
    }

    get gruposFiltrados(): ContactGroup[] {
        if (!this.terminoBusqueda.trim()) {
            return this.grupos;
        }

        const termino = this.terminoBusqueda.trim().toLowerCase();
        return this.grupos.filter(grupo =>
            grupo.name.toLowerCase().includes(termino)
        );
    }

    allContacts(grupo: ContactGroup): number {
        return grupo.contactIds.length;
    }

    abrirModal() {
        this.modalAbierto = true;
        this.nombreNuevoGrupo = '';
        this.contactosSeleccionados = [];
        this.errorModal = '';
    }

    cancelarModal() {
        this.modalAbierto = false;
        this.nombreNuevoGrupo = '';
        this.contactosSeleccionados = [];
        this.errorModal = '';
    }

    toggleContacto(contactId: number) {
        if (this.contactosSeleccionados.includes(contactId)) {
            this.contactosSeleccionados = this.contactosSeleccionados.filter(id => id !== contactId);
        } else {
            this.contactosSeleccionados = [...this.contactosSeleccionados, contactId];
        }
    }

    estaSeleccionado(contactId: number): boolean {
        return this.contactosSeleccionados.includes(contactId);
    }

    confirmarCrearGrupo() {
        this.errorModal = '';

        if (!this.nombreNuevoGrupo.trim()) {
            this.errorModal = 'El grupo debe tener un nombre.';
            return;
        }

        if (this.contactosSeleccionados.length < 2) {
            this.errorModal = 'Debes seleccionar al menos 2 contactos.';
            return;
        }

        const creado = this.users.crearGrupo(
            this.miUsuarioId,
            this.nombreNuevoGrupo.trim(),
            this.contactosSeleccionados
        );

        if (creado) {
            this.cancelarModal();
        } else {
            this.errorModal = 'Ocurrió un error al crear el grupo.';
        }
    }

    eliminarGrupo(groupId: number) {
        this.users.eliminarGrupo(this.miUsuarioId, groupId);
    }

    // Modal de miembros de los grupos
    verMiembros(groupId: number) {
        this.grupoSeleccionadoId = groupId;
        this.modalMiembrosAbierto = true;
    }

    cerrarModalMiembros() {
        this.modalMiembrosAbierto = false;
        this.grupoSeleccionadoId = null;
    }

    eliminarMiembro(contactId: number) {
        if (this.grupoSeleccionadoId === null) return;

        const usuario = this.users.user().find(u => u.id === this.miUsuarioId);
        if (!usuario) return;

        const grupoActualizado = usuario.groups.map(g =>
            g.id === this.grupoSeleccionadoId
                ? { ...g, contactIds: g.contactIds.filter(id => id !== contactId) }
                : g
        );

        this.users.updateUser(this.miUsuarioId, { groups: grupoActualizado });
    }

    // Estado de paginación
    paginaActual = 1;
    resultadosPorPagina = 10;

    get totalPaginas(): number { return Math.max(1, Math.ceil(this.gruposFiltrados.length / this.resultadosPorPagina)); }

    get gruposPaginados(): ContactGroup[] {
        const inicio = (this.paginaActual - 1) * this.resultadosPorPagina;
        return this.gruposFiltrados.slice(inicio, inicio + this.resultadosPorPagina);
    }

    get numerosDePagina(): number[] { return Array.from({ length: this.totalPaginas }, (_, i) => i + 1); }

    irAPagina(pagina: number) {
        if (pagina < 1 || pagina > this.totalPaginas) return;
        this.paginaActual = pagina;
    }

    paginaAnterior() { this.irAPagina(this.paginaActual - 1); }
    paginaSiguiente() { this.irAPagina(this.paginaActual + 1); }
}
