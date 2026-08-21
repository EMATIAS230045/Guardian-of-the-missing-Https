import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.heat';
import { AlertsService, Alerta } from '../../services/alerts';
import { UserService } from '../../services/user';

@Component({
    selector: 'app-geocercas',
    imports: [NgIf],
    templateUrl: './geocercas.html'
})

export class GeocercasComponent implements AfterViewInit {
    @Output() close = new EventEmitter<void>();
    @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

    private map!: L.Map;
    private capaMarcadores!: L.LayerGroup;
    private capaCalor: any;
    private capaPuntosRojos!: L.LayerGroup;
    private alertasService = inject(AlertsService);
    private userService = inject(UserService);

    mostrandoMapaCalor = false;
    alertas: Alerta[] = [];
    cargando = true;
    errorCarga = false;

    ngAfterViewInit() {
        const pin = L.divIcon({
            className: 'reporte-marker',
            html: '<span></span>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            popupAnchor: [0, -14]
        });

        this.map = L.map(this.mapContainer.nativeElement).setView([19.4326, -99.1332], 13);

        L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            { attribution: '&copy; OpenStreetMap & CartoDB' }
        ).addTo(this.map);

        this.cargarAlertas(pin);
    }

    private cargarAlertas(pin: L.DivIcon) {
        this.alertasService.getAlertas(0, 1000).subscribe({
            next: (alertas) => {
                const usuarioActual = this.userService.getUsuarioActual();
                this.alertas = usuarioActual?.role === 'admin'
                    ? alertas
                    : alertas.filter(alerta => !usuarioActual || alerta.id_usuario === usuarioActual.id);
                this.crearCapas(pin);
                this.cargando = false;
            },
            error: (error) => {
                console.error('[GEOCERCAS] Error al obtener alertas:', error);
                this.errorCarga = true;
                this.cargando = false;
            }
        });
    }

    private crearCapas(pin: L.DivIcon) {
        const alertasConCoordenadas = this.alertas.filter(alerta =>
            Number.isFinite(alerta.latitud) && Number.isFinite(alerta.longitud) &&
            alerta.latitud >= -90 && alerta.latitud <= 90 &&
            alerta.longitud >= -180 && alerta.longitud <= 180
        );

        const marcadores = alertasConCoordenadas.map(alerta => {
            const popup = document.createElement('div');
            popup.textContent = `Reporte #${alerta.id_alerta} | Usuario #${alerta.id_usuario} | Dispositivo #${alerta.id_dispositivo} | Geocerca: ${alerta.id_geocerca_mongo ?? 'sin geocerca'}`;
            return L.marker([alerta.latitud, alerta.longitud], { icon: pin }).bindPopup(popup);
        });

        this.capaMarcadores = L.layerGroup(marcadores).addTo(this.map);
        this.capaPuntosRojos = L.layerGroup(
            alertasConCoordenadas.flatMap(alerta => {
                const coordenadas: L.LatLngExpression = [alerta.latitud, alerta.longitud];
                return [
                    L.circle(coordenadas, {
                        radius: 500,
                        color: '#dc2626',
                        fillColor: '#ef4444',
                        fillOpacity: 0.22,
                        weight: 3
                    }),
                    L.circleMarker(coordenadas, {
                        radius: 10,
                        color: '#991b1b',
                        fillColor: '#dc2626',
                        fillOpacity: 1,
                        weight: 3
                    }).bindTooltip(`Reporte #${alerta.id_alerta}`, { direction: 'top' })
                ];
            })
        );
        const puntosCalor: [number, number, number][] = alertasConCoordenadas.map(alerta => [
            alerta.latitud,
            alerta.longitud,
            alerta.riesgo?.toLowerCase() === 'alto' ? 1 : alerta.riesgo?.toLowerCase() === 'medio' ? 0.7 : 0.4
        ]);
        this.capaCalor = (L as any).heatLayer(puntosCalor, { radius: 25 });

        if (alertasConCoordenadas.length > 0) {
            this.map.fitBounds(L.latLngBounds(alertasConCoordenadas.map(alerta => [alerta.latitud, alerta.longitud] as [number, number])), { padding: [24, 24] });
        }
    }

    toggleMapaCalor() {
        this.mostrandoMapaCalor = !this.mostrandoMapaCalor;

        if (this.mostrandoMapaCalor) {
            this.map.removeLayer(this.capaMarcadores);
            this.capaCalor.addTo(this.map);
            this.capaPuntosRojos.addTo(this.map);
        } else {
            this.map.removeLayer(this.capaCalor);
            this.map.removeLayer(this.capaPuntosRojos);
            this.capaMarcadores.addTo(this.map);
        }
    }
}