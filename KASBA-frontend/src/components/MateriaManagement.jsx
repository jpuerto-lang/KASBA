import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

export default function MateriaManagement() {
  const [materies, setMateries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nom: '', descripcio: '' });
  const [editingId, setEditingId] = useState(null);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    carregarMateries();
  }, []);

  async function carregarMateries() {
    setLoading(true);
    const res = await fetch(`${API}/materies`);
    const data = await res.json();
    setMateries(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMissatge(null);

    const url = editingId ? `${API}/materies/${editingId}` : `${API}/materies`;
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
      setMissatge({ tipus: 'ok', text: editingId ? 'Matèria actualitzada' : 'Matèria creada' });
      setForm({ nom: '', descripcio: '' });
      setEditingId(null);
      carregarMateries();
    }
  }

  function editar(materia) {
    setForm({ nom: materia.nom, descripcio: materia.descripcio || '' });
    setEditingId(materia.id);
  }

  async function eliminar(id, nom) {
    if (!confirm(`Eliminar la matèria "${nom}"?`)) return;
    const res = await fetch(`${API}/materies/${id}`, { method: 'DELETE' });
    if (res.ok) carregarMateries();
  }

  function cancelarEdicio() {
    setForm({ nom: '', descripcio: '' });
    setEditingId(null);
  }

  return (
    <div>
      <h2>Gestió de matèries</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
        <h3>{editingId ? 'Editar matèria' : 'Nova matèria'}</h3>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 2fr' }}>
          <input
            type="text"
            placeholder="Nom (ex: Matemàtiques)"
            value={form.nom}
            onChange={e => setForm({ ...form, nom: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Descripció (opcional)"
            value={form.descripcio}
            onChange={e => setForm({ ...form, descripcio: e.target.value })}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">{editingId ? 'Actualitzar' : 'Crear matèria'}</button>
          {editingId && <button type="button" onClick={cancelarEdicio}>Cancel·lar</button>}
        </div>
        {missatge && <div style={{ marginTop: 8, color: missatge.tipus === 'ok' ? 'green' : 'red' }}>{missatge.text}</div>}
      </form>

      {loading && <p>Carregant matèries...</p>}
      {!loading && materies.length === 0 && <p>No hi ha matèries definides.</p>}
      {materies.length > 0 && (
        <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th>Nom</th><th>Descripció</th><th>Accions</th></tr>
          </thead>
          <tbody>
            {materies.map(m => (
              <tr key={m.id}>
                <td>{m.nom}</td>
                <td>{m.descripcio || '-'}</td>
                <td>
                  <button onClick={() => editar(m)}>✏️</button>
                  <button onClick={() => eliminar(m.id, m.nom)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
