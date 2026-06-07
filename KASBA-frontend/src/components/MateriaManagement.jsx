import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function MateriaManagement() {
  const [materies, setMateries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom: '', descripcio: '' });
  const [editingId, setEditingId] = useState(null);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    carregarMateries();
  }, []);

  async function carregarMateries() {
    setLoading(true);
    const res = await apiFetch('/materies');
    const data = await res.json();
    if (res.ok) {
      setMateries(Array.isArray(data) ? data : []);
    } else {
      setMissatge({ tipus: 'error', text: data.error || 'Error carregant matèries' });
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMissatge(null);

    const url = editingId ? `/materies/${editingId}` : '/materies';
    const method = editingId ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setMissatge({ tipus: 'error', text: data.error });
    } else {
      setMissatge({ tipus: 'ok', text: editingId ? 'Matèria actualitzada correctament' : 'Matèria creada correctament' });
      setForm({ nom: '', descripcio: '' });
      setEditingId(null);
      carregarMateries();
    }
    setSaving(false);
  }

  function editar(materia) {
    setForm({
      nom: materia.nom,
      descripcio: materia.descripcio || '',
    });
    setEditingId(materia.id);
  }

  async function eliminar(id, nom) {
    if (!confirm(`Segur que vols eliminar la matèria "${nom}"?`)) return;
    const res = await apiFetch(`/materies/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMissatge({ tipus: 'ok', text: `Matèria "${nom}" eliminada` });
      carregarMateries();
    } else {
      const data = await res.json();
      setMissatge({ tipus: 'error', text: data.error || 'Error en eliminar la matèria' });
    }
  }

  function cancelarEdicio() {
    setForm({ nom: '', descripcio: '' });
    setEditingId(null);
    setMissatge(null);
  }

  return (
    <div>
      <h2>Gestió de matèries</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 8, background: '#fff' }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, color: '#1a1a18' }}>{editingId ? 'Editar matèria' : 'Nova matèria'}</h3>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Nom de la matèria *</label>
            <input 
              type="text" 
              placeholder="Ex: Matemàtiques" 
              value={form.nom} 
              onChange={e => setForm({ ...form, nom: e.target.value })} 
              required 
              style={{ width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', color: '#1a1a18', boxSizing: 'border-box' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Descripció (opcional)</label>
            <input 
              type="text" 
              placeholder="Descripció breu" 
              value={form.descripcio} 
              onChange={e => setForm({ ...form, descripcio: e.target.value })} 
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
            {saving ? 'Guardant...' : editingId ? 'Actualitzar matèria' : '+ Afegir matèria'}
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
            {loading ? 'Carregant...' : `${materies.length} ${materies.length === 1 ? 'matèria' : 'matèries'}`}
          </span>
        </div>
        {!loading && materies.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: '#a8a79f', fontSize: 13 }}>
            Encara no hi ha matèries. Utilitza el formulari per crear-ne una.
          </p>
        )}
        {materies.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f5f4f0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 11 }}>Nom</th>
                  <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 11 }}>Descripció</th>
                  <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 11 }}>Accions</th>
                </tr>
              </thead>
              <tbody>
                {materies.map(m => (
                  <tr key={m.id} style={{ borderTop: '1px solid #e0ddd5' }}>
                    <td style={{ padding: '12px 12px', color: '#1a1a18' }}><strong>{m.nom}</strong></td>
                    <td style={{ padding: '12px 12px', color: '#1a1a18' }}>{m.descripcio || '-'}</td>
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                      <button onClick={() => editar(m)} style={{ background: 'none', border: 'none', color: '#2d5be3', cursor: 'pointer', fontSize: 16, marginRight: 12 }} title="Editar">✏️</button>
                      <button onClick={() => eliminar(m.id, m.nom)} style={{ background: 'none', border: 'none', color: '#b83232', cursor: 'pointer', fontSize: 16 }} title="Eliminar">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
