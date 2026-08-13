import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.heat';

@Component({
    selector: 'app-geocercas',
    imports: [],
    templateUrl: './geocercas.html'
})

export class GeocercasComponent implements AfterViewInit {
    @Output() close = new EventEmitter<void>();
    @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

    private map!: L.Map;
    private capaMarcadores!: L.LayerGroup;
    private capaCalor: any;

    mostrandoMapaCalor = false;

    // Puntos de ejemplo para el mapa de calor: [lat, lng, intensidad]
    private puntosCalor: [number, number, number][] = [
        [19.4326, -99.1332, 0.8],
        [19.4340, -99.1350, 0.6],
        [19.4300, -99.1310, 1.0],
        [19.4360, -99.1290, 0.4],
        [19.4290, -99.1360, 0.7],
    ];

    ngAfterViewInit() {
        const pin = L.icon({
            iconUrl: '../../public/pin.png',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });

        this.map = L.map(this.mapContainer.nativeElement).setView([19.4326, -99.1332], 13);

        L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            { attribution: '&copy; OpenStreetMap & CartoDB' }
        ).addTo(this.map);

        // Agrupamos los marcadores normales en una capa, para poder mostrarla/ocultarla fácilmente
        this.capaMarcadores = L.layerGroup([
            L.marker([19.4326, -99.1332], { icon: pin }).bindPopup('Diego')
        ]);

        this.capaMarcadores.addTo(this.map);

        // Creamos la capa de mapa de calor, pero no la agregamos al mapa todavía
        this.capaCalor = (L as any).heatLayer(this.puntosCalor, { radius: 25 });
    }

    toggleMapaCalor() {
        this.mostrandoMapaCalor = !this.mostrandoMapaCalor;

        if (this.mostrandoMapaCalor) {
            this.map.removeLayer(this.capaMarcadores);
            this.capaCalor.addTo(this.map);
        } else {
            this.map.removeLayer(this.capaCalor);
            this.capaMarcadores.addTo(this.map);
        }
    }
}