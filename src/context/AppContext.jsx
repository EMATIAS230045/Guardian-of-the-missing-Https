import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, name, role: 'Usuario' | 'Administrador', token, pin: '1234' }
  const [contacts, setContacts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [location, setLocation] = useState({ lat: 19.4326, lng: -99.1332 }); // Default CDMX
  const [alertsHistory, setAlertsHistory] = useState([]);

  // Mock initial data
  useEffect(() => {
    const savedUser = localStorage.getItem('gotm_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email, password) => {
    // Mock login
    const mockUser = {
      id: 1,
      name: email.split('@')[0],
      email,
      role: email.includes('admin') ? 'Administrador' : 'Usuario',
      token: 'mock-jwt-token-123',
      pin: '1234' // Default PIN for cancellation
    };
    setUser(mockUser);
    localStorage.setItem('gotm_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gotm_user');
  };

  const addContact = (contact) => {
    if (contacts.length >= 8) return false;
    setContacts([...contacts, { ...contact, id: Date.now() }]);
    return true;
  };

  const removeContact = (id) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const triggerSOS = () => {
    const newAlert = {
      id: Date.now(),
      userId: user.id,
      lat: location.lat,
      lng: location.lng,
      timestamp: new Date().toISOString(),
      status: 'activa'
    };
    setActiveAlert(newAlert);
    setAlertsHistory([newAlert, ...alertsHistory]);
    // Simulate high frequency GPS and WebSocket broadcast
  };

  const cancelSOS = (pin) => {
    if (pin === user.pin) {
      setActiveAlert(null);
      // Update history status to cancelled
      setAlertsHistory(alertsHistory.map(a => a.id === activeAlert.id ? { ...a, status: 'cancelada' } : a));
      return true;
    }
    return false;
  };

  return (
    <AppContext.Provider value={{
      user, login, logout,
      contacts, addContact, removeContact,
      activeAlert, triggerSOS, cancelSOS,
      location, setLocation,
      alertsHistory
    }}>
      {children}
    </AppContext.Provider>
  );
};
