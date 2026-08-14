import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
    cargando = true;
    errorCarga = false;

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
        this.cargando = true;
        this.errorCarga = false;

        this.alertas.getAlertas(0, 1000).subscribe({
            next: (data) => {
                console.log('[HISTORIAL] Alertas obtenidas:', data);
                console.log('[HISTORIAL] Total de alertas:', data.length);
                if (data.length > 0) {
                    console.log('[HISTORIAL] Ejemplo de alerta (campo keys):', Object.keys(data[0]));
                    console.log('[HISTORIAL] Primera alerta:', data[0]);
                }
                this.allAlertas = data;
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('[HISTORIAL] Error al obtener alertas:', err);
                this.cargando = false;
                this.errorCarga = true;
                this.cdr.detectChanges();
            }
        });
    }

    get esAdmin(): boolean { return this.users.getUsuarioActual()?.role === 'admin'; }

    get alertasBase(): Alerta[] {
        if (this.esAdmin) { return this.allAlertas; }
        const usuarioActual = this.users.getUsuarioActual();
        if (!usuarioActual) return this.allAlertas; // Sin sesión: mostrar todas de todos modos
        return this.allAlertas.filter((a: Alerta) => a.id_usuario === usuarioActual.id);
    }

    get alertasFiltradas(): Alerta[] {
        let resultado = this.alertasBase;

        // Filtro de pendientes: estado 'activa' equivale a pendiente en el backend
        if (this.soloPendientes) {
            resultado = resultado.filter(
                (a: Alerta) => a.estado?.toLowerCase() === 'activa'
            );
        }
        // Filtro de emergencias: riesgo 'alto'
        if (this.soloEmergencias) {
            resultado = resultado.filter(
                (a: Alerta) => a.riesgo?.toLowerCase() === 'alto'
            );
        }

        // Ordenar por fecha_hora (puede ser null, va al final)
        resultado = [...resultado].sort((a: Alerta, b: Alerta) => {
            const dateA = a.fecha_hora ? new Date(a.fecha_hora).getTime() : 0;
            const dateB = b.fecha_hora ? new Date(b.fecha_hora).getTime() : 0;
            return this.ordenReciente ? dateB - dateA : dateA - dateB;
        });

        return resultado;
    }

    get totalPaginas(): number { return Math.max(1, Math.ceil(this.alertasFiltradas.length / this.resultadosPorPagina)); }

    get alertasPaginadas(): Alerta[] {
        const inicio = (this.paginaActual - 1) * this.resultadosPorPagina;
        return this.alertasFiltradas.slice(inicio, inicio + this.resultadosPorPagina);
    }

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
        const nuevoEstado = alerta.estado?.toLowerCase() === 'atendida' ? 'activa' : 'atendida';

        this.alertas.updateAlerta(alerta.id_alerta, { estado: nuevoEstado }).subscribe({
            next: () => {
                alerta.estado = nuevoEstado;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('[HISTORIAL] Error actualizando alerta', err)
        });
    }
}
