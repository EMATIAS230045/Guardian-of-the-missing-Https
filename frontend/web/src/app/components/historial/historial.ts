import { Component, inject, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, CommonModule, DatePipe } from '@angular/common';
import { AlertsService, Alerta } from '../../services/alerts';
import { UserService } from '../../services/user';

@Component({
    selector: 'app-historial',
    imports: [NgFor, NgIf, CommonModule, DatePipe],
    templateUrl: './historial.html'
})

export class HistorialComponent implements OnInit {
    alertas = inject(AlertsService);
    users = inject(UserService);
    private cdr = inject(ChangeDetectorRef);

    allAlertas: Alerta[] = [];

    // Estado de filtros
    ordenReciente = true;
    soloPendientes = false;
    soloEmergencias = false;

    // Estado de paginación
    paginaActual = 1;
    resultadosPorPagina = 10;

    ngOnInit() {
        this.fetchAlertas();
    }

    fetchAlertas() {
        // Obtenemos un gran bloque de alertas (ej. 1000) o implementamos paginación en el backend real.
        this.alertas.getAlertas(0, 1000).subscribe({
            next: (data) => {
                this.allAlertas = data;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error fetching alertas en historial:', err)
        });
    }

    get esAdmin(): boolean { return this.users.getUsuarioActual()?.role === 'admin'; }

    get alertasBase(): Alerta[] {
        if (this.esAdmin) { return this.allAlertas; }
        const usuarioActual = this.users.getUsuarioActual();
        if (!usuarioActual) return [];
        // Filtramos localmente por id_usuario si no somos admin
        return this.allAlertas.filter((a: Alerta) => a.id_usuario === usuarioActual.id);
    }

    get alertasFiltradas(): Alerta[] {
        let resultado = this.alertasBase;
        if (this.soloPendientes) { resultado = resultado.filter((a: Alerta) => a.estado === 'pendiente'); }
        if (this.soloEmergencias) { resultado = resultado.filter((a: Alerta) => a.nivel_riesgo === 'alto'); }
        
        resultado = [...resultado].sort((a: Alerta, b: Alerta) => {
            const diferencia = new Date(a.fecha_emision).getTime() - new Date(b.fecha_emision).getTime();
            return this.ordenReciente ? -diferencia : diferencia;
        });
        
        return resultado;
    }

    get totalPaginas(): number { return Math.max(1, Math.ceil(this.alertasFiltradas.length / this.resultadosPorPagina)); }

    get alertasPaginadas(): Alerta[] {
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
    
    toggleEstadoAlerta(alerta: Alerta) {
        if (!this.esAdmin) return;
        const nuevoEstado = alerta.estado === 'atendida' ? 'pendiente' : 'atendida';
        
        // Actualizamos en la BD
        this.alertas.updateAlerta(alerta.id_alerta, { estado: nuevoEstado }).subscribe({
            next: () => {
                // Actualizamos localmente para reflejar en la UI
                alerta.estado = nuevoEstado;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error actualizando alerta', err)
        });
    }
}

