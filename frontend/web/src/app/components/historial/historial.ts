import { Component, inject, computed } from '@angular/core';
import { NgFor, NgIf, CommonModule, DatePipe } from '@angular/common';
import { AlertsService, Alert } from '../../services/alerts';
import { UserService } from '../../services/user';

@Component({
    selector: 'app-historial',
    imports: [NgFor, NgIf, CommonModule, DatePipe],
    templateUrl: './historial.html'
})

export class HistorialComponent {
    alertas = inject(AlertsService);
    users = inject(UserService);

    // Estado de filtros
    ordenReciente = true;
    soloPendientes = false;
    soloEmergencias = false;

    // Estado de paginación
    paginaActual = 1;
    resultadosPorPagina = 10;

    get esAdmin(): boolean { return this.users.getUsuarioActual()?.role === 'admin'; }

    get alertasBase(): Alert[] {
        if (this.esAdmin) { return this.alertas.alerts(); }
        const usuarioActual = this.users.getUsuarioActual();
        if (!usuarioActual) return [];
        return this.alertas.alerts().filter(a => a.username === usuarioActual.username);
    }

    get alertasFiltradas(): Alert[] {
        let resultado = this.alertasBase;
        if (this.soloPendientes) { resultado = resultado.filter(a => a.state === 'Pendiente'); }
        if (this.soloEmergencias) { resultado = resultado.filter(a => a.type === 'Emergencia'); }
        resultado = [...resultado].sort((a, b) => {
            const diferencia = new Date(a.date).getTime() - new Date(b.date).getTime();
            return this.ordenReciente ? -diferencia : diferencia;
        });
        return resultado;
    }

    get totalPaginas(): number { return Math.max(1, Math.ceil(this.alertasFiltradas.length / this.resultadosPorPagina)); }

    get alertasPaginadas(): Alert[] {
        const inicio = (this.paginaActual - 1) * this.resultadosPorPagina;
        return this.alertasFiltradas.slice(inicio, inicio + this.resultadosPorPagina);
    }

    // Genera [1, 2, 3, ...] según el total de páginas, para poder iterarlo en el html
    get numerosDePagina(): number[] { return Array.from({ length: this.totalPaginas }, (_, i) => i + 1); }

    irAPagina(pagina: number) {
        if (pagina < 1 || pagina > this.totalPaginas) return;
        this.paginaActual = pagina;
    }

    paginaAnterior() { this.irAPagina(this.paginaActual - 1); }
    paginaSiguiente() { this.irAPagina(this.paginaActual + 1); }

    toggleOrden() { this.ordenReciente = !this.ordenReciente; this.paginaActual = 1; }
    togglePendientes() { this.soloPendientes = !this.soloPendientes; this.paginaActual = 1; }
    toggleEmergencias() { this.soloEmergencias = !this.soloEmergencias; this.paginaActual = 1; }

    limpiarFiltros() {
        this.ordenReciente = true;
        this.soloPendientes = false;
        this.soloEmergencias = false;
        this.paginaActual = 1;
    }
    
    toggleEstadoAlerta(alerta: Alert) {
        if (!this.esAdmin) return;
        const nuevoEstado = alerta.state === 'Atendido' ? 'Pendiente' : 'Atendido';
        this.alertas.updateAlert(alerta.number, { state: nuevoEstado });
    }
}
