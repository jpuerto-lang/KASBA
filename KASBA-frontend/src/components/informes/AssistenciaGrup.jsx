import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';

export default function AssistenciaGrup() {
  const [grups, setGrups] = useState([]);
  const [grupId, setGrupId] = useState('');
  const [dataInici, setDataInici] = useState('');
  const [dataFi, setDataFi] = useState('');
  const [loading, setLoading] = useState(false);
  const [informe, setInforme] = useState(null);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    carregarGrups();
    const avui = new Date();
    const fa30Dies = new Date();
    fa30Dies.setDate(avui.getDate() - 30);
    setDataFi(avui.toISOString().split('T')[0]);
    setDataInici(fa30Dies.toISOString().split('T')[0]);
  }, []);

  async function carregarGrups() {
    const res = await apiFetch('/grups');
    const data = await res.json();
    if (res.ok) {
      setGrups(Array.isArray(data) ? data : []);
    } else {
      setMissatge({ tipus: 'error', text: data.error || 'Error carregant grups' });
    }
  }

  async function generarInforme() {
    if (!dataInici || !dataFi) {
      setMissatge({ tipus: 'error', text: 'Selecciona un període' });
      return;
    }

    setLoading(true);
    setMissatge(null);
    setInforme(null);

    try {
      let url = `/informes/assistencia_grup?data_inici=${dataInici}&data_fi=${dataFi}`;
      if (grupId) {
        url += `&grup_id=${grupId}`;
      }
      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInforme(data);
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3>Assistència per grup</h3>
      <p style={{ fontSize: 13, color: '#6b6a64', marginBottom: 16 }}>
        Resum d'assistència agregat per grup en el període seleccionat.
      </p>

      <div style={{ 
        marginBottom: 20, 
        padding: 16, 
        border: '1px solid #e0ddd5', 
        borderRadius: 10, 
        background: '#fff', 
        display: 'flex', 
        gap: 16, 
        alignItems: 'flex-end', 
        flexWrap: 'wrap' 
      }}>
        <div style={{ minWidth: 180 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Grup (opcional)</label>
          <select 
            value={grupId} 
            onChange={e => setGrupId(e.target.value)} 
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #c0bdb5', borderRadius: 6, background: '#fff', color: '#1a1a18', fontSize: 14 }}
          >
            <option value="">-- Tots els grups --</option>
            {grups.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Data inicial</label>
          <input 
            type="date" 
            value={dataInici} 
            onChange={e => setDataInici(e.target.value)} 
            style={{ width: '100%', padding: '10px 12px', border: '2px solid #2d5be3', borderRadius: 6, background: '#fff', color: '#1a1a18', fontSize: 14 }} 
          />
        </div>
        <div style={{ minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Data final</label>
          <input 
            type="date" 
            value={dataFi} 
            onChange={e => setDataFi(e.target.value)} 
            style={{ width: '100%', padding: '10px 12px', border: '2px solid #2d5be3', borderRadius: 6, background: '#fff', color: '#1a1a18', fontSize: 14 }} 
          />
        </div>
        <div>
          <button 
            onClick={generarInforme} 
            disabled={!dataInici || !dataFi || loading} 
            style={{ background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 13, fontWeight: 500, cursor: 'pointer', height: 42 }}
          >
            {loading ? 'Generant...' : 'Generar informe'}
          </button>
        </div>
      </div>

      {missatge && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, background: '#fceaea', color: '#b83232', border: '1px solid #e8a0a0' }}>
          {missatge.text}
        </div>
      )}

      {informe && (
        <div style={{ background: '#fff', border: '1px solid #e0ddd5', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#f5f4f0', borderBottom: '1px solid #e0ddd5' }}>
            <strong>Resum per grup</strong>
            <span style={{ marginLeft: 16, fontSize: 12, color: '#6b6a64' }}>
              {new Date(informe.data_inici).toLocaleDateString('ca-ES')} - {new Date(informe.data_fi).toLocaleDateString('ca-ES')}
            </span>
          </div>
          {informe.grups.length === 0 && (
            <p style={{ padding: 40, textAlign: 'center', color: '#a8a79f' }}>
              No hi ha dades per als paràmetres seleccionats.
            </p>
          )}
          {informe.grups.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fff', borderBottom: '1px solid #e0ddd5' }}>
                  <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Grup</th>
                  <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Hores teòriques</th>
                  <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Hores assistides</th>
                  <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Hores justificades</th>
                  <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>% Assistit</th>
                  <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>% Assistit+Justif.</th>
                </tr>
              </thead>
              <tbody>
                {informe.grups.map(g => {
                  const percentClass = g.percent_assistit < 80 ? '#fceaea' : '#e8f5ee';
                  const percentColor = g.percent_assistit < 80 ? '#b83232' : '#1a7a4a';
                  return (
                    <tr key={g.grup_id} style={{ borderBottom: '1px solid #f0eee8' }}>
                      <td style={{ padding: '10px 12px', color: '#1a1a18' }}><strong>{g.grup_nom}</strong></td>
                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>{g.hores_teoric}</td>
                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>{g.hores_assistit}</td>
                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>{g.hores_justificat}</td>
                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                        <span style={{
                          padding: '4px 10px', 
                          borderRadius: 20, 
                          fontSize: 11, 
                          fontWeight: 500,
                          background: percentClass,
                          color: percentColor
                        }}>
                          {g.percent_assistit}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                        <span style={{
                          padding: '4px 10px', 
                          borderRadius: 20, 
                          fontSize: 11, 
                          fontWeight: 500,
                          background: '#ebf0fd',
                          color: '#1a3a9e'
                        }}>
                          {g.percent_assistit_justificat}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
