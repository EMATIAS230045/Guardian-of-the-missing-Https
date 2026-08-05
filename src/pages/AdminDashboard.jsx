import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Activity, Clock, FileAudio, Users, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function AdminDashboard() {
  const { alertsHistory } = useContext(AppContext);
  
  const activeAlerts = alertsHistory.filter(a => a.status === 'activa');

  return (
    <div className="container">
      <div className="flex items-center gap-2" style={{ marginBottom: '2rem' }}>
        <Activity size={32} color="var(--primary)" />
        <h1 style={{ marginBottom: 0 }}>Consola Administrativa</h1>
      </div>

      <div className="grid grid-cols-3" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel flex flex-col items-center justify-center">
          <AlertTriangle size={32} color="var(--danger)" />
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{activeAlerts.length}</h2>
          <span className="text-muted">Alertas Activas</span>
        </div>
        <div className="glass-panel flex flex-col items-center justify-center">
          <Clock size={32} color="var(--warning)" />
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>4m</h2>
          <span className="text-muted">Tiempo Promedio Respuesta</span>
        </div>
        <div className="glass-panel flex flex-col items-center justify-center">
          <Users size={32} color="var(--primary)" />
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>1.2k</h2>
          <span className="text-muted">Usuarios Activos (24h)</span>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        <div className="glass-panel">
          <h2>Mapa de Incidentes en Vivo</h2>
          <div style={{ height: '400px', borderRadius: '1rem', overflow: 'hidden', marginTop: '1rem' }}>
            <MapContainer center={[19.43, -99.13]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {activeAlerts.map(alert => (
                <Marker key={alert.id} position={[alert.lat, alert.lng]}>
                  <Popup>
                    <strong>Incidente Activo</strong><br/>
                    Usuario ID: {alert.userId}<br/>
                    Hora: {new Date(alert.timestamp).toLocaleTimeString()}
                  </Popup>
                </Marker>
              ))}
              {/* Heatmap simulation using semi-transparent circles */}
              <Circle center={[19.42, -99.14]} radius={1000} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.3, stroke: false }} />
              <Circle center={[19.45, -99.10]} radius={800} pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.3, stroke: false }} />
            </MapContainer>
          </div>
        </div>

        <div className="glass-panel flex flex-col" style={{ maxHeight: '500px' }}>
          <h2>Bóveda de Evidencias</h2>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>Audios y fotos recolectados durante incidentes recientes.</p>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {alertsHistory.length === 0 ? (
              <p className="text-muted text-center" style={{ marginTop: '2rem' }}>No hay incidentes registrados en esta sesión.</p>
            ) : (
              alertsHistory.map(alert => (
                <div key={alert.id} className="flex justify-between items-center" style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', marginBottom: '0.5rem', borderRadius: '0.5rem' }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ 
                        width: 10, height: 10, borderRadius: '50%', 
                        background: alert.status === 'activa' ? 'var(--danger)' : 'var(--success)' 
                      }}></span>
                      <strong>Alerta #{alert.id.toString().slice(-4)}</strong>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="btn" style={{ padding: '0.5rem' }} title="Descargar Audio">
                      <FileAudio size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
