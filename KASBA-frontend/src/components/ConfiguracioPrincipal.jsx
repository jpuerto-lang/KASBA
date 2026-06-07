// src/components/ConfiguracioPrincipal.jsx
import { useState } from 'react';
import ProfessorManagement from './ProfessorManagement';
import GrupManagement from './GrupManagement';
import MateriaManagement from './MateriaManagement';
import HorariPerDia from './HorariPerDia';
import DiesNoLectiusManagement from './DiesNoLectiusManagement';

export default function ConfiguracioPrincipal() {
  const [tab, setTab] = useState('professors');

  const tabs = [
    { id: 'professors', nom: '👨‍🏫 Professors', component: <ProfessorManagement /> },
    { id: 'grups', nom: '👥 Grups', component: <GrupManagement /> },
    { id: 'materies', nom: '📚 Matèries', component: <MateriaManagement /> },
    { id: 'horaris', nom: '📅 Horari (Disseny)', component: <HorariPerDia /> },
    { id: 'dies_no_lectius', nom: '📅 Dies no lectius', component: <DiesNoLectiusManagement /> },
  ];

  const activeTab = tabs.find(t => t.id === tab);

  return (
    <div>
      <h2>🔧 Configuració</h2>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 4, 
        borderBottom: '1px solid #e0ddd5', 
        marginBottom: 20,
        background: '#fff',
        borderRadius: '10px 10px 0 0',
        padding: '0 4px'
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: tab === t.id ? 600 : 400,
              background: tab === t.id ? '#2d5be3' : 'transparent',
              color: tab === t.id ? '#fff' : '#6b6a64',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t.nom}
          </button>
        ))}
      </div>
      <div style={{ 
        background: '#fff', 
        border: '1px solid #e0ddd5', 
        borderRadius: 10, 
        padding: 20,
        borderTopLeftRadius: 0
      }}>
        {activeTab.component}
      </div>
    </div>
  );
}
