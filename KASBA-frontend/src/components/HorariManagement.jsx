import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

const dies = {
  1: 'Dilluns', 2: 'Dimarts', 3: 'Dimecres', 4: 'Dijous', 5: 'Divendres', 6: 'Dissabte', 7: 'Diumenge'
};

export default function HorariManagement() {
  const [horaris, setHoraris] = useState([]);
  const [grups, setGrups] = useState([]);
  const [materies, setMateries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ grup_id: '', materia_id: '', dia_setmana: 1, hora_inici: '09:00', durada_min: 60 });
  const [editingId, setEditingId] = useState(null);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    carregarHoraris();
    carregarGrups();
    carregarMateries();
  }, []);

  async function carregarHoraris() {
    setLoading(true);
    const res = await fetch(`${API}/horaris`);
    const data = await res.json();
    setHoraris(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function carregarGrups() {
    const res = await fetch(`${API}/grups`);
    const data = await res.json();
    setGrups(Array.isArray(data) ? data : []);
  }

  async function carregarMateries() {
    const res = await fetch(`${API}/materies`);
    const data = await res.json();
    setMateries(Array.isArray(data) ? data : []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMissatge(null);

    const url = editingId ? `${API}/horaris/${editingId}` : `${API}/horaris`;
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
      setMissatge({ tipus: 'ok', text: editingId ? 'Horari actualitzat' : 'Horari creat' });
      setForm({ grup_id: '', materia_id: '', dia_setmana: 1, hora_inici: '09:00', durada_min: 60 });
      setEditingId(null);
      carregarHoraris();
    }
  }

  function editar(horari) {
    setForm({
      grup_id: horari.grup_id,
      materia_id: horari.materia_id,
      dia_setmana: horari.dia_setmana,
      hora_inici: horari.hora_inici.slice(0, 5),
      durada_min: horari.durada_min,
    });
    setEditingId(horari.id);
  }

  async function eliminar(id, materiaNom) {
    if (!confirm(`Eliminar l'horari de ${materiaNom}?`)) return;
    const res = await fetch(`${API}/horaris/${id}`, { method: 'DELETE' });
    if (res.ok) carregarHoraris();
  }

  function cancelarEdicio() {
    setForm({ grup_id: '', materia_id: '', dia_setmana: 1, hora_inici: '09:00', durada_min: 60 });
    setEditingId(null);
  }

  return (
    <div>
      <h2>Gestió d'horaris setmanals</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
        <h3>{editingId ? 'Editar horari' : 'Nou horari'}</h3>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
          <select value={form.grup_id} onChange={e => setForm({ ...form, grup_id: e.target.value })} required>
            <option value="">Selecciona un grup</option>
            {grups.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>

          <select value={form.materia_id} onChange={e => setForm({ ...form, materia_id: e.target.value })} required>
            <option value="">Selecciona una matèria</option>
            {materies.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>

          <select value={form.dia_setmana} onChange={e => setForm({ ...form, dia_setmana: parseInt(e.target.value) })} required>
            {Object.entries(dies).map(([num, nom]) => (
              <option key={num} value={num}>{nom}</option>
            ))}
          </select>

          <input type="time" value={form.hora_inici} onChange={e => setForm({ ...form, hora_inici: e.target.value })} required />

          <input type="number" placeholder="Durada (minuts)" value={form.durada_min} onChange={e => setForm({ ...form, durada_min: parseInt(e.target.value) })} required min="1" step="1" />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">{editingId ? 'Actualitzar' : 'Crear horari'}</button>
          {editingId && <button type="button" onClick={cancelarEdicio}>Cancel·lar</button>}
        </div>
        {missatge && <div style={{ marginTop: 8, color: missatge.tipus === 'ok' ? 'green' : 'red' }}>{missatge.text}</div>}
      </form>

      {loading && <p>Carregant horaris...</p>}
      {!loading && horaris.length === 0 && <p>No hi ha cap horari definit.</p>}
      {horaris.length > 0 && (
        <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th>Grup</th><th>Matèria</th><th>Dia</th><th>Hora inici</th><th>Durada</th><th>Accions</th></tr>
          </thead>
          <tbody>
            {horaris.map(h => (
              <tr key={h.id}>
                <td>{h.grups?.nom || '-'}</td>
                <td>{h.materies?.nom || '-'}</td>
                <td>{dies[h.dia_setmana]}</td>
                <td>{h.hora_inici.slice(0,5)}</td>
                <td>{h.durada_min} min</td>
                <td>
                  <button onClick={() => editar(h)}>✏️</button>
                  <button onClick={() => eliminar(h.id, h.materies?.nom)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
