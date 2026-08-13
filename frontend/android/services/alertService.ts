import { UserService } from './userService';

export interface Alert {
    number: number;
    username: string;
    type: string;
    date: Date;
    lastUbication: { lat: number; long: number };
    state: string;
}

const mockUbication = { lat: 10, long: 8 };
const nombre1 = 'DiegoMiguel04';
const nombre2 = 'DiegoM22';
const nombre3 = 'DiegoMC_77';

// Datos estáticos de prueba.
// TODO: cuando exista backend real, reemplazar por una llamada fetch/axios a la API
const alertas: Alert[] = [
    { number: 0, username: nombre1, type: 'Reporte', date: new Date('2026-07-22'), lastUbication: mockUbication, state: 'Atendida' },
    { number: 1, username: nombre1, type: 'Emergencia', date: new Date('2026-07-21'), lastUbication: mockUbication, state: 'Atendida' },
    { number: 2, username: nombre2, type: 'Reporte', date: new Date('2026-07-24'), lastUbication: mockUbication, state: 'Pendiente' },
    { number: 3, username: nombre2, type: 'Reporte', date: new Date('2026-07-25'), lastUbication: mockUbication, state: 'Pendiente' },
    { number: 4, username: nombre3, type: 'Reporte', date: new Date('2026-07-22'), lastUbication: mockUbication, state: 'Pendiente' },
    { number: 5, username: nombre3, type: 'Reporte', date: new Date('2026-07-23'), lastUbication: mockUbication, state: 'Atendida' },
    { number: 6, username: nombre2, type: 'Reporte', date: new Date('2026-07-23'), lastUbication: mockUbication, state: 'Pendiente' },
    { number: 7, username: nombre3, type: 'Emergencia', date: new Date('2026-07-22'), lastUbication: mockUbication, state: 'Pendiente' },
    { number: 8, username: nombre1, type: 'Reporte', date: new Date('2026-07-21'), lastUbication: mockUbication, state: 'Pendiente' },
    { number: 9, username: nombre2, type: 'Reporte', date: new Date('2026-07-20'), lastUbication: mockUbication, state: 'Pendiente' },
    { number: 10, username: nombre1, type: 'Emergencia', date: new Date('2026-07-19'), lastUbication: mockUbication, state: 'Pendiente' },
];

export const AlertsService = {
    getAlertas(): Alert[] {
        return alertas;
    },

    updateAlert(number: number, changes: Partial<Alert>): void {
        const index = alertas.findIndex(a => a.number === number);
        if (index === -1) return;

        alertas[index] = { ...alertas[index], ...changes };
    },

    // Devuelve las N alertas más recientes, ordenadas de más nueva a más antigua
    getUltimasAlertas(cantidad: number): Alert[] {
        return [...alertas]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, cantidad);
    },
};
