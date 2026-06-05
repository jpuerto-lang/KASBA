import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

export default function AlumneManagement() {
  const [alumnes, setAlumnes] = useState([]);
  const [grups, setGrups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nom: '', cognoms: '', dni: '', grup_id: '', actiu: true });
  const [editingId, setEditingId] = useState(null);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    carregarAlumnes();
    carregarGrups();
  }, []);

  async function carregarAlumnes() {
    setLoading(true);
    const res = await fetch(`${API}/alumnes`);
    const data = await res.json();
    setAlumnes(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function carregarGrups() {
    const res = await fetch(`${API}/grups`);
    const data = await res.json();
    setGrups(Array.isArray(data) ? data : []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMissatge(null);

    const url = editingId ? `${API}/alumnes/${editingId}` : `${API}/alumnes`;
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setMissatge({ tipus: 'error', text: data.error });
    } else {
      setMissatge({ tipus: 'ok', text: editingId ? 'Alumne actualitzat' : 'Alumne creat' });
      setForm({ nom: '', cognoms: '', dni: '', grup_id: '', actiu: true });
      setEditingId(null);
      carregarAlumnes();
    }
  }

  function editar(alumne) {
    setForm({
      nom: alumne.nom,
      cognoms: alumne.cognoms,
      dni: alumne.dni || '',
      grup_id: alumne.grup_id || '',
      actiu: alumne.actiu,
    });
    setEditingId(alumne.id);
  }

  async function eliminar(id, nomComplet) {
    if (!confirm(`Eliminar l'alumne ${nomComplet}?`)) return;
    const res = await fetch(`${API}/alumnes/${id}`, { method: 'DELETE' });
    if (res.ok) carregarAlumnes();
  }

  function cancelarEdicio() {
    setForm({ nom: '', cognoms: '', dni: '', grup_id: '', actiu: true });
    setEditingId(null);
  }

  return (
    <div>
      <h2>Gestió d'alumnes</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
        <h3>{editingId ? 'Editar alumne' : 'Nou alumne'}</h3>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <input type="text" placeholder="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
          <input type="text" placeholder="Cognoms" value={form.cognoms} onChange={e => setForm({ ...form, cognoms: e.target.value })} required />
          <input type="text" placeholder="DNI (opcional)" value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} />
          <select value={form.grup_id} onChange={e => setForm({ ...form, grup_id: e.target.value })}>
            <option value="">Sense grup</option>
            {grups.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.actiu} onChange={e => setForm({ ...form, actiu: e.target.checked })} />
            Actiu
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">{editingId ? 'Actualitzar' : 'Crear alumne'}</button>
          {editingId && <button type="button" onClick={cancelarEdicio}>Cancel·lar</button>}
        </div>
        {missatge && <div style={{ marginTop: 8, color: missatge.tipus === 'ok' ? 'green' : 'red' }}>{missatge.text}</div>}
      </form>

      {loading && <p>Carregant alumnes...</p>}
      {!loading && alumnes.length === 0 && <p>No hi ha alumnes.</p>}
      {alumnes.length > 0 && (
        <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th>Nom complet</th><th>DNI</th><th>Grup</th><th>Actiu</th><th>Accions</th></tr>
          </thead>
          <tbody>
            {alumnes.map(a => (
              <tr key={a.id} style={{ opacity: a.actiu ? 1 : 0.6 }}>
                <td>{a.nom} {a.cognoms}</td>
                <td>{a.dni || '-'}</td>
                <td>{a.grups?.nom || '-'}</td>
                <td>{a.actiu ? '✅ Sí' : '❌ No'}</td>
                <td>
                  <button onClick={() => editar(a)}>✏️</button>
                  <button onClick={() => eliminar(a.id, `${a.nom} ${a.cognoms}`)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
