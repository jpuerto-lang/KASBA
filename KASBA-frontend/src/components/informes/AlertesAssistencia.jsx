import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

export default function AlertesAssistencia() {
  const [grups, setGrups] = useState([]);
  const [grupId, setGrupId] = useState('');
  const [dataInici, setDataInici] = useState('');
  const [dataFi, setDataFi] = useState('');
  const [llindarPersonalitzat, setLlindarPersonalitzat] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertes, setAlertes] = useState(null);
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

  async function generarAlertes() {
    if (!dataInici || !dataFi) {
      setMissatge({ tipus: 'error', text: 'Selecciona un període' });
      return;
    }

    setLoading(true);
    setMissatge(null);
    setAlertes(null);

    try {
      let url = `${API}/informes/alertes?data_inici=${dataInici}&data_fi=${dataFi}`;
      if (grupId) {
        url += `&grup_id=${grupId}`;
      }
      if (llindarPersonalitzat && parseFloat(llindarPersonalitzat) > 0) {
        url += `&llindar_personalitzat=${llindarPersonalitzat}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAlertes(data);
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3>⚠️ Alertes d'assistència</h3>
      <p style={{ fontSize: 13, color: '#6b6a64', marginBottom: 16 }}>
        Alumnes que han baixat del llindar mínim d'assistència en el període seleccionat.
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
        <div style={{ minWidth: 150 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Llindar (%)</label>
          <input 
            type="number" 
            placeholder="Per defecte: del grup" 
            value={llindarPersonalitzat} 
            onChange={e => setLlindarPersonalitzat(e.target.value)} 
            min="0" 
            max="100"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #c0bdb5', borderRadius: 6, background: '#fff', color: '#1a1a18', fontSize: 14 }} 
          />
        </div>
        <div>
          <button 
            onClick={generarAlertes} 
            disabled={!dataInici || !dataFi || loading} 
            style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 13, fontWeight: 500, cursor: 'pointer', height: 42 }}
          >
            {loading ? 'Generant...' : '⚠️ Generar alertes'}
          </button>
        </div>
      </div>

      {missatge && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, background: '#fceaea', color: '#b83232', border: '1px solid #e8a0a0' }}>
          {missatge.text}
        </div>
      )}

      {alertes && (
        <div style={{ background: '#fff', border: '1px solid #e0ddd5', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#f5f4f0', borderBottom: '1px solid #e0ddd5' }}>
            <strong>⚠️ {alertes.total_alertes} alertes</strong>
            <span style={{ marginLeft: 16, fontSize: 12, color: '#6b6a64' }}>
              {new Date(alertes.data_inici).toLocaleDateString('ca-ES')} - {new Date(alertes.data_fi).toLocaleDateString('ca-ES')}
            </span>
          </div>
          {alertes.total_alertes === 0 && (
            <p style={{ padding: 40, textAlign: 'center', color: '#1a7a4a', background: '#e8f5ee' }}>
              ✅ No hi ha alertes per als paràmetres seleccionats. Tots els alumnes estan per sobre del llindar.
            </p>
          )}
          {alertes.total_alertes > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fff', borderBottom: '1px solid #e0ddd5' }}>
                  <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Alumne</th>
                  <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Grup</th>
                  <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Hores teòriques</th>
                  <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Hores assistides</th>
                  <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>% Assistit</th>
                  <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Llindar</th>
                </tr>
              </thead>
              <tbody>
                {alertes.alertes.map(a => {
                  let percentClass = '#fceaea';
                  let percentColor = '#b83232';
                  if (a.percent_assistit < 50) {
                    percentClass = '#dc3545';
                    percentColor = '#fff';
                  } else if (a.percent_assistit < 70) {
                    percentClass = '#fceaea';
                    percentColor = '#b83232';
                  }
                  return (
                    <tr key={`${a.alumne_id}-${a.grup_id}`} style={{ borderBottom: '1px solid #f0eee8' }}>
                      <td style={{ padding: '10px 12px', color: '#1a1a18' }}>{a.alumne_nom} {a.alumne_cognoms}</td>
                      <td style={{ padding: '10px 12px', color: '#1a1a18' }}><strong>{a.grup_nom}</strong></td>
                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>{a.hores_teoric}</td>
                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>{a.hores_assistit}</td>
                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                        <span style={{
                          padding: '4px 10px', 
                          borderRadius: 20, 
                          fontSize: 11, 
                          fontWeight: 500,
                          background: percentClass,
                          color: percentColor
                        }}>
                          {a.percent_assistit}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                        <span style={{
                          padding: '4px 10px', 
                          borderRadius: 20, 
                          fontSize: 11, 
                          fontWeight: 500,
                          background: '#f0eee8',
                          color: '#6b6a64'
                        }}>
                          {a.llindar}%
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
