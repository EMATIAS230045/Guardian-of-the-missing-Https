import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket!: WebSocket;
  public alerts$ = new Subject<any>(); // Observable for components to subscribe to

  constructor() {
    this.connect();
  }

  private connect() {
    // La URL se obtiene del entorno (development → ws://localhost:8000, production → wss://guardian-api.onrender.com)
    const wsUrl = `${environment.wsUrl}/ws/web`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = (event) => {
      console.log('Connected to WebSocket server', event);
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);
        if (message.event === 'NEW_ALERT') {
          this.alerts$.next(message.data);
        }
      } catch (e) {
        console.error('Error parsing WebSocket message', e);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket connection closed, reconnecting in 5s...', event);
      setTimeout(() => this.connect(), 5000);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error observed:', error);
    };
  }

  public sendMessage(msg: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    }
  }
}
