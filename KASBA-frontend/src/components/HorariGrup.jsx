import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

const dies = {
  1: 'Dilluns', 2: 'Dimarts', 3: 'Dimecres', 4: 'Dijous', 5: 'Divendres', 6: 'Dissabte', 7: 'Diumenge'
};

export default function HorariGrup() {
  const [grups, setGrups] = useState([]);
  const [grupId, setGrupId] = useState('');
  const [horari, setHorari] = useState([]);
  const [loading, setLoading] = useState(false);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    carregarGrups();
  }, []);

  async function carregarGrups() {
    const res = await fetch(`${API}/grups`);
    const data = await res.json();
    setGrups(Array.isArray(data) ? data : []);
  }

  async function carregarHorari() {
    if (!grupId) return;
    setLoading(true);
    setMissatge(null);
    try {
      const res = await fetch(`${API}/horaris?grup_id=${grupId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHorari(data);
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  // Agrupar per dia
  const horariPerDia = {};
  diesAgrupats: {
    for (let dia = 1; dia <= 7; dia++) {
      horariPerDia[dia] = horari.filter(f => f.dia_setmana === dia).sort((a,b) => a.hora_inici.localeCompare(b.hora_inici));
    }
  }

  // Funció per anar a editar un dia concret
  function editarDia(dia) {
    // Guardem a localStorage o passem per URL (millor) el grup i dia
    // Com que el nostre router és bàsic, canviarem la secció global des de App.jsx?
    // De moment, obrirem una finestra amb confirmació o simplement avisem.
    // Però el més net és que App.jsx tingui un estat per canviar de secció i passar paràmetres.
    // Per ara, ho farem senzill: obrim la pàgina d'horari per dia en una nova pestanya?
    // O millor: redirigim a la secció 'horaris' (HorariPerDia) i passem grupId i dia via query string.
    // Però com que la nostra App no té routing complex, ho deixarem amb un alert que digui com fer-ho manualment.
    // En una millora futura, es pot fer servir context o un sistema de rutes.
    alert(`Per editar el ${dies[dia]} del grup, ves a la pestanya "Horaris (ràpid)" i selecciona el mateix grup i dia.`);
  }

  return (
    <div>
      <h2>Horari complet d'un grup</h2>

      <div style={{ marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <label>Selecciona un grup</label>
          <select value={grupId} onChange={e => setGrupId(e.target.value)} style={{ padding: 8, marginLeft: 8 }}>
            <option value="">-- Tria --</option>
            {grups.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </div>
        <button onClick={carregarHorari} disabled={!grupId}>Carregar horari</button>
      </div>

      {loading && <p>Carregant...</p>}
      {missatge && <div style={{ marginBottom: 12, padding: 8, borderRadius: 4, background: missatge.tipus === 'ok' ? '#d4edda' : '#f8d7da', color: missatge.tipus === 'ok' ? '#155724' : '#721c24' }}>{missatge.text}</div>}

      {!loading && grupId && horari.length === 0 && (
        <p>No hi ha cap horari definit per a aquest grup. Vés a la pestanya "Horaris (ràpid)" per crear-lo.</p>
      )}

      {horari.length > 0 && (
        <div>
          {Object.entries(dies).map(([num, nomDia]) => {
            const franges = horariPerDia[num];
            if (!franges || franges.length === 0) return null;
            return (
              <div key={num} style={{ marginBottom: 24 }}>
                <h3 style={{ background: '#f0eee8', padding: 8, borderRadius: 6 }}>{nomDia}</h3>
                <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#e0ddd5' }}>
                      <th>Hora inici</th>
                      <th>Durada (min)</th>
                      <th>Matèria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {franges.map(f => (
                      <tr key={f.id}>
                        <td>{f.hora_inici.slice(0,5)}</td>
                        <td>{f.durada_min}</td>
                        <td>{f.materies?.nom}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => editarDia(parseInt(num))} style={{ fontSize: 12 }}>✏️ Editar aquest dia</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
