import { useState, useEffect } from 'react'

const API = 'http://localhost:3000'

export default function App() {
  const [professors, setProfessors] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ email: '', nom: '', rol: 'professor', password: '' })
  const [saving, setSaving] = useState(false)
  const [missatge, setMissatge] = useState(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const res = await fetch(`${API}/professors`)
    const data = await res.json()
    setProfessors(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setMissatge(null)
    const res = await fetch(`${API}/professors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (!res.ok) {
      setMissatge({ tipus: 'error', text: 'Error: ' + data.error })
    } else {
      setMissatge({ tipus: 'ok', text: `Professor "${data.nom}" donat d'alta correctament!` })
      setForm({ email: '', nom: '', rol: 'professor', password: '' })
      carregar()
    }
    setSaving(false)
  }

  async function eliminar(id, nom) {
    if (!confirm(`Segur que vols eliminar "${nom}"?`)) return
    await fetch(`${API}/professors/${id}`, { method: 'DELETE' })
    carregar()
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Gestió de professors</h1>
      <p style={{ color: '#888', marginBottom: 28, fontSize: 14 }}>Alta i consulta de professors del centre</p>

      <div style={{ background: '#fff', border: '1px solid #e0ddd5', borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Nou professor</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Nom complet</label>
              <input style={inp} type="text" placeholder="Marta Garcia"
                value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
            </div>
            <div>
              <label style={lbl}>Correu electrònic</label>
              <input style={inp} type="email" placeholder="professor@centre.cat"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={lbl}>Contrasenya provisional</label>
              <input style={inp} type="password" placeholder="Mínim 6 caràcters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <div>
              <label style={lbl}>Rol</label>
              <select style={inp} value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                <option value="professor">Professor</option>
                <option value="coordinador">Coordinador</option>
              </select>
            </div>
          </div>
          {missatge && (
            <div style={{
              padding: '10px 14px', borderRadius: 6, marginBottom: 12, fontSize: 13,
              background: missatge.tipus === 'ok' ? '#e8f5ee' : '#fceaea',
              color: missatge.tipus === 'ok' ? '#1a7a4a' : '#b83232',
              border: `1px solid ${missatge.tipus === 'ok' ? '#9fe1cb' : '#e8a0a0'}`
            }}>{missatge.text}</div>
          )}
          <button type="submit" disabled={saving} style={btn}>
            {saving ? 'Guardant...' : '+ Afegir professor'}
          </button>
        </form>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e0ddd5', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0ddd5' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#6b6a64' }}>
            {loading ? 'Carregant...' : `${professors.length} professors`}
          </span>
        </div>
        {!loading && professors.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: '#a8a79f', fontSize: 13 }}>
            Encara no hi ha professors.
          </p>
        )}
        {professors.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f5f4f0' }}>
                <th style={th}>Nom</th>
                <th style={th}>Email</th>
                <th style={th}>Rol</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {professors.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid #e0ddd5' }}>
                  <td style={td}><strong>{p.nom}</strong></td>
                  <td style={td}>{p.email}</td>
                  <td style={td}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                      background: p.rol === 'coordinador' ? '#ebf0fd' : '#f0eee8',
                      color: p.rol === 'coordinador' ? '#1a3a9e' : '#6b6a64'
                    }}>{p.rol}</span>
                  </td>
                  <td style={td}>
                    <button onClick={() => eliminar(p.id, p.nom)}
                      style={{ background: 'none', border: 'none', color: '#b83232', cursor: 'pointer', fontSize: 12 }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }
const inp = { width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', boxSizing: 'border-box' }
const btn = { background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const th = { textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#a8a79f', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.3px' }
const td = { padding: '10px 12px', color: '#1a1a18' }
