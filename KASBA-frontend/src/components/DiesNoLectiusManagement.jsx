import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

export default function DiesNoLectiusManagement() {
  const [grups, setGrups] = useState([]);
  const [grupId, setGrupId] = useState('');
  const [data, setData] = useState('');
  const [motiu, setMotiu] = useState('');
  const [dies, setDies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [missatge, setMissatge] = useState(null);
  const [copiant, setCopiant] = useState(false);

  useEffect(() => {
    carregarGrups();
  }, []);

  useEffect(() => {
    if (grupId) {
      carregarDies();
    } else {
      setDies([]);
    }
  }, [grupId]);

  async function carregarGrups() {
    const res = await fetch(`${API}/grups`);
    const data = await res.json();
    setGrups(Array.isArray(data) ? data : []);
  }

  async function carregarDies() {
    if (!grupId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/dies_no_lectius?grup_id=${grupId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDies(Array.isArray(data) ? data : []);
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!grupId || !data) {
      setMissatge({ tipus: 'error', text: 'Selecciona un grup i una data' });
      return;
    }

    setSaving(true);
    setMissatge(null);

    const url = editingId ? `${API}/dies_no_lectius/${editingId}` : `${API}/dies_no_lectius`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grup_id: grupId, data, motiu }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      setMissatge({ tipus: 'ok', text: editingId ? 'Dia actualitzat' : 'Dia afegit' });
      setData('');
      setMotiu('');
      setEditingId(null);
      carregarDies();
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  function editar(dia) {
    setData(dia.data);
    setMotiu(dia.motiu || '');
    setEditingId(dia.id);
  }

  async function eliminar(id, dataDia) {
    if (!confirm(`Eliminar el dia no lectiu ${dataDia}?`)) return;
    try {
      const res = await fetch(`${API}/dies_no_lectius/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error en eliminar');
      setMissatge({ tipus: 'ok', text: 'Dia eliminat' });
      carregarDies();
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    }
  }

  function cancelarEdicio() {
    setData('');
    setMotiu('');
    setEditingId(null);
  }

  async function copiarDies(origenId) {
    if (!origenId) return;
    if (!confirm(`Vols copiar els dies no lectius del grup seleccionat al grup actual?`)) return;
    
    setCopiant(true);
    try {
      const res = await fetch(`${API}/dies_no_lectius/copiar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origen_grup_id: origenId, desti_grup_id: grupId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMissatge({ tipus: 'ok', text: data.missatge });
      carregarDies();
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setCopiant(false);
    }
  }

  const nomGrup = grups.find(g => g.id === grupId)?.nom || '';
  const grupsSenseActual = grups.filter(g => g.id !== grupId);

  return (
    <div>
      <h2>Gestió de dies no lectius</h2>
      <p style={{ fontSize: 13, color: '#6b6a64', marginBottom: 16 }}>
        Defineix els dies en què no hi ha classe (festius, excursions, etc.) per a cada grup.
        Aquests dies no es comptabilitzaran en els informes d'assistència.
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
        <div style={{ minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Grup</label>
          <select 
            value={grupId} 
            onChange={e => setGrupId(e.target.value)} 
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #c0bdb5', borderRadius: 6, background: '#fff', color: '#1a1a18', fontSize: 14, cursor: 'pointer' }}
          >
            <option value="">-- Selecciona un grup --</option>
            {grups.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </div>
      </div>

      {grupId && (
        <>
          <form onSubmit={handleSubmit} style={{ 
            marginBottom: 20, 
            padding: 16, 
            border: '1px solid #e0ddd5', 
            borderRadius: 10, 
            background: '#fff' 
          }}>
            <h3 style={{ marginBottom: 16, fontSize: 16, color: '#1a1a18' }}>
              {editingId ? 'Editar dia no lectiu' : `Afegir dia no lectiu - ${nomGrup}`}
            </h3>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Data *</label>
                <input 
                  type="date" 
                  value={data} 
                  onChange={e => setData(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #2d5be3', borderRadius: 6, background: '#fff', color: '#1a1a18', fontSize: 14 }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Motiu (opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ex: Festa local, Excursió, Dia de lliure disposició" 
                  value={motiu} 
                  onChange={e => setMotiu(e.target.value)} 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #c0bdb5', borderRadius: 6, background: '#fff', color: '#1a1a18', fontSize: 14 }} 
                />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button 
                type="submit" 
                disabled={saving || !data} 
                style={{ background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                {saving ? 'Guardant...' : editingId ? 'Actualitzar dia' : '+ Afegir dia'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={cancelarEdicio} 
                  style={{ background: '#f0eee8', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel·lar
                </button>
              )}
            </div>
            {missatge && (
              <div style={{ 
                marginTop: 12, 
                padding: 10, 
                borderRadius: 6, 
                background: missatge.tipus === 'ok' ? '#e8f5ee' : '#fceaea', 
                color: missatge.tipus === 'ok' ? '#1a7a4a' : '#b83232', 
                border: `1px solid ${missatge.tipus === 'ok' ? '#9fe1cb' : '#e8a0a0'}`
              }}>
                {missatge.text}
              </div>
            )}
          </form>

          {/* Secció per copiar dies */}
          {grupsSenseActual.length > 0 && (
            <div style={{ 
              marginBottom: 20, 
              padding: 16, 
              border: '1px solid #e0ddd5', 
              borderRadius: 10, 
              background: '#fff' 
            }}>
              <h3 style={{ marginBottom: 16, fontSize: 16, color: '#1a1a18' }}>Copiar dies no lectius</h3>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 200 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Copiar des del grup</label>
                  <select 
                    id="grupOrigen"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #c0bdb5', borderRadius: 6, background: '#fff', fontSize: 14 }}
                  >
                    <option value="">-- Selecciona un grup --</option>
                    {grupsSenseActual.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
                  </select>
                </div>
                <button 
                  onClick={() => {
                    const origenId = document.getElementById('grupOrigen').value;
                    if (origenId) copiarDies(origenId);
                  }}
                  disabled={copiant}
                  style={{ background: '#17a2b8', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 13, cursor: 'pointer', height: 42 }}
                >
                  {copiant ? 'Copiant...' : '📋 Copiar dies'}
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#6b6a64', marginTop: 12 }}>
                Els dies copiats se sumaran als existents. Després pots editar o eliminar dies individuals.
              </p>
            </div>
          )}

          {/* Llista de dies existents */}
          <div style={{ background: '#fff', border: '1px solid #e0ddd5', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#f5f4f0', borderBottom: '1px solid #e0ddd5' }}>
              <strong>Dies no lectius - {nomGrup}</strong>
              <span style={{ marginLeft: 16, fontSize: 12, color: '#6b6a64' }}>
                {dies.length} {dies.length === 1 ? 'dia' : 'dies'}
              </span>
            </div>
            {!loading && dies.length === 0 && (
              <p style={{ padding: 40, textAlign: 'center', color: '#a8a79f' }}>
                No hi ha dies no lectius definits per a aquest grup.
              </p>
            )}
            {dies.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fff', borderBottom: '1px solid #e0ddd5' }}>
                    <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Data</th>
                    <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Motiu</th>
                    <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, fontSize: 11 }}>Accions</th>
                  </tr>
                </thead>
                <tbody>
                  {dies.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f0eee8' }}>
                      <td style={{ padding: '10px 12px', color: '#1a1a18' }}>
                        {new Date(d.data).toLocaleDateString('ca-ES')}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#1a1a18' }}>{d.motiu || '-'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button onClick={() => editar(d)} style={{ background: 'none', border: 'none', color: '#2d5be3', cursor: 'pointer', fontSize: 16, marginRight: 12 }} title="Editar">✏️</button>
                        <button onClick={() => eliminar(d.id, d.data)} style={{ background: 'none', border: 'none', color: '#b83232', cursor: 'pointer', fontSize: 16 }} title="Eliminar">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
