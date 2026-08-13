import { Injectable, signal } from '@angular/core';

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
    lastUbication: { lat: number, long: number },
    role: string
}

export interface ContactGroup {
    id: number;
    name: string;
    contactIds: number[];
}

@Injectable({ providedIn: 'root' })

export class UserService {
    private _user = signal<User[]>([
        { id: 0, username: 'DiegoMiguel04', email: 'diegomiguel04@gmail.com', password: 'diego123#', bloodType: "O+", phonenumber: 7761396262, contactIds: [1, 2, 3, 4, 5], 
            groups: [{ id: 1, name: "Familia", contactIds: [1, 2, 3] }], state: "Activo", pfp: 'https://example.com/avatar.png', lat: 10, long: 9, lastUbication: {lat: 10, long: 8}, role: "admin" },
        { id: 1, username: 'DiegoM22', email: 'diegom22@gmail.com', password: 'diego123#', bloodType: "O+", phonenumber: 7761396262, contactIds: [], 
            groups: [], state: "Inactivo", pfp: 'https://example.com/avatar.png', lat: 10, long: 9, lastUbication: {lat: 10, long: 8}, role: "user" },
        { id: 2, username: 'DiegoMC_77', email: 'diegomc77@gmail.com', password: 'diego123#', bloodType: "O+", phonenumber: 7761396262, contactIds: [], 
            groups: [], state: "Inactivo", pfp: 'https://example.com/avatar.png', lat: 10, long: 9, lastUbication: {lat: 10, long: 8}, role: "user" },
        { id: 3, username: 'MiguelRCH123', email: 'miguelrch123@gmail.com', password: 'diego123#', bloodType: "O+", phonenumber: 7761396262, contactIds: [], 
            groups: [], state: "Inactivo", pfp: 'https://example.com/avatar.png', lat: 10, long: 9, lastUbication: {lat: 10, long: 8}, role: "user" },
        { id: 4, username: 'MRCH_DDD', email: 'mrchddd@gmail.com', password: 'diego123#', bloodType: "O+", phonenumber: 7761396262, contactIds: [], 
            groups: [], state: "Activo", pfp: 'https://example.com/avatar.png', lat: 10, long: 9, lastUbication: {lat: 10, long: 8}, role: "user" },
        { id: 5, username: 'DRCH0507', email: 'drch0507@gmail.com', password: 'diego123#', bloodType: "O+", phonenumber: 7761396262, contactIds: [], 
            groups: [], state: "Activo", pfp: 'https://example.com/avatar.png', lat: 10, long: 9, lastUbication: {lat: 10, long: 8}, role: "user" },
        { id: 6, username: 'DMCH047569', email: 'dmch047569@gmail.com', password: 'diego123#', bloodType: "O+", phonenumber: 7761396262, contactIds: [], 
            groups: [], state: "Activo", pfp: 'https://example.com/avatar.png', lat: 10, long: 9, lastUbication: {lat: 10, long: 8}, role: "user" }
    ]);
    user = this._user.asReadonly();

    // Signal para guardar quién inició sesión
    private _usuarioActualId = signal<number | null>(null);
    usuarioActualId = this._usuarioActualId.asReadonly();

    iniciarSesion(userId: number) { this._usuarioActualId.set(userId); }
    cerrarSesion() { this._usuarioActualId.set(null); }

    // Devuelve el User completo de quien inició sesión, o null si no hay sesión
    getUsuarioActual(): User | null {
        const id = this._usuarioActualId();
        if (id === null) return null;

        return this._user().find(u => u.id === id) ?? null;
    }

    // Actualizar un usuario parcialmente (no todo el usuario sino solo los campos requeridos)
    updateUser(id: number, changes: Partial<User>) {
        this._user.update(users =>
            users.map(
                user => user.id === id ? { ...user, ...changes } : user 
            )
        );
    }
    // Ejemplo de actualizacion de un usuario mediante su id:
    /* 
    this.userService.updateUser(1, {
        username: "NuevoNombre"
    }); 
    */

    // Contactos:
    // Devuelve los objetos User completos de los contactos de un usuario
    getContactos(userId: number): User[] {
        const usuario = this._user().find(u => u.id === userId);
        if (!usuario) return [];

        return this._user().filter(u => usuario.contactIds.includes(u.id));
    }

    // Agrega un contacto, validando que exista como usuario y que no esté ya agregado
    agregarContacto(userId: number, contactId: number): boolean {
        const existeUsuarioContacto = this._user().some(u => u.id === contactId);
        if (!existeUsuarioContacto || userId === contactId) {
            return false;
        }

        const usuario = this._user().find(u => u.id === userId);
        if (!usuario || usuario.contactIds.includes(contactId)) {
            return false; // ya es su contacto
        }

        this.updateUser(userId, {
            contactIds: [...usuario.contactIds, contactId]
        });
        return true;
    }

    eliminarContacto(userId: number, contactId: number) {
        const usuario = this._user().find(u => u.id === userId);
        if (!usuario) return;

        this.updateUser(userId, {
            contactIds: usuario.contactIds.filter(id => id !== contactId)
        });
    }

    // GRUPOS:
    crearGrupo(userId: number, nombreGrupo: string, contactIds: number[]): boolean {
        const usuario = this._user().find(u => u.id === userId);
        if (!usuario) return false;

        // Solo permite contactos que ya sean contactos reales del usuario
        const contactosValidos = contactIds.filter(id => usuario.contactIds.includes(id));

        const nuevoGrupo: ContactGroup = {
            id: Date.now(), // fecha estática de prueba
            name: nombreGrupo,
            contactIds: contactosValidos
        };

        this.updateUser(userId, {
            groups: [...usuario.groups, nuevoGrupo]
        });
        return true;
    }

    eliminarGrupo(userId: number, groupId: number) {
        const usuario = this._user().find(u => u.id === userId);
        if (!usuario) return;

        this.updateUser(userId, {
            groups: usuario.groups.filter(g => g.id !== groupId)
        });
    }

    // Devuelve los User completos de los contactos dentro de un grupo específico
    getContactosDeGrupo(userId: number, groupId: number): User[] {
        const usuario = this._user().find(u => u.id === userId);
        if (!usuario) return [];

        const grupo = usuario.groups.find(g => g.id === groupId);
        if (!grupo) return [];

        return this._user().filter(u => grupo.contactIds.includes(u.id));
    }
}