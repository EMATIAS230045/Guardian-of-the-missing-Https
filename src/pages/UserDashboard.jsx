import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Users, Phone, ShieldAlert, X } from 'lucide-react';

// Fix for default marker icon in react-leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function UserDashboard() {
  const { user, contacts, addContact, removeContact, activeAlert, triggerSOS, cancelSOS, location } = useContext(AppContext);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  // Contact Form
  const [newContact, setNewContact] = useState({ nombre: '', telefono: '', parentesco: '' });

  const handleSOS = () => {
    if (!activeAlert) {
      triggerSOS();
    }
  };

  const handleCancelSOS = () => {
    if (cancelSOS(pinInput)) {
      setShowPinModal(false);
      setPinInput('');
    } else {
      alert("PIN Incorrecto");
    }
  };

  const handleAddContact = (e) => {
    e.preventDefault();
    const success = addContact(newContact);
    if (success) {
      setNewContact({ nombre: '', telefono: '', parentesco: '' });
    } else {
      alert("Límite de 8 contactos alcanzado.");
    }
  };

  return (
    <div className="container">
      <div className="grid grid-cols-1" style={{ gap: '2rem' }}>
        
        {/* Emergency Module (Módulo 5) */}
        <div className="glass-panel flex flex-col items-center justify-center" style={{ minHeight: '300px' }}>
          <h2>Módulo de Emergencia</h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>Presiona el botón en caso de pánico.</p>
          
          <button 
            className={`btn-sos flex flex-col items-center justify-center ${activeAlert ? 'active' : ''}`}
            onClick={activeAlert ? () => setShowPinModal(true) : handleSOS}
            style={activeAlert ? { backgroundColor: 'var(--warning)', animation: 'none', boxShadow: 'none' } : {}}
          >
            <ShieldAlert size={48} />
            <span>{activeAlert ? 'CANCELAR' : 'SOS'}</span>
          </button>
          {activeAlert && <p style={{ marginTop: '1rem', color: 'var(--warning)' }}>Alerta Activa. Transmitiendo GPS...</p>}
        </div>

        {/* Directory Module (Módulo 2) */}
        <div className="glass-panel">
          <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
            <Users size={24} color="var(--primary)" />
            <h2>Directorio de Confianza</h2>
          </div>
          
          <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
            <div>
              <form onSubmit={handleAddContact}>
                <div className="input-group">
                  <label className="input-label">Nombre</label>
                  <input required className="input-field" value={newContact.nombre} onChange={e => setNewContact({...newContact, nombre: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Teléfono</label>
                  <input required type="tel" className="input-field" value={newContact.telefono} onChange={e => setNewContact({...newContact, telefono: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Parentesco</label>
                  <input className="input-field" value={newContact.parentesco} onChange={e => setNewContact({...newContact, parentesco: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={contacts.length >= 8}>Agregar Contacto</button>
              </form>
            </div>
            
            <div>
              <h4>Tus Contactos ({contacts.length}/8)</h4>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                {contacts.map(c => (
                  <li key={c.id} className="flex justify-between items-center" style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', marginBottom: '0.5rem', borderRadius: '0.5rem' }}>
                    <div>
                      <strong>{c.nombre}</strong> <small className="text-muted">({c.parentesco})</small>
                      <div className="flex items-center gap-2 text-muted" style={{ fontSize: '0.875rem' }}><Phone size={14}/> {c.telefono}</div>
                    </div>
                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => removeContact(c.id)}>
                      <X size={16} />
                    </button>
                  </li>
                ))}
                {contacts.length === 0 && <p className="text-muted">No tienes contactos agregados.</p>}
              </ul>
            </div>
          </div>
        </div>

        {/* Map Module (Módulo 3 & 4) */}
        <div className="glass-panel">
          <h2>Tu Ubicación y Geocercas</h2>
          <div style={{ height: '400px', borderRadius: '1rem', overflow: 'hidden', marginTop: '1rem' }}>
            <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <Marker position={[location.lat, location.lng]}>
                <Popup>Tu ubicación actual</Popup>
              </Marker>
              {/* Simulate a danger zone */}
              <Circle center={[19.42, -99.14]} radius={500} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}>
                <Popup>Zona de Riesgo (DBSCAN)</Popup>
              </Circle>
              {/* Simulate a safe zone */}
              <Circle center={[19.44, -99.12]} radius={800} pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.2 }}>
                <Popup>Geocerca Segura (Casa)</Popup>
              </Circle>
            </MapContainer>
          </div>
        </div>

      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel flex flex-col items-center gap-4">
            <h3>Cancelar Emergencia</h3>
            <p>Ingresa tu PIN de seguridad (por defecto: 1234)</p>
            <input 
              type="password" 
              className="input-field" 
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              maxLength={4}
            />
            <div className="flex gap-4">
              <button className="btn btn-primary" onClick={handleCancelSOS}>Confirmar</button>
              <button className="btn" onClick={() => setShowPinModal(false)}>Volver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
