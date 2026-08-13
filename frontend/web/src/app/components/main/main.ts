import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar';
import { SidebarComponent } from '../sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { ProfileComponent } from '../profile/profile';
import { MapComponent } from '../map/map';

@Component({
    selector: 'app-main',
    imports: [SidebarComponent, NavbarComponent, ProfileComponent, MapComponent, RouterOutlet, NgIf],
    templateUrl: './main.html'
})

export class MainComponent {
    showProfile = false;
    showMap = false;

    onActivate(component: any) {
        if (component.openMap) {
            component.openMap.subscribe(() => {
                this.showMap = true;
            });
        }
    }
}
