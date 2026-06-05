import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

const dies = {
  1: 'Dilluns', 2: 'Dimarts', 3: 'Dimecres', 4: 'Dijous', 5: 'Divendres', 6: 'Dissabte', 7: 'Diumenge'
};

export default function HorariPerDia() {
  const [grups, setGrups] = useState([]);
  const [materies, setMateries] = useState([]);
  const [grupId, setGrupId] = useState('');
  const [diaSetmana, setDiaSetmana] = useState(1);
  const [franges, setFranges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    carregarGrups();
    carregarMateries();
  }, []);

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

  async function carregarFranges() {
    if (!grupId || !diaSetmana) return;
    setLoading(true);
    setMissatge(null);
    try {
      const res = await fetch(`${API}/horaris/grup-dia?grup_id=${grupId}&dia_setmana=${diaSetmana}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Convertir les dades al format de franges del formulari
      const frangesForm = data.map(f => ({
        id: f.id,
        hora_inici: f.hora_inici.slice(0,5),
        durada_min: f.durada_min,
        materia_id: f.materia_id
      }));
      setFranges(frangesForm);
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  function afegirFranja() {
    setFranges([...franges, { hora_inici: '09:00', durada_min: 60, materia_id: '' }]);
  }

  function eliminarFranja(index) {
    const noves = [...franges];
    noves.splice(index, 1);
    setFranges(noves);
  }

  function updateFranja(index, camp, valor) {
    const noves = [...franges];
    noves[index][camp] = valor;
    setFranges(noves);
  }

  async function guardarFranges() {
    // Validar que cada franja tingui matèria seleccionada i valors correctes
    for (let i = 0; i < franges.length; i++) {
      const f = franges[i];
      if (!f.materia_id) {
        setMissatge({ tipus: 'error', text: `Franja ${i+1}: has de seleccionar una matèria.` });
        return;
      }
      if (!f.hora_inici || f.durada_min < 1) {
        setMissatge({ tipus: 'error', text: `Franja ${i+1}: hora o durada invàlida.` });
        return;
      }
    }

    setSaving(true);
    setMissatge(null);
    try {
      const res = await fetch(`${API}/horaris/grup-dia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grup_id: grupId,
          dia_setmana: diaSetmana,
          franges: franges.map(({ hora_inici, durada_min, materia_id }) => ({
            hora_inici,
            durada_min,
            materia_id
          }))
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setMissatge({ tipus: 'ok', text: 'Horari desat correctament!' });
      // Recarregar per mostrar els ids (opcional)
      carregarFranges();
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>Gestió ràpida d'horaris per dia</h2>

      <div style={{ marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label>Grup</label>
          <select value={grupId} onChange={e => setGrupId(e.target.value)} style={{ padding: 8, marginLeft: 8 }}>
            <option value="">-- Selecciona --</option>
            {grups.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </div>
        <div>
          <label>Dia de la setmana</label>
          <select value={diaSetmana} onChange={e => setDiaSetmana(parseInt(e.target.value))} style={{ padding: 8, marginLeft: 8 }}>
            {Object.entries(dies).map(([num, nom]) => (
              <option key={num} value={num}>{nom}</option>
            ))}
          </select>
        </div>
        <button onClick={carregarFranges} disabled={!grupId}>Carregar franges actuals</button>
      </div>

      {loading && <p>Carregant...</p>}
      {missatge && <div style={{ marginBottom: 12, padding: 8, borderRadius: 4, background: missatge.tipus === 'ok' ? '#d4edda' : '#f8d7da', color: missatge.tipus === 'ok' ? '#155724' : '#721c24' }}>{missatge.text}</div>}

      <div style={{ marginBottom: 16 }}>
        <button onClick={afegirFranja} style={{ background: '#28a745', color: 'white' }}>+ Afegir franja horària</button>
      </div>

      {franges.map((franja, idx) => (
        <div key={idx} style={{ marginBottom: 12, padding: 12, border: '1px solid #ddd', borderRadius: 6, background: '#fafafa', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="time"
            value={franja.hora_inici}
            onChange={e => updateFranja(idx, 'hora_inici', e.target.value)}
            style={{ padding: 6 }}
          />
          <input
            type="number"
            placeholder="Durada (min)"
            value={franja.durada_min}
            onChange={e => updateFranja(idx, 'durada_min', parseInt(e.target.value) || 0)}
            style={{ width: 100, padding: 6 }}
            min="1"
          />
          <select value={franja.materia_id} onChange={e => updateFranja(idx, 'materia_id', e.target.value)} style={{ padding: 6, minWidth: 150 }}>
            <option value="">-- Matèria --</option>
            {materies.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
          <button onClick={() => eliminarFranja(idx)} style={{ background: '#dc3545', color: 'white' }}>Eliminar</button>
        </div>
      ))}

      {franges.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button onClick={guardarFranges} disabled={saving} style={{ background: '#2d5be3', color: 'white', padding: '8px 20px' }}>
            {saving ? 'Guardant...' : 'Desar totes les franges'}
          </button>
        </div>
      )}
    </div>
  );
}
