import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Shield, LogOut, Menu } from 'lucide-react';

export default function Navigation() {
  const { user, logout } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="glass-panel" style={{ margin: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="flex items-center gap-2">
        <Shield size={32} color="var(--primary)" />
        <h2 style={{ marginBottom: 0 }}>GOTM</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <span>{user.name} ({user.role})</span>
        <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem' }}>
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}
