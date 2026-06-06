import { useState } from 'react';
import AssistenciaAlumne from './InformeAssistencia';
import AssistenciaMateria from './AssistenciaMateria';
import AssistenciaGrup from './AssistenciaGrup';
import AlertesAssistencia from './AlertesAssistencia';


export default function InformesPrincipal() {
  const [tab, setTab] = useState('alumne');

  const tabs = [
    { id: 'alumne', nom: '📈 Assistència per alumne', component: <AssistenciaAlumne /> },
    { id: 'materia', nom: '📚 Assistència per matèria', component: <AssistenciaMateria /> },
    { id: 'grup', nom: '👥 Assistència per grup', component: <AssistenciaGrup /> },
    {id: 'alertes', nom: '⚠️ Alertes', component: <AlertesAssistencia /> },
  ];

  const activeTab = tabs.find(t => t.id === tab);

  return (
    <div>
      <h2>📊 Informes</h2>
      
      {/* Pestanyes */}
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

      {/* Contingut de la pestanya activa */}
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
