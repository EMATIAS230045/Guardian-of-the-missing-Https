import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { MainComponent } from './components/main/main';
import { DashboardComponent } from './components/dashboard/dashboard';
import { UsuariosComponent } from './components/usuarios/usuarios';
import { HistorialComponent } from './components/historial/historial';
import { GeocercasComponent } from './components/geocercas/geocercas';
import { ContactsComponent } from './components/contacts/contacts';
import { GroupsComponent } from './components/groups/groups';
import { SendcodeComponent } from './components/sendcode/sendcode';
import { NewpasswordComponent } from './components/newpassword/newpassword';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'verification', component: SendcodeComponent },
    { path: 'recovery', component: NewpasswordComponent },
    { path: 'home', component: MainComponent,
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'users', component: UsuariosComponent },
            { path: 'historial', component: HistorialComponent },
            { path: 'geofences', component: GeocercasComponent },
            { path: 'contacts', component: ContactsComponent },
            { path: 'groups', component: GroupsComponent },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
     },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' }
];
