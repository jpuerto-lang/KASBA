import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

const dies = {
  1: 'Dilluns',
  2: 'Dimarts',
  3: 'Dimecres',
  4: 'Dijous',
  5: 'Divendres',
  6: 'Dissabte',
  7: 'Diumenge'
};

export default function HorariGrup() {
  const [grups, setGrups] = useState([]);
  const [grupId, setGrupId] = useState('');
  const [horari, setHorari] = useState([]);
  const [loading, setLoading] = useState(false);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    carregarGrups();
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

  async function carregarHorari() {
    if (!grupId) return;
    setLoading(true);
    setMissatge(null);
    try {
      // Carregar tots els horaris del grup seleccionat
      const res = await apiFetch(`/horaris?grup_id=${grupId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Filtrar per assegurar-nos que només tenim horaris del grup seleccionat
      const horarisFiltrats = Array.isArray(data) ? data.filter(h => h.grup_id === grupId) : [];
      setHorari(horarisFiltrats);
      
      if (horarisFiltrats.length === 0) {
        setMissatge({ tipus: 'info', text: 'No hi ha horari definit per a aquest grup.' });
      }
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  // Obtenir el nom del grup seleccionat
  const nomGrup = grups.find(g => g.id === grupId)?.nom || '';

  return (
    <div>
      <h2>Horari del grup (visor)</h2>

      <div style={{ marginBottom: 20, padding: 16, border: '1px solid #e0ddd5', borderRadius: 10, background: '#fff', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Grup</label>
          <select
            value={grupId}
            onChange={e => setGrupId(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0ddd5', borderRadius: 6, background: '#f5f4f0', color: '#1a1a18', fontSize: 13 }}
          >
            <option value="">-- Selecciona un grup --</option>
            {grups.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </div>
        <button
          onClick={carregarHorari}
          disabled={!grupId}
          style={{ background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', height: 38 }}
        >
          Carregar horari
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center', padding: 40, color: '#6b6a64' }}>Carregant horari...</p>}
      
      {missatge && missatge.tipus === 'info' && (
        <div style={{ padding: 40, textAlign: 'center', background: '#fff', border: '1px solid #e0ddd5', borderRadius: 10, color: '#a8a79f', fontSize: 13 }}>
          {missatge.text}
        </div>
      )}

      {missatge && missatge.tipus === 'error' && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, background: '#fceaea', color: '#b83232', border: '1px solid #e8a0a0', fontSize: 13 }}>
          {missatge.text}
        </div>
      )}

      {!loading && horari.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e0ddd5', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0ddd5', background: '#f5f4f0' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a18' }}>
              Horari del grup: {nomGrup}
            </span>
          </div>
          
          {Object.entries(dies).map(([num, nomDia]) => {
            const franges = horari.filter(f => f.dia_setmana === parseInt(num)).sort((a, b) => a.hora_inici.localeCompare(b.hora_inici));
            if (franges.length === 0) return null;
            
            return (
              <div key={num} style={{ marginBottom: 0 }}>
                <div style={{ padding: '10px 16px', background: '#fafaf8', borderBottom: '1px solid #e0ddd5', borderTop: '1px solid #e0ddd5' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a1a18' }}>{nomDia}</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#fff' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid #e0ddd5' }}>Hora inici</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid #e0ddd5' }}>Durada</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid #e0ddd5' }}>Matèria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {franges.map((f, idx) => (
                      <tr key={f.id} style={{ borderBottom: idx === franges.length - 1 ? 'none' : '1px solid #f0eee8' }}>
                        <td style={{ padding: '10px 12px', color: '#1a1a18' }}>{f.hora_inici.slice(0, 5)}</td>
                        <td style={{ padding: '10px 12px', color: '#1a1a18' }}>{f.durada_min} min</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 500,
                            background: '#ebf0fd',
                            color: '#1a3a9e',
                            display: 'inline-block'
                          }}>
                            {f.materies?.nom || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
