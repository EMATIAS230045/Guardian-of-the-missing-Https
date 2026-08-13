import { Injectable, signal, inject } from '@angular/core';
import { UserService } from './user';

export interface Alert {
    number: number;
    username: string;
    type: string;
    date: Date;
    lastUbication: { lat: number, long: number },
    state: string
}

@Injectable({
    providedIn: 'root'
})

export class AlertsService {
    private userService = inject(UserService)
    private _alert = signal<Alert[]>([
        { number: 0, username: this.userService.user()[0].username, type: "Reporte", date: new Date('2026-07-22'), lastUbication: this.userService.user()[0].lastUbication, state: "Atendido" },
        { number: 1, username: this.userService.user()[0].username, type: "Emergencia", date: new Date('2026-07-21'), lastUbication: this.userService.user()[0].lastUbication, state: "Atendido" },
        { number: 2, username: this.userService.user()[1].username, type: "Reporte", date: new Date('2026-07-24'), lastUbication: this.userService.user()[0].lastUbication, state: "Pendiente" },
        { number: 3, username: this.userService.user()[4].username, type: "Reporte", date: new Date('2026-07-25'), lastUbication: this.userService.user()[0].lastUbication, state: "Pendiente" },
        { number: 4, username: this.userService.user()[6].username, type: "Reporte", date: new Date('2026-07-22'), lastUbication: this.userService.user()[0].lastUbication, state: "Pendiente" },
        { number: 5, username: this.userService.user()[3].username, type: "Reporte", date: new Date('2026-07-23'), lastUbication: this.userService.user()[0].lastUbication, state: "Atendido" },
        { number: 6, username: this.userService.user()[3].username, type: "Reporte", date: new Date('2026-07-23'), lastUbication: this.userService.user()[0].lastUbication, state: "Pendiente" },
        { number: 7, username: this.userService.user()[2].username, type: "Emergencia", date: new Date('2026-07-22'), lastUbication: this.userService.user()[0].lastUbication, state: "Pendiente" },
        { number: 8, username: this.userService.user()[0].username, type: "Reporte", date: new Date('2026-07-21'), lastUbication: this.userService.user()[0].lastUbication, state: "Pendiente" },
        { number: 9, username: this.userService.user()[1].username, type: "Reporte", date: new Date('2026-07-20'), lastUbication: this.userService.user()[0].lastUbication, state: "Pendiente" },
        { number: 10, username: this.userService.user()[6].username, type: "Reporte", date: new Date('2026-07-22'), lastUbication: this.userService.user()[0].lastUbication, state: "Pendiente" },
        { number: 11, username: this.userService.user()[2].username, type: "Reporte", date: new Date('2026-07-25'), lastUbication: this.userService.user()[0].lastUbication, state: "Pendiente" },
        { number: 12, username: this.userService.user()[5].username, type: "Reporte", date: new Date('2026-07-26'), lastUbication: this.userService.user()[0].lastUbication, state: "Atendido" },
        { number: 13, username: this.userService.user()[5].username, type: "Reporte", date: new Date('2026-07-22'), lastUbication: this.userService.user()[0].lastUbication, state: "Pendiente" },
        { number: 0, username: this.userService.user()[1].username, type: "Emergencia", date: new Date('2026-07-19'), lastUbication: this.userService.user()[0].lastUbication, state: "Pendiente" },
    ]);

    // Solo lectura para los componentes
    alerts = this._alert.asReadonly();

    // Actualizar una alerta parcialmente (no toda la alerta sino solo los campos requeridos)
    updateAlert(number: number, changes: Partial<Alert>) {
        this._alert.update(alerts =>
            alerts.map(
                alert => alert.number === number ? { ...alert, ...changes } : alert
            )
        );
    }
    // Ejemplo de actualizacion de una alerta mediante su number:
    /* 
    this.alertService.updateAlert(1, {
        state: "NuevoEstado"
    }); 
    */
}