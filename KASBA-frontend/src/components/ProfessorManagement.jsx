import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function ProfessorManagement() {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', nom: '', rol: 'professor', password: '' });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    carregarProfessors();
  }, []);

  async function carregarProfessors() {
    setLoading(true);
    try {
      const res = await apiFetch('/professors');
      if (!res.ok) {
        let errorMsg = await res.text();
        try {
          const data = JSON.parse(errorMsg);
          errorMsg = data.error || errorMsg;
        } catch { /* no fer res */ }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      setProfessors(Array.isArray(data) ? data : []);
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMissatge(null);

    const formData = { ...form };
    if (editingId && !formData.password) delete formData.password;

    const url = editingId ? `/professors/${editingId}` : '/professors';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await apiFetch(url, { method, body: JSON.stringify(formData) });
      if (!res.ok) {
        let errorMsg = await res.text();
        try {
          const data = JSON.parse(errorMsg);
          errorMsg = data.error || errorMsg;
        } catch { /* no fer res */ }
        throw new Error(errorMsg);
      }
      setMissatge({ tipus: 'ok', text: editingId ? 'Professor actualitzat' : 'Professor creat' });
      setForm({ email: '', nom: '', rol: 'professor', password: '' });
      setEditingId(null);
      carregarProfessors();
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  function editar(prof) {
    setForm({
      email: prof.email,
      nom: prof.nom,
      rol: prof.rol,
      password: ''
    });
    setEditingId(prof.id);
  }

  async function eliminar(id, nom) {
    if (!confirm(`Eliminar "${nom}"?`)) return;
    try {
      const res = await apiFetch(`/professors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setMissatge({ tipus: 'ok', text: `Professor "${nom}" eliminat` });
      carregarProfessors();
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    }
  }

  function cancelarEdicio() {
    setForm({ email: '', nom: '', rol: 'professor', password: '' });
    setEditingId(null);
  }

  async function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n');
      if (lines.length < 2) return setMissatge({ tipus: 'error', text: 'CSV buit' });

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const idxEmail = headers.findIndex(h => h === 'email');
      const idxNom = headers.findIndex(h => h === 'nom');
      const idxRol = headers.findIndex(h => h === 'rol');
      if (idxEmail === -1 || idxNom === -1) {
        return setMissatge({ tipus: 'error', text: 'CSV ha de tenir columnes "email" i "nom"' });
      }

      const professorsPerImportar = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const email = vals[idxEmail];
        const nom = vals[idxNom];
        const rol = vals[idxRol] || 'professor';
        if (email && nom) professorsPerImportar.push({ email, nom, rol, password: 'temp123456' });
      }

      if (!professorsPerImportar.length) return setMissatge({ tipus: 'error', text: 'No hi ha dades vàlides' });

      setSaving(true);
      let creats = 0, errors = 0;
      const errorsList = [];
      for (const prof of professorsPerImportar) {
        try {
          const res = await apiFetch('/professors', { method: 'POST', body: JSON.stringify(prof) });
          if (!res.ok) throw new Error(await res.text());
          creats++;
        } catch (err) {
          errors++;
          errorsList.push(`${prof.email}: ${err.message}`);
        }
      }
      setMissatge({ tipus: errors ? 'error' : 'ok', text: `Importats ${creats}. Errors: ${errors}${errorsList.length ? ' ' + errorsList.slice(0,2).join('; ') : ''}` });
      carregarProfessors();
      setSaving(false);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  function exportarCSV() {
    if (!professors.length) return setMissatge({ tipus: 'error', text: 'No hi ha professors per exportar' });
    const rows = [['email', 'nom', 'rol'].join(',')];
    professors.forEach(p => rows.push(`"${p.email}","${p.nom}","${p.rol}"`));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `professors_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMissatge({ tipus: 'ok', text: `Exportats ${professors.length} professors` });
  }

  return (
    <div>
      <h2>Gestió de professors</h2>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={exportarCSV} style={{ background: '#17a2b8', color: 'white', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>📥 Exportar CSV</button>
        <label style={{ background: '#28a745', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
          📂 Importar CSV
          <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
        </label>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 8, background: '#fff' }}>
        <h3>{editingId ? 'Editar professor' : 'Nou professor'}</h3>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2,1fr)' }}>
          <div>
            <label>Nom complet *</label>
            <input type="text" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }} />
          </div>
          <div>
            <label>Correu electrònic *</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }} />
          </div>
          <div>
            <label>Contrasenya {!editingId && '*'}</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editingId} minLength={6} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }} />
            {editingId && <span style={{ fontSize: 11, color: '#888' }}>(deixa buit per mantenir-la)</span>}
          </div>
          <div>
            <label>Rol *</label>
            <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}>
              <option value="professor">Professor</option>
              <option value="tutor">Tutor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button type="submit" disabled={saving} style={{ background: '#2d5be3', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>
            {saving ? 'Guardant...' : editingId ? 'Actualitzar professor' : '+ Afegir professor'}
          </button>
          {editingId && <button type="button" onClick={cancelarEdicio} style={{ background: '#f0eee8', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Cancel·lar</button>}
        </div>
        {missatge && <div style={{ marginTop: 12, padding: 10, borderRadius: 4, background: missatge.tipus === 'ok' ? '#e8f5ee' : '#fceaea', color: missatge.tipus === 'ok' ? '#1a7a4a' : '#b83232' }}>{missatge.text}</div>}
      </form>

      <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #ddd' }}>
          <span>{loading ? 'Carregant...' : `${professors.length} professors`}</span>
        </div>
        {!loading && professors.length === 0 && <p style={{ padding: 24, textAlign: 'center' }}>No hi ha professors.</p>}
        {professors.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f4f0' }}>
                <th style={{ textAlign: 'left', padding: 12 }}>Nom</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Email</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Rol</th>
                <th style={{ textAlign: 'center', padding: 12 }}>Accions</th>
              </tr>
            </thead>
            <tbody>
              {professors.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 12 }}><strong>{p.nom}</strong></td>
                  <td style={{ padding: 12 }}>{p.email}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ padding: '4px 8px', borderRadius: 20, fontSize: 12, background: p.rol === 'tutor' ? '#e0f0ff' : p.rol === 'admin' ? '#f0e0ff' : '#eee' }}>
                      {p.rol === 'professor' ? 'Professor' : p.rol === 'tutor' ? 'Tutor' : 'Administrador'}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <button onClick={() => editar(p)} style={{ background: 'none', border: 'none', color: '#2d5be3', cursor: 'pointer', marginRight: 12 }}>✏️</button>
                    <button onClick={() => eliminar(p.id, p.nom)} style={{ background: 'none', border: 'none', color: '#b83232', cursor: 'pointer' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
