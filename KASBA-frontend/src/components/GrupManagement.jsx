import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

export default function GrupManagement() {
  const [grups, setGrups] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nom: '', curs: '', professor_id: '', llindar_assistencia: 80 });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    carregarGrups();
    carregarProfessors();
  }, []);

  async function carregarGrups() {
    setLoading(true);
    const res = await fetch(`${API}/grups`);
    const data = await res.json();
    setGrups(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function carregarProfessors() {
    const res = await fetch(`${API}/professors`);
    const data = await res.json();
    setProfessors(Array.isArray(data) ? data : []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMissatge(null);

    const url = editingId ? `${API}/grups/${editingId}` : `${API}/grups`;
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();

    if (!res.ok) {
      setMissatge({ tipus: 'error', text: data.error });
    } else {
      setMissatge({ tipus: 'ok', text: editingId ? 'Grup actualitzat correctament' : 'Grup creat correctament' });
      setForm({ nom: '', curs: '', professor_id: '', llindar_assistencia: 80 });
      setEditingId(null);
      carregarGrups();
    }
    setSaving(false);
  }

  function editar(grup) {
    setForm({
      nom: grup.nom,
      curs: grup.curs,
      professor_id: grup.professor_id || '',
      llindar_assistencia: grup.llindar_assistencia
    });
    setEditingId(grup.id);
  }

  async function eliminar(id, nom) {
    if (!confirm(`Segur que vols eliminar el grup "${nom}"?`)) return;
    const res = await fetch(`${API}/grups/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMissatge({ tipus: 'ok', text: `Grup "${nom}" eliminat` });
      carregarGrups();
    } else {
      setMissatge({ tipus: 'error', text: 'Error en eliminar el grup' });
    }
  }

  function cancelarEdicio() {
    setForm({ nom: '', curs: '', professor_id: '', llindar_assistencia: 80 });
    setEditingId(null);
    setMissatge(null);
  }

  return (
    <div>
      <h2>Gestió de grups</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 8, background: '#fff' }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, color: '#1a1a18' }}>{editingId ? 'Editar grup' : 'Nou grup'}</h3>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Nom del grup *</label>
            <input 
              type="text" 
              placeholder="1r ESO A" 
              value={form.nom} 
              onChange={e => setForm({ ...form, nom: e.target.value })} 
              required 
              style={{ width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', color: '#1a1a18', boxSizing: 'border-box' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Curs *</label>
            <input 
              type="text" 
              placeholder="1r ESO" 
              value={form.curs} 
              onChange={e => setForm({ ...form, curs: e.target.value })} 
              required 
              style={{ width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', color: '#1a1a18', boxSizing: 'border-box' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Tutor del grup</label>
            <select 
              value={form.professor_id} 
              onChange={e => setForm({ ...form, professor_id: e.target.value })} 
              style={{ width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', color: '#1a1a18', boxSizing: 'border-box' }}
            >
              <option value="">Sense tutor assignat</option>
              {professors.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Llindar d'assistència (%)</label>
            <input 
              type="number" 
              placeholder="80" 
              value={form.llindar_assistencia} 
              onChange={e => setForm({ ...form, llindar_assistencia: parseInt(e.target.value) || 0 })} 
              min="0" 
              max="100" 
              style={{ width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', color: '#1a1a18', boxSizing: 'border-box' }} 
            />
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button 
            type="submit" 
            disabled={saving} 
            style={{ background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            {saving ? 'Guardant...' : editingId ? 'Actualitzar grup' : '+ Afegir grup'}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={cancelarEdicio} 
              style={{ background: '#f0eee8', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: '#1a1a18' }}
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
            border: `1px solid ${missatge.tipus === 'ok' ? '#9fe1cb' : '#e8a0a0'}`,
            fontSize: 13
          }}>
            {missatge.text}
          </div>
        )}
      </form>

      <div style={{ background: '#fff', border: '1px solid #e0ddd5', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0ddd5' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#6b6a64' }}>
            {loading ? 'Carregant...' : `${grups.length} ${grups.length === 1 ? 'grup' : 'grups'}`}
          </span>
        </div>
        {!loading && grups.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: '#a8a79f', fontSize: 13 }}>
            Encara no hi ha grups. Utilitza el formulari per crear-ne un.
          </p>
        )}
        {grups.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f5f4f0' }}>
                <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 11 }}>Nom</th>
                <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 11 }}>Curs</th>
                <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 11 }}>Tutor</th>
                <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 11 }}>Llindar</th>
                <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 11 }}>Accions</th>
              </tr>
            </thead>
            <tbody>
              {grups.map(g => {
                let llindarColor = '#e8f5ee';
                let llindarTextColor = '#1a7a4a';
                if (g.llindar_assistencia < 80 && g.llindar_assistencia >= 50) {
                  llindarColor = '#fff3e0';
                  llindarTextColor = '#b86c00';
                } else if (g.llindar_assistencia < 50) {
                  llindarColor = '#fceaea';
                  llindarTextColor = '#b83232';
                }
                return (
                  <tr key={g.id} style={{ borderTop: '1px solid #e0ddd5' }}>
                    <td style={{ padding: '12px 12px', color: '#1a1a18' }}><strong>{g.nom}</strong></td>
                    <td style={{ padding: '12px 12px', color: '#1a1a18' }}>{g.curs}</td>
                    <td style={{ padding: '12px 12px', color: '#1a1a18' }}>{g.professors?.nom || '-'}</td>
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px', 
                        borderRadius: 20, 
                        fontSize: 11, 
                        fontWeight: 500,
                        background: llindarColor,
                        color: llindarTextColor
                      }}>
                        {g.llindar_assistencia}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                      <button onClick={() => editar(g)} style={{ background: 'none', border: 'none', color: '#2d5be3', cursor: 'pointer', fontSize: 16, marginRight: 12 }} title="Editar">✏️</button>
                      <button onClick={() => eliminar(g.id, g.nom)} style={{ background: 'none', border: 'none', color: '#b83232', cursor: 'pointer', fontSize: 16 }} title="Eliminar">🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
