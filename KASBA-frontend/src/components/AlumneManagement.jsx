import { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function AlumneManagement() {
  const [alumnes, setAlumnes] = useState([]);
  const [grups, setGrups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom: '', cognoms: '', email: '', grup_id: '', actiu: true });
  const [editingId, setEditingId] = useState(null);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    carregarAlumnes();
    carregarGrups();
  }, []);

  async function carregarAlumnes() {
    setLoading(true);
    const res = await apiFetch('/alumnes');
    const data = await res.json();
    if (res.ok) {
      setAlumnes(Array.isArray(data) ? data : []);
    } else {
      setMissatge({ tipus: 'error', text: data.error || 'Error carregant alumnes' });
    }
    setLoading(false);
  }

  async function carregarGrups() {
    const res = await apiFetch('/grups');
    const data = await res.json();
    if (res.ok) {
      setGrups(Array.isArray(data) ? data : []);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMissatge(null);

    const url = editingId ? `/alumnes/${editingId}` : '/alumnes';
    const method = editingId ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setMissatge({ tipus: 'error', text: data.error });
    } else {
      setMissatge({ tipus: 'ok', text: editingId ? 'Alumne actualitzat correctament' : 'Alumne creat correctament' });
      setForm({ nom: '', cognoms: '', email: '', grup_id: '', actiu: true });
      setEditingId(null);
      carregarAlumnes();
    }
    setSaving(false);
  }

  function editar(alumne) {
    setForm({
      nom: alumne.nom,
      cognoms: alumne.cognoms,
      email: alumne.email || '',
      grup_id: alumne.grup_id || '',
      actiu: alumne.actiu,
    });
    setEditingId(alumne.id);
  }

  async function eliminar(id, nomComplet) {
    if (!confirm(`Segur que vols eliminar l'alumne "${nomComplet}"?`)) return;
    const res = await apiFetch(`/alumnes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMissatge({ tipus: 'ok', text: `Alumne "${nomComplet}" eliminat` });
      carregarAlumnes();
    } else {
      const data = await res.json();
      setMissatge({ tipus: 'error', text: data.error || 'Error en eliminar l\'alumne' });
    }
  }

  function cancelarEdicio() {
    setForm({ nom: '', cognoms: '', email: '', grup_id: '', actiu: true });
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
      
      const nomIdx = headers.findIndex(h => h === 'nom');
      const cognomsIdx = headers.findIndex(h => h === 'cognoms');
      const emailIdx = headers.findIndex(h => h === 'email');
      
      if (nomIdx === -1 || cognomsIdx === -1) {
        setMissatge({ tipus: 'error', text: 'El CSV ha de tenir columnes "nom" i "cognoms"' });
        return;
      }

      const alumnesPerImportar = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const nom = values[nomIdx];
        const cognoms = values[cognomsIdx];
        const email = emailIdx !== -1 ? values[emailIdx] : '';
        
        if (nom && cognoms) {
          alumnesPerImportar.push({
            nom,
            cognoms,
            email: email || '',
            grup_id: null,
            actiu: true
          });
        }
      }

      if (alumnesPerImportar.length === 0) {
        setMissatge({ tipus: 'error', text: 'No s\'han trobat dades vàlides al CSV' });
        return;
      }

      setSaving(true);
      let creats = 0;
      let errors = 0;
      const errorsList = [];

      for (const alumne of alumnesPerImportar) {
        const res = await apiFetch('/alumnes', {
          method: 'POST',
          body: JSON.stringify(alumne)
        });
        const data = await res.json();
        if (res.ok) {
          creats++;
        } else {
          errors++;
          errorsList.push(`${alumne.nom} ${alumne.cognoms}: ${data.error}`);
        }
      }

      if (errors > 0) {
        setMissatge({ tipus: 'error', text: `Importats ${creats} alumnes. Errors: ${errors}. ${errorsList.slice(0, 3).join('; ')}` });
      } else {
        setMissatge({ tipus: 'ok', text: `Importats ${creats} alumnes correctament!` });
      }
      carregarAlumnes();
      setSaving(false);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  function exportarCSV() {
    if (alumnes.length === 0) {
      setMissatge({ tipus: 'error', text: 'No hi ha alumnes per exportar.' });
      return;
    }

    const headers = ['nom', 'cognoms', 'email'];
    const csvRows = [headers.join(',')];
    
    alumnes.forEach(alumne => {
      const row = [
        `"${alumne.nom}"`,
        `"${alumne.cognoms}"`,
        `"${alumne.email || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alumnes_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMissatge({ tipus: 'ok', text: `Exportats ${alumnes.length} alumnes.` });
  }

  return (
    <div>
      <h2>Gestió d'alumnes</h2>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button 
          onClick={exportarCSV} 
          style={{ background: '#17a2b8', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, border: 'none' }}
          title="Exportar tots els alumnes a CSV"
        >
          📥 Exportar CSV
        </button>
        <label style={{ background: '#28a745', color: 'white', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          📂 Importar CSV
          <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
        </label>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 8, background: '#fff' }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, color: '#1a1a18' }}>{editingId ? 'Editar alumne' : 'Nou alumne'}</h3>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Nom *</label>
            <input 
              type="text" 
              placeholder="Nom" 
              value={form.nom} 
              onChange={e => setForm({ ...form, nom: e.target.value })} 
              required 
              style={{ width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', color: '#1a1a18', boxSizing: 'border-box' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Cognoms *</label>
            <input 
              type="text" 
              placeholder="Cognoms" 
              value={form.cognoms} 
              onChange={e => setForm({ ...form, cognoms: e.target.value })} 
              required 
              style={{ width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', color: '#1a1a18', boxSizing: 'border-box' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Email</label>
            <input 
              type="email" 
              placeholder="alumne@exemple.cat" 
              value={form.email} 
              onChange={e => setForm({ ...form, email: e.target.value })} 
              style={{ width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', color: '#1a1a18', boxSizing: 'border-box' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b6a64', marginBottom: 5, fontWeight: 500 }}>Grup</label>
            <select 
              value={form.grup_id} 
              onChange={e => setForm({ ...form, grup_id: e.target.value })} 
              style={{ width: '100%', border: '1px solid #e0ddd5', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#f5f4f0', color: '#1a1a18', boxSizing: 'border-box' }}
            >
              <option value="">Sense grup</option>
              {grups.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1a1a18' }}>
              <input 
                type="checkbox" 
                checked={form.actiu} 
                onChange={e => setForm({ ...form, actiu: e.target.checked })} 
                style={{ width: 18, height: 18 }}
              />
              Alumne actiu
            </label>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button 
            type="submit" 
            disabled={saving} 
            style={{ background: '#2d5be3', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            {saving ? 'Guardant...' : editingId ? 'Actualitzar alumne' : '+ Afegir alumne'}
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
            {loading ? 'Carregant...' : `${alumnes.length} ${alumnes.length === 1 ? 'alumne' : 'alumnes'}`}
          </span>
        </div>
        {!loading && alumnes.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: '#a8a79f', fontSize: 13 }}>
            Encara no hi ha alumnes. Utilitza el formulari per crear-ne un.
          </p>
        )}
        {alumnes.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f5f4f0' }}>
                <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 11 }}>Nom complet</th>
                <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 11 }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 11 }}>Grup</th>
                <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 11 }}>Actiu</th>
                <th style={{ textAlign: 'center', padding: '12px 12px', color: '#6b6a64', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 11 }}>Accions</th>
              </tr>
            </thead>
            <tbody>
              {alumnes.map(a => {
                let estatColor = '#e8f5ee';
                let estatTextColor = '#1a7a4a';
                let estatText = '✅ Actiu';
                if (!a.actiu) {
                  estatColor = '#fceaea';
                  estatTextColor = '#b83232';
                  estatText = '❌ Inactiu';
                }
                return (
                  <tr key={a.id} style={{ borderTop: '1px solid #e0ddd5' }}>
                    <td style={{ padding: '12px 12px', color: '#1a1a18' }}><strong>{a.nom} {a.cognoms}</strong></td>
                    <td style={{ padding: '12px 12px', color: '#1a1a18' }}>{a.email || '-'}</td>
                    <td style={{ padding: '12px 12px', color: '#1a1a18' }}>{a.grups?.nom || '-'}</td>
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px', 
                        borderRadius: 20, 
                        fontSize: 11, 
                        fontWeight: 500,
                        background: estatColor,
                        color: estatTextColor
                      }}>
                        {estatText}
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                      <button onClick={() => editar(a)} style={{ background: 'none', border: 'none', color: '#2d5be3', cursor: 'pointer', fontSize: 16, marginRight: 12 }} title="Editar">✏️</button>
                      <button onClick={() => eliminar(a.id, `${a.nom} ${a.cognoms}`)} style={{ background: 'none', border: 'none', color: '#b83232', cursor: 'pointer', fontSize: 16 }} title="Eliminar">🗑️</button>
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
