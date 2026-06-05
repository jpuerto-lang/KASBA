import { useState, useEffect } from 'react'

const API = 'http://localhost:3000'

export default function GrupManagement() {
  const [grups, setGrups] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nom: '', curs: '', professor_id: '', llindar_assistencia: 80 })
  const [editingId, setEditingId] = useState(null)
  const [professors, setProfessors] = useState([])
  const [missatge, setMissatge] = useState(null)

  useEffect(() => {
    carregarGrups()
    carregarProfessors()
  }, [])

  async function carregarGrups() {
    setLoading(true)
    const res = await fetch(`${API}/grups`)
    const data = await res.json()
    setGrups(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function carregarProfessors() {
    const res = await fetch(`${API}/professors`)
    const data = await res.json()
    setProfessors(Array.isArray(data) ? data : [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMissatge(null)
    
    const url = editingId ? `${API}/grups/${editingId}` : `${API}/grups`
    const method = editingId ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    
    const data = await res.json()
    if (!res.ok) {
      setMissatge({ tipus: 'error', text: data.error })
    } else {
      setMissatge({ tipus: 'ok', text: editingId ? 'Grup actualitzat' : 'Grup creat' })
      setForm({ nom: '', curs: '', professor_id: '', llindar_assistencia: 80 })
      setEditingId(null)
      carregarGrups()
    }
  }

  function editar(grup) {
    setForm({
      nom: grup.nom,
      curs: grup.curs,
      professor_id: grup.professor_id || '',
      llindar_assistencia: grup.llindar_assistencia
    })
    setEditingId(grup.id)
  }

  async function eliminar(id, nom) {
    if (!confirm(`Eliminar el grup "${nom}"?`)) return
    const res = await fetch(`${API}/grups/${id}`, { method: 'DELETE' })
    if (res.ok) carregarGrups()
  }

  function cancelarEdicio() {
    setForm({ nom: '', curs: '', professor_id: '', llindar_assistencia: 80 })
    setEditingId(null)
  }

  return (
    <div>
      <h2>Gestió de grups</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
        <h3>{editingId ? 'Editar grup' : 'Nou grup'}</h3>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <input type="text" placeholder="Nom (ex: 1r ESO A)" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required />
          <input type="text" placeholder="Curs (ex: 1r ESO)" value={form.curs} onChange={e => setForm({...form, curs: e.target.value})} required />
          <select value={form.professor_id} onChange={e => setForm({...form, professor_id: e.target.value})}>
            <option value="">Sense professor assignat</option>
            {professors.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
          <input type="number" placeholder="Llindar assistència (%)" value={form.llindar_assistencia} onChange={e => setForm({...form, llindar_assistencia: parseInt(e.target.value)})} min={0} max={100} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">{editingId ? 'Actualitzar' : 'Crear grup'}</button>
          {editingId && <button type="button" onClick={cancelarEdicio}>Cancel·lar</button>}
        </div>
        {missatge && <div style={{ marginTop: 8, color: missatge.tipus === 'ok' ? 'green' : 'red' }}>{missatge.text}</div>}
      </form>

      {loading && <p>Carregant...</p>}
      {!loading && grups.length === 0 && <p>No hi ha grups.</p>}
      {grups.length > 0 && (
        <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th>Nom</th><th>Curs</th><th>Professor</th><th>Llindar</th><th>Accions</th></tr>
          </thead>
          <tbody>
            {grups.map(g => (
              <tr key={g.id}>
                <td>{g.nom}</td>
                <td>{g.curs}</td>
                <td>{g.professors?.nom || '-'}</td>
                <td>{g.llindar_assistencia}%</td>
                <td><button onClick={() => editar(g)}>✏️</button> <button onClick={() => eliminar(g.id, g.nom)}>🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
