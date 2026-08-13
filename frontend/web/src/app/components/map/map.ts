import { AfterViewInit, Component, EventEmitter, Output } from '@angular/core';
import * as L from 'leaflet';

@Component({
    selector: 'app-map',
    imports: [],
    templateUrl: './map.html'
})

export class MapComponent implements AfterViewInit {
    @Output() close = new EventEmitter<void>();

    cerrar() {
        this.close.emit();
    }

    private map!: L.Map;

    ngAfterViewInit() {
        const pin = L.icon({
            iconUrl: '../../public/pin.png',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });

        this.map = L.map('map').setView([19.4326, -99.1332], 13);

        L.tileLayer(
            // 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            // { attribution: '&copy; OpenStreetMap & CartoDB' } 
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            { attribution: '&copy; OpenStreetMap & CartoDB' }
        ).addTo(this.map);

        L.marker([19.4326, -99.1332], {icon: pin}).addTo(this.map).bindPopup('Diego').openPopup();
    }
}
