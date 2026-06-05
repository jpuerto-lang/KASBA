import { useState, useEffect } from 'react';

const API = 'http://localhost:3000';

export default function AssistenciaManagement() {
  const [grups, setGrups] = useState([]);
  const [grupId, setGrupId] = useState('');
  const [data, setData] = useState('');
  const [sessions, setSessions] = useState([]);
  const [alumnes, setAlumnes] = useState([]);
  const [registresExistents, setRegistresExistents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [missatge, setMissatge] = useState(null);
  // Estat: { sessioId: { alumneId: { minuts: number, observacions: string } } }
  const [valorsPerSessio, setValorsPerSessio] = useState({});

  useEffect(() => {
    carregarGrups();
  }, []);

  async function carregarGrups() {
    const res = await fetch(`${API}/grups`);
    const data = await res.json();
    setGrups(Array.isArray(data) ? data : []);
  }

  async function carregarConfiguracio() {
    if (!grupId || !data) return;
    setLoading(true);
    setMissatge(null);
    try {
      const res = await fetch(`${API}/assistencia/config?grup_id=${grupId}&data=${data}`);
      const config = await res.json();
      if (!res.ok) throw new Error(config.error);

      setSessions(config.sessions);
      setAlumnes(config.alumnes);
      setRegistresExistents(config.registresExistents);

      // Inicialitzar valors per defecte per cada sessió i alumne (ara inclou observacions)
      const nousValors = {};
      config.sessions.forEach(sessio => {
        const mapAlumne = {};
        config.alumnes.forEach(alumne => {
          const registreExistent = config.registresExistents.find(
            r => r.alumne_id === alumne.id && r.horari_id === sessio.id
          );
          mapAlumne[alumne.id] = {
            minuts: registreExistent ? registreExistent.minuts_assistits : sessio.durada_min,
            observacions: registreExistent ? registreExistent.observacions || '' : ''
          };
        });
        nousValors[sessio.id] = mapAlumne;
      });
      setValorsPerSessio(nousValors);
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  function handleCanviMinuts(sessioId, alumneId, minuts) {
    setValorsPerSessio(prev => ({
      ...prev,
      [sessioId]: {
        ...prev[sessioId],
        [alumneId]: { ...prev[sessioId][alumneId], minuts }
      }
    }));
  }

  function handleCanviObservacions(sessioId, alumneId, observacions) {
    setValorsPerSessio(prev => ({
      ...prev,
      [sessioId]: {
        ...prev[sessioId],
        [alumneId]: { ...prev[sessioId][alumneId], observacions }
      }
    }));
  }

  async function guardarSessio(sessioId) {
    const registresAGuardar = alumnes.map(alumne => ({
      alumne_id: alumne.id,
      horari_id: sessioId,
      minuts_assistits: valorsPerSessio[sessioId][alumne.id].minuts,
      observacions: valorsPerSessio[sessioId][alumne.id].observacions || null
    }));

    setSaving(true);
    try {
      const res = await fetch(`${API}/assistencia/guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, registres: registresAGuardar }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setMissatge({ tipus: 'ok', text: 'Assistència guardada correctament' });
      carregarConfiguracio(); // Recarregar per actualitzar els valors
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function guardarTotes() {
    let totsRegistres = [];
    sessions.forEach(sessio => {
      alumnes.forEach(alumne => {
        totsRegistres.push({
          alumne_id: alumne.id,
          horari_id: sessio.id,
          minuts_assistits: valorsPerSessio[sessio.id][alumne.id].minuts,
          observacions: valorsPerSessio[sessio.id][alumne.id].observacions || null
        });
      });
    });
    setSaving(true);
    try {
      const res = await fetch(`${API}/assistencia/guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, registres: totsRegistres }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setMissatge({ tipus: 'ok', text: 'Totes les sessions guardades correctament' });
      carregarConfiguracio();
    } catch (err) {
      setMissatge({ tipus: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>Registre d'assistència</h2>

      {/* Formulari de selecció */}
      <div style={{ marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <label>Grup</label>
          <select value={grupId} onChange={e => setGrupId(e.target.value)} style={{ padding: 8, marginLeft: 8 }}>
            <option value="">-- Selecciona --</option>
            {grups.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </div>
        <div>
          <label>Data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)} style={{ padding: 8, marginLeft: 8 }} />
        </div>
        <button onClick={carregarConfiguracio} disabled={!grupId || !data}>Carregar horari</button>
      </div>

      {loading && <p>Carregant alumnes i sessions...</p>}
      {missatge && <div style={{ marginBottom: 12, padding: 8, borderRadius: 4, background: missatge.tipus === 'ok' ? '#d4edda' : '#f8d7da', color: missatge.tipus === 'ok' ? '#155724' : '#721c24' }}>{missatge.text}</div>}

      {!loading && sessions.length === 0 && grupId && data && (
        <p>No hi ha cap sessió programada per aquest grup en aquest dia.</p>
      )}

      {sessions.map(sessio => (
        <div key={sessio.id} style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9' }}>
          <h3>
            {sessio.materies?.nom} - {sessio.hora_inici.slice(0,5)} ({sessio.durada_min} min)
          </h3>
          <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th>Alumne</th>
                <th>Minuts assistits (màx. {sessio.durada_min})</th>
                <th>Observacions</th>
              </tr>
            </thead>
            <tbody>
              {alumnes.map(alumne => {
                const valors = valorsPerSessio[sessio.id]?.[alumne.id] ?? { minuts: sessio.durada_min, observacions: '' };
                return (
                  <tr key={alumne.id}>
                    <td>{alumne.nom} {alumne.cognoms}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={sessio.durada_min}
                        value={valors.minuts}
                        onChange={e => handleCanviMinuts(sessio.id, alumne.id, parseInt(e.target.value) || 0)}
                        style={{ width: 100, padding: 4 }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Opcional"
                        value={valors.observacions}
                        onChange={e => handleCanviObservacions(sessio.id, alumne.id, e.target.value)}
                        style={{ width: '100%', padding: 4 }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => guardarSessio(sessio.id)} disabled={saving}>Guardar aquesta sessió</button>
          </div>
        </div>
      ))}

      {sessions.length > 0 && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button onClick={guardarTotes} disabled={saving} style={{ background: '#28a745', color: 'white', padding: '10px 20px' }}>
            Guardar totes les sessions
          </button>
        </div>
      )}
    </div>
  );
}
