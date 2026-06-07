import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import AlumneManagement from './components/AlumneManagement';
import AssistenciaManagement from './components/AssistenciaManagement';
import HorariGrup from './components/HorariGrup';
import InformesPrincipal from './components/informes/InformesPrincipal';
import ConfiguracioPrincipal from './components/ConfiguracioPrincipal';

function AppContent() {
  const { user, logout, loading } = useAuth();
  const [seccio, setSeccio] = useState('assistencia');

  if (loading) return <div style={{ textAlign: 'center', marginTop: 50 }}>Carregant...</div>;
  if (!user) return <Login />;

  const esAdmin = user.rol === 'admin';
  const esTutor = user.rol === 'tutor';
  const esProfessor = user.rol === 'professor';

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24 }}>🏫 KASBA - Gestió acadèmica</h1>
        <div>
          <span style={{ marginRight: 12, fontSize: 14 }}>{user.nom} ({user.rol})</span>
          <button onClick={logout} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>
            Tancar sessió
          </button>
        </div>
      </div>

      <nav style={{ marginBottom: 20, borderBottom: '1px solid #ccc', paddingBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button onClick={() => setSeccio('assistencia')} style={{ background: seccio === 'assistencia' ? '#2d5be3' : '#f0eee8', color: seccio === 'assistencia' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>✍️ Assistència</button>
        <button onClick={() => setSeccio('horari_grup')} style={{ background: seccio === 'horari_grup' ? '#2d5be3' : '#f0eee8', color: seccio === 'horari_grup' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>📅 Horaris</button>
        <button onClick={() => setSeccio('informes')} style={{ background: seccio === 'informes' ? '#2d5be3' : '#f0eee8', color: seccio === 'informes' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>📊 Informes</button>
        
        {(esAdmin || esTutor) && (
          <button onClick={() => setSeccio('alumnes')} style={{ background: seccio === 'alumnes' ? '#2d5be3' : '#f0eee8', color: seccio === 'alumnes' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>🧑‍🎓 Alumnes</button>
        )}
        
        {esAdmin && (
          <button onClick={() => setSeccio('configuracio')} style={{ background: seccio === 'configuracio' ? '#2d5be3' : '#f0eee8', color: seccio === 'configuracio' ? '#fff' : '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>🔧 Configuració</button>
        )}
      </nav>

      {seccio === 'assistencia' && <AssistenciaManagement />}
      {seccio === 'horari_grup' && <HorariGrup />}
      {seccio === 'informes' && <InformesPrincipal />}
      {(esAdmin || esTutor) && seccio === 'alumnes' && <AlumneManagement />}
      {esAdmin && seccio === 'configuracio' && <ConfiguracioPrincipal />}
    </div>
  );
}

export default AppContent;
