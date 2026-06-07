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
    const res = await apiFetch('/professors');
    const data = await res.json();
    if (res.ok) {
      setProfessors(Array.isArray(data) ? data : []);
    } else {
      setMissatge({ tipus: 'error', text: data.error || 'Error carregant professors' });
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMissatge(null);

    const formData = { ...form };
    if (editingId && !formData.password) {
      delete formData.password;
    }

    const url = editingId ? `/professors/${editingId}` : '/professors';
    const method = editingId ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(formData)
    });
    const data = await res.json();

    if (!res.ok) {
      setMissatge({ tipus: 'error', text: data.error });
    } else {
      setMissatge({ tipus: 'ok', text: editingId ? 'Professor actualitzat correctament' : 'Professor creat correctament' });
      setForm({ email: '', nom: '', rol: 'professor', password: '' });
      setEditingId(null);
      carregarProfessors();
    }
    setSaving(false);
  }

  function editar(professor) {
    setForm({
      email: professor.email,
      nom: professor.nom,
      rol: professor.rol,
      password: ''
    });
    setEditingId(professor.id);
  }

  async function eliminar(id, nom) {
    if (!confirm(`Segur que vols eliminar el professor "${nom}"?`)) return;
    const res = await apiFetch(`/professors/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMissatge({ tipus: 'ok', text: `Professor "${nom}" eliminat` });
      carregarProfessors();
    } else {
      const data = await res.json();
      setMissatge({ tipus: 'error', text: data.error || 'Error en eliminar el professor' });
    }
  }

  function cancelarEdicio() {
    setForm({ email: '', nom: '', rol: 'professor', password: '' });
    setEditingId(null);
    setMissatge(null);
  }

  async function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      if (lines.length === 0) {
        setMissatge({ tipus: 'error', text: 'El fitxer està buit' });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const emailIdx = headers.findIndex(h => h === 'email');
      const nomIdx = headers.findIndex(h => h === 'nom');
      const rolIdx = headers.findIndex(h => h === 'rol');

      if (emailIdx === -1 || nomIdx === -1) {
        setMissatge({ tipus: 'error', text: 'El CSV ha de tenir columnes "email" i "nom"' });
        return;
      }

      const professorsPerImportar = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const email = values[emailIdx];
        const nom = values[nomIdx];
        const rol = values[rolIdx] || 'professor';
        if (email && nom) {
          professorsPerImportar.push({ email, nom, rol, password: 'temp123456' });
        }
      }

      if (professorsPerImportar.length === 0) {
        setMissatge({ tipus: 'error', text: 'No s\'han trobat dades vàlides al CSV' });
        return;
      }

      setSaving(true);
      let creats = 0, errors = 0;
      const errorsList = [];

      for (const prof of professorsPerImportar) {
        const res = await apiFetch('/professors', {
          method: 'POST',
          body: JSON.stringify(prof)
        });
        const data = await res.json();
        if (res.ok) creats++;
        else {
          errors++;
          errorsList.push(`${prof.email}: ${data.error}`);
        }
      }

      if (errors > 0) {
        setMissatge({ tipus: 'error', text: `Importats ${creats} professors. Errors: ${errors}. ${errorsList.slice(0, 3).join('; ')}` });
      } else {
        setMissatge({ tipus: 'ok', text: `Importats ${creats} professors correctament!` });
      }
      carregarProfessors();
      setSaving(false);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  function exportarCSV() {
    if (professors.length === 0) {
      setMissatge({ tipus: 'error', text: 'No hi ha professors per exportar.' });
      return;
    }
    const headers = ['email', 'nom', 'rol'];
    const csvRows = [headers.join(',')];
    professors.forEach(prof => {
      const row = [`"${prof.email}"`, `"${prof.nom}"`, `"${prof.rol}"`];
      csvRows.push(row.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `professors_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMissatge({ tipus: 'ok', text: `Exportats ${professors.length} professors.` });
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
        <h3 style={{ marginBottom: 16, fontSize: 16, color: '#1a1a18' }}>{editingId ? 'Editar professor' : 'Nou professor'}</h3>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Nom complet *</label>
            <input type="text" placeholder="Marta Garcia" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required style={{ width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', color: '#1a1a18' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Correu electrònic *</label>
            <input type="email" placeholder="professor@centre.cat" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={{ width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', color: '#1a1a18' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Contrasenya {!editingId && '*'}</label>
            <input type="password" placeholder="Mínim 6 caràcters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editingId} minLength={6} style={{ width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', color: '#1a1a18' }} />
            {editingId && <span style={{ fontSize: 11, color: '#888' }}>(Deixa buit per mantenir la contrasenya actual)</span>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Rol *</label>
            <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} style={{ width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', color: '#1a1a18' }}>
              <option value="professor">Professor</option>
              <option value="coordinador">Coordinador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button type="submit" disabled={saving} style={{ background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer' }}>{saving ? 'Guardant...' : editingId ? 'Actualitzar professor' : '+ Afegir professor'}</button>
          {editingId && <button type="button" onClick={cancelarEdicio} style={{ background: '#f0eee8', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer' }}>Cancel·lar</button>}
        </div>
        {missatge && <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: missatge.tipus === 'ok' ? '#e8f5ee' : '#fceaea', color: missatge.tipus === 'ok' ? '#1a7a4a' : '#b83232', border: `1px solid ${missatge.tipus === 'ok' ? '#9fe1cb' : '#e8a0a0'}` }}>{missatge.text}</div>}
      </form>

      <div style={{ background: '#fff', border: '1px solid #e0ddd5', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0ddd5' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#6b6a64' }}>{loading ? 'Carregant...' : `${professors.length} ${professors.length === 1 ? 'professor' : 'professors'}`}</span>
        </div>
        {!loading && professors.length === 0 && <p style={{ padding: 24, textAlign: 'center', color: '#a8a79f' }}>Encara no hi ha professors. Utilitza el formulari per crear-ne un.</p>}
        {professors.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f5f4f0' }}>
                <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>Nom</th>
                <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>Rol</th>
                <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>Accions</th>
              </tr>
            </thead>
            <tbody>
              {professors.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid #e0ddd5' }}>
                  <td style={{ padding: '12px 12px', color: '#1a1a18' }}><strong>{p.nom}</strong></td>
                  <td style={{ padding: '12px 12px', color: '#1a1a18' }}>{p.email}</td>
                  <td style={{ padding: '12px 12px', color: '#1a1a18' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: p.rol === 'coordinador' ? '#ebf0fd' : p.rol === 'admin' ? '#f0e8fd' : '#f0eee8', color: p.rol === 'coordinador' ? '#1a3a9e' : p.rol === 'admin' ? '#6a1a9e' : '#6b6a64' }}>
                      {p.rol === 'professor' ? 'Professor' : p.rol === 'coordinador' ? 'Coordinador' : 'Administrador'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                    <button onClick={() => editar(p)} style={{ background: 'none', border: 'none', color: '#2d5be3', cursor: 'pointer', fontSize: 16, marginRight: 12 }}>✏️</button>
                    <button onClick={() => eliminar(p.id, p.nom)} style={{ background: 'none', border: 'none', color: '#b83232', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
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
