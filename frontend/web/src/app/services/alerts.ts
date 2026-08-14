import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Alerta {
    id_alerta: number;
    id_usuario: number;
    id_dispositivo: number;
    latitud: number;
    longitud: number;
    riesgo: string;          // 'alto' | 'medio' | 'bajo'
    estado: string;          // 'activa' | 'atendida' | 'cancelada' | 'falsa_alarma'
    comentario: string | null;
    id_geocerca_mongo: string | null;
    fecha_hora: string | null; // ISO datetime string
}

@Injectable({
    providedIn: 'root'
})
export class AlertsService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // Obtener todas las alertas del backend
    getAlertas(skip: number = 0, limit: number = 100): Observable<Alerta[]> {
        return this.http.get<Alerta[]>(`${this.apiUrl}/alertas/?skip=${skip}&limit=${limit}`);
    }

    // Actualizar una alerta
    updateAlerta(id_alerta: number, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/alertas/${id_alerta}`, data);
    }
}