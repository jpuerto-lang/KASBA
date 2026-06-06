import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

export default function InformeAssistencia() {
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
    const res = await fetch(`${API}/grups`);
    const data = await res.json();
    setGrups(Array.isArray(data) ? data : []);
  }

  async function generarInforme() {
    if (!grupId || !dataInici || !dataFi) {
      setMissatge({ tipus: 'error', text: 'Selecciona un grup i un període' });
      return;
    }

    setLoading(true);
    setMissatge(null);
    setInforme(null);

    try {
      const res = await fetch(`${API}/informes/assistencia?grup_id=${grupId}&data_inici=${dataInici}&data_fi=${dataFi}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInforme(data);
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  const nomGrup = grups.find(g => g.id === grupId)?.nom || '';

  return (
    <div>
      <h2>Informe d'assistència</h2>

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
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Grup</label>
          <select 
            value={grupId} 
            onChange={e => setGrupId(e.target.value)} 
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #c0bdb5', borderRadius: 6, background: '#fff', color: '#1a1a18', fontSize: 14, cursor: 'pointer' }}
          >
            <option value="">-- Selecciona --</option>
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
            disabled={!grupId || !dataInici || !dataFi || loading} 
            style={{ background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 13, fontWeight: 500, cursor: 'pointer', height: 42, whiteSpace: 'nowrap' }}
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
            <strong>Informe del grup {nomGrup}</strong>
            <span style={{ marginLeft: 16, fontSize: 12, color: '#6b6a64' }}>
              {new Date(informe.data_inici).toLocaleDateString('ca-ES')} - {new Date(informe.data_fi).toLocaleDateString('ca-ES')}
            </span>
            <span style={{ marginLeft: 16, fontSize: 12, color: '#6b6a64' }}>
              Total teòric: {informe.hores_teoric_total}
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fff', borderBottom: '1px solid #e0ddd5' }}>
                <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Alumne</th>
                <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Hores teòriques</th>
                <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Hores assistides</th>
                <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Hores justificades</th>
                <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>% Assistit</th>
                <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>% Assistit+Justif.</th>
              </tr>
            </thead>
            <tbody>
              {informe.alumnes.map(alumne => {
                const percentClass = alumne.percent_assistit < 80 ? '#fceaea' : '#e8f5ee';
                const percentColor = alumne.percent_assistit < 80 ? '#b83232' : '#1a7a4a';
                return (
                  <tr key={alumne.id} style={{ borderBottom: '1px solid #f0eee8' }}>
                    <td style={{ padding: '10px 12px', color: '#1a1a18' }}>
                      {alumne.nom} {alumne.cognoms}
                      {!alumne.actiu && <span style={{ marginLeft: 8, fontSize: 11, color: '#a8a79f' }}>(inactiu)</span>}
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 12px', color: '#1a1a18' }}>{alumne.hores_teoric}</td>
                    <td style={{ textAlign: 'center', padding: '10px 12px', color: '#1a1a18' }}>{alumne.hores_assistit}</td>
                    <td style={{ textAlign: 'center', padding: '10px 12px', color: '#1a1a18' }}>{alumne.hores_justificat}</td>
                    <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                      <span style={{
                        padding: '4px 10px', 
                        borderRadius: 20, 
                        fontSize: 11, 
                        fontWeight: 500,
                        background: percentClass,
                        color: percentColor
                      }}>
                        {alumne.percent_assistit}%
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
                        {alumne.percent_assistit_justificat}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
