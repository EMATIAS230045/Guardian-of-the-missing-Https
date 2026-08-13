import { Component, Output, EventEmitter, computed, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { UserService } from '../../services/user';
import { WebsocketService } from '../../services/websocket.service';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
Chart.register(...registerables);

@Component({
    selector: 'app-dashboard',
    imports: [NgFor, NgIf, UpperCasePipe, BaseChartDirective],
    templateUrl: './dashboard.html'
})

export class DashboardComponent implements OnInit, OnDestroy {
    private users = inject(UserService)
    private ws = inject(WebsocketService)
    private cdr = inject(ChangeDetectorRef)
    private wsSub!: Subscription;

    lastUsers = computed(() =>
        this.users.user().slice(-5)
    );

    activeAlert: any = null;
    alertAddress: string = '';

    ngOnInit() {
        this.wsSub = this.ws.alerts$.subscribe(async (alertData) => {
            console.warn('Realtime alert received:', alertData);
            this.activeAlert = alertData;
            this.alertAddress = 'Calculando ubicación...';
            this.cdr.detectChanges(); // FORZAR RENDER

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${alertData.latitud}&lon=${alertData.longitud}&format=json`);
                const data = await res.json();
                this.alertAddress = data.display_name || 'Ubicación desconocida';
            } catch (e) {
                this.alertAddress = `Coordenadas: ${alertData.latitud}, ${alertData.longitud}`;
            }
            this.cdr.detectChanges(); // FORZAR RENDER LUEGO DEL FETCH
        });
    }

    closeAlert() {
        this.activeAlert = null;
        this.cdr.detectChanges();
    }

    ngOnDestroy() {
        if (this.wsSub) {
            this.wsSub.unsubscribe();
        }
    }

    @Output() openMap = new EventEmitter<void>();
    openMapNow() { this.openMap.emit(); }

    // --- Opciones comunes ---
    barOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#fff' } } },
        scales: {
            x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.15)' } },
            y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.15)' } },
        },
    };
    lineOptions: ChartConfiguration<'line'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#fff' } } },
        scales: {
            x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.15)' } },
            y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.15)' } },
        },
    };
    pieOptions: ChartConfiguration<'doughnut' | 'pie'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#fff' } } },
    };
    
    // --- 1. Usuarios activos por semana (barras) ---
    usuariosPorSemanaData: ChartData<'bar'> = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
            data: [40, 55, 48, 70, 65, 80, 60],
            backgroundColor: '#8fd8c9',
        }],
    };

    // --- 2. Distribución de tipos de alerta (dona) ---
    tiposDeAlertaData: ChartData<'doughnut'> = {
        labels: ['Emergencia', 'Otros'],
        datasets: [{
            data: [62, 38],
            backgroundColor: ['#8fd8c9', '#e63946'],
        }],
    };

    // --- 3. Alertas por estado (pastel) ---
    alertasPorEstadoData: ChartData<'pie'> = {
        labels: ['Pendiente', 'Emergencia', 'Resuelta'],
        datasets: [{
            data: [47, 33, 20],
            backgroundColor: ['#8fd8c9', '#e63946', '#2c8273'],
        }],
    };

    // --- 4. Actividad últimos 7 días (barras redondeadas) ---
    actividadUltimos7DiasData: ChartData<'bar'> = {
        labels: ['1', '2', '3', '4', '5', '6', '7'],
        datasets: [{
            data: [20, 45, 28, 80, 55, 90, 60],
            backgroundColor: '#8fd8c9',
            borderRadius: 8,
        }],
    };

    // --- 5. Comparativa alertas: mes actual vs mes anterior (dos líneas) ---
    comparativaMesesData: ChartData<'line'> = {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        datasets: [
            { data: [20, 45, 28, 80], label: 'Mes actual', borderColor: '#8fd8c9', backgroundColor: 'transparent' },
            { data: [15, 30, 45, 60], label: 'Mes anterior', borderColor: '#e63946', backgroundColor: 'transparent' },
        ],
    };

    // --- 6. % de usuarios con contactos configurados (dona de progreso) ---
    porcentajeConContactosData: ChartData<'doughnut'> = {
        labels: ['Con contactos', 'Sin contactos'],
        datasets: [{
            data: [78, 22],
            backgroundColor: ['#8fd8c9', 'rgba(255,255,255,0.2)'],
        }],
    };

    // --- Opciones extra ---
    radarOptions: ChartConfiguration<'radar'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#fff' } } },
        scales: {
            r: {
                ticks: { color: '#fff', backdropColor: 'transparent' },
                grid: { color: 'rgba(255,255,255,0.15)' },
                angleLines: { color: 'rgba(255,255,255,0.15)' },
                pointLabels: { color: '#fff' },
            },
        },
    };
    polarOptions: ChartConfiguration<'polarArea'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#fff' } } },
        scales: {
            r: {
                ticks: { color: '#fff', backdropColor: 'transparent' },
                grid: { color: 'rgba(255,255,255,0.15)' },
            },
        },
    };
    scatterOptions: ChartConfiguration<'scatter'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#fff' } } },
        scales: {
            x: { title: { display: true, text: 'Distancia (km)', color: '#fff' }, ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.15)' } },
            y: { title: { display: true, text: 'Tiempo (min)', color: '#fff' }, ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.15)' } },
        },
    };
    bubbleOptions: ChartConfiguration<'bubble'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#fff' } } },
        scales: {
            x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.15)' } },
            y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.15)' } },
        },
    };
    barHorizontalOptions: ChartConfiguration<'bar'>['options'] = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#fff' } } },
        scales: {
            x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.15)' } },
            y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.15)' } },
        },
    };

    // --- 7. Área de cobertura por zona (radar) ---
    radarZonasData: ChartData<'radar'> = {
        labels: ['Norte', 'Sur', 'Este', 'Oeste', 'Centro'],
        datasets: [{
            data: [65, 40, 55, 30, 80],
            label: 'Cobertura',
            backgroundColor: 'rgba(143,216,201,0.3)',
            borderColor: '#8fd8c9',
        }],
    };

    // --- 8. Carga de alertas por hora del día (área polar) ---
    polarHorasData: ChartData<'polarArea'> = {
        labels: ['Madrugada', 'Mañana', 'Tarde', 'Noche'],
        datasets: [{
            data: [10, 25, 35, 30],
            backgroundColor: ['#1f594f', '#2c8273', '#8fd8c9', '#e63946'],
        }],
    };

    // --- 9. Tiempo de respuesta vs distancia (dispersión) ---
    scatterRespuestaData: ChartData<'scatter'> = {
        datasets: [{
            label: 'Casos',
            data: [
                { x: 1, y: 5 }, { x: 2, y: 8 }, { x: 3, y: 6 },
                { x: 4, y: 12 }, { x: 5, y: 10 }, { x: 6, y: 15 },
            ],
            backgroundColor: '#8fd8c9',
        }],
    };

    // --- 10. Usuarios por grupo, tamaño = actividad (burbujas) ---
    bubbleGruposData: ChartData<'bubble'> = {
        datasets: [{
            label: 'Grupos',
            data: [
                { x: 10, y: 20, r: 8 },
                { x: 25, y: 35, r: 14 },
                { x: 40, y: 15, r: 6 },
                { x: 15, y: 45, r: 10 },
            ],
            backgroundColor: 'rgba(143,216,201,0.6)',
        }],
    };

    // --- 11. Crecimiento acumulado de usuarios (línea con área) ---
    areaAcumuladaData: ChartData<'line'> = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [{
            data: [12, 28, 45, 70, 95, 130],
            label: 'Usuarios totales',
            borderColor: '#8fd8c9',
            backgroundColor: 'rgba(143,216,201,0.3)',
            fill: true,
            tension: 0.3,
        }],
    };

    // --- 12. Alertas por tipo (barras horizontales) ---
    barrasHorizontalesData: ChartData<'bar'> = {
        labels: ['Emergencia', 'Robo', 'Accidente', 'Persona extraviada'],
        datasets: [{
            data: [35, 20, 15, 30],
            backgroundColor: '#8fd8c9',
        }],
    };
}