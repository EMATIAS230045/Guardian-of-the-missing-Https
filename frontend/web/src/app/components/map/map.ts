import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import * as L from 'leaflet';
import { Alerta } from '../../services/alerts';

@Component({
    selector: 'app-map',
    imports: [],
    templateUrl: './map.html'
})

export class MapComponent implements AfterViewInit {
    @Input() alerta: Alerta | null = null;
    @Output() close = new EventEmitter<void>();

    cerrar() {
        this.close.emit();
    }

    private map!: L.Map;

    ngAfterViewInit() {
        const pin = L.divIcon({
            className: 'alerta-marker',
            html: '<span></span>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            popupAnchor: [0, -14]
        });

        const latitud = this.alerta?.latitud ?? 19.4326;
        const longitud = this.alerta?.longitud ?? -99.1332;
        this.map = L.map('map').setView([latitud, longitud], this.alerta ? 15 : 13);

        L.tileLayer(
            // 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            // { attribution: '&copy; OpenStreetMap & CartoDB' } 
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            { attribution: '&copy; OpenStreetMap & CartoDB' }
        ).addTo(this.map);

        const popup = this.alerta
            ? `Reporte #${this.alerta.id_alerta}<br>Usuario #${this.alerta.id_usuario}<br>Dispositivo #${this.alerta.id_dispositivo}<br>Estado: ${this.alerta.estado}<br>Riesgo: ${this.alerta.riesgo}<br>Geocerca: ${this.alerta.id_geocerca_mongo ?? 'sin geocerca'}<br>Coordenadas: ${latitud}, ${longitud}`
            : 'Sin alerta seleccionada';

        L.marker([latitud, longitud], { icon: pin }).addTo(this.map).bindPopup(popup).openPopup();
    }
}
