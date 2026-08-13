export interface ContactGroup {
    id: number;
    name: string;
    contactIds: number[];
}

export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
    bloodType: string;
    phonenumber: number;
    contactIds: number[];
    groups: ContactGroup[];
    state: string;
    pfp: string;
    lat: number;
    long: number;
    lastUbication: { lat: number; long: number };
    role: string;
}

export interface ContactoEmergencia {
    id_contacto: number;
    id_usuario: number;
    nombre: string;
    telefono: string;
    correo?: string;
    parentesco?: string;
    prioridad: number;
}

let usuarioActual: User | null = null;

import { apiFetch, setAuthToken, removeAuthToken } from './api';

export const UserService = {
    async apiLogin(correo: string, contrasena: string) {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ correo, contrasena }),
        });
        if (data.access_token) {
            await setAuthToken(data.access_token);
            const me = await apiFetch('/usuarios/me');
            usuarioActual = {
                id: me.id_usuario,
                username: me.nombre,
                email: me.correo,
                password: '',
                bloodType: me.tipo_sangre,
                phonenumber: me.telefono,
                contactIds: [],
                groups: [],
                state: 'Activo',
                pfp: '',
                lat: 0,
                long: 0,
                lastUbication: { lat: 0, long: 0 },
                role: me.id_rol === 1 ? 'admin' : 'user'
            };
        }
        return data;
    },

    async apiRegister(data: any) {
        return await apiFetch('/auth/registro', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getUsuarioActual(): User | null {
        return usuarioActual;
    },

    async cerrarSesion() {
        usuarioActual = null;
        await removeAuthToken();
    },

    // --- Contactos Reales ---
    async apiGetContactos(): Promise<ContactoEmergencia[]> {
        return await apiFetch('/contactos-emergencia/');
    },

    async apiAgregarContacto(nombre: string, telefono: string): Promise<ContactoEmergencia> {
        return await apiFetch('/contactos-emergencia/', {
            method: 'POST',
            body: JSON.stringify({ nombre, telefono, prioridad: 1 })
        });
    },

    async apiEliminarContacto(idContacto: number): Promise<void> {
        return await apiFetch(`/contactos-emergencia/${idContacto}`, {
            method: 'DELETE'
        });
    },

    // --- Geocercas Reales ---
    async apiGetGeocercas(): Promise<any[]> {
        return await apiFetch('/geocercas/');
    },

    async apiGuardarGeocerca(puntoCentral: any, radioMetros: number = 100): Promise<any> {
        const usuarioActual = this.getUsuarioActual();
        if (!usuarioActual) throw new Error("Sesión no iniciada");

        return await apiFetch('/geocercas/', {
            method: 'POST',
            body: JSON.stringify({
                id_usuario: usuarioActual.id,
                nombre: "Zona de Seguridad",
                tipo_zona: "segura",
                ubicacion: {
                    type: "Point",
                    coordinates: [puntoCentral.longitude, puntoCentral.latitude]
                },
                radio_metros: radioMetros,
                activa: true
            })
        });
    }
};
