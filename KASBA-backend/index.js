import express from 'express'
import cors from 'cors'
import ws from 'ws'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
console.log('ROL DE LA CLAU:', JSON.parse(atob(process.env.SUPABASE_SERVICE_KEY.split('.')[1])).role)

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: ws } }
)

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// ==========================================
// RUTES PER A PROFESSORS
// ==========================================

app.get('/professors', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('professors').select('*').order('nom')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/professors', async (req, res) => {
  const { email, nom, rol, password } = req.body
  if (!email || !nom || !rol || !password)
    return res.status(400).json({ error: 'Falten camps obligatoris' })

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true
    })
  if (authError) return res.status(400).json({ error: authError.message })

  const userId = authData.user.id

  const { error: dbError } = await supabaseAdmin
    .from('professors')
    .insert([{ id: userId, email, nom, rol }])

  if (dbError) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return res.status(500).json({ error: dbError.message })
  }

  res.json({ id: userId, email, nom, rol })
})

app.delete('/professors/:id', async (req, res) => {
  const { id } = req.params
  await supabaseAdmin.auth.admin.deleteUser(id)
  const { error } = await supabaseAdmin
    .from('professors').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ==========================================
// RUTES PER A GRUPS
// ==========================================

app.get('/grups', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('grups')
    .select('*, professors(nom)') 
    .order('nom');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/grups', async (req, res) => {
  const { nom, curs, professor_id, llindar_assistencia } = req.body;
  if (!nom || !curs) {
    return res.status(400).json({ error: 'El nom i el curs són obligatoris' });
  }
  const { data, error } = await supabaseAdmin
    .from('grups')
    .insert([{ 
      nom, 
      curs, 
      professor_id: professor_id || null, 
      llindar_assistencia: llindar_assistencia || 80
    }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/grups/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, curs, professor_id, llindar_assistencia } = req.body;
  const { data, error } = await supabaseAdmin
    .from('grups')
    .update({ nom, curs, professor_id, llindar_assistencia })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/grups/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from('grups')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ==========================================
// RUTES PER A ALUMNES
// ==========================================

app.get('/alumnes', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('alumnes')
    .select(`*, grups (nom)`)
    .order('nom');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/alumnes', async (req, res) => {
  const { nom, cognoms, email, dni, grup_id, actiu } = req.body;
  if (!nom || !cognoms) {
    return res.status(400).json({ error: 'Nom i cognoms són obligatoris' });
  }
  const { data, error } = await supabaseAdmin
    .from('alumnes')
    .insert([{ nom, cognoms, email, dni, grup_id, actiu: actiu ?? true }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/alumnes/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, cognoms, email, dni, grup_id, actiu } = req.body;
  const { data, error } = await supabaseAdmin
    .from('alumnes')
    .update({ nom, cognoms, email, dni, grup_id, actiu })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/alumnes/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from('alumnes')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ==========================================
// RUTES PER A MATERIES
// ==========================================

app.get('/materies', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('materies')
    .select('*')
    .order('nom');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/materies', async (req, res) => {
  const { nom, descripcio } = req.body;
  if (!nom) return res.status(400).json({ error: 'El nom és obligatori' });
  const { data, error } = await supabaseAdmin
    .from('materies')
    .insert([{ nom, descripcio }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/materies/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, descripcio } = req.body;
  const { data, error } = await supabaseAdmin
    .from('materies')
    .update({ nom, descripcio })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/materies/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from('materies')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ==========================================
// RUTES PER A HORARIS (amb filtre per grup)
// ==========================================

app.get('/horaris', async (req, res) => {
  let query = supabaseAdmin.from('horaris').select('*, materies(nom), grups(nom)');
  if (req.query.grup_id) {
    query = query.eq('grup_id', req.query.grup_id);
  }
  const { data, error } = await query.order('dia_setmana').order('hora_inici');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/horaris', async (req, res) => {
  const { grup_id, materia_id, dia_setmana, hora_inici, durada_min } = req.body;
  if (!grup_id || !materia_id || !dia_setmana || !hora_inici || !durada_min) {
    return res.status(400).json({ error: 'Falten camps obligatoris' });
  }
  const { data, error } = await supabaseAdmin
    .from('horaris')
    .insert([{ grup_id, materia_id, dia_setmana, hora_inici, durada_min }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/horaris/:id', async (req, res) => {
  const { id } = req.params;
  const { grup_id, materia_id, dia_setmana, hora_inici, durada_min } = req.body;
  const { data, error } = await supabaseAdmin
    .from('horaris')
    .update({ grup_id, materia_id, dia_setmana, hora_inici, durada_min })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/horaris/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from('horaris')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ==========================================
// RUTES PER A HORARIS PER DIA (gestió ràpida)
// ==========================================

app.get('/horaris/grup-dia', async (req, res) => {
  const { grup_id, dia_setmana } = req.query;
  if (!grup_id || !dia_setmana) {
    return res.status(400).json({ error: 'Falten grup_id o dia_setmana' });
  }
  const { data, error } = await supabaseAdmin
    .from('horaris')
    .select('*, materies(nom, id)')
    .eq('grup_id', grup_id)
    .eq('dia_setmana', parseInt(dia_setmana))
    .order('hora_inici');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/horaris/grup-dia', async (req, res) => {
  const { grup_id, dia_setmana, franges } = req.body;
  if (!grup_id || !dia_setmana || !Array.isArray(franges)) {
    return res.status(400).json({ error: 'Dades invàlides' });
  }

  const hores = franges.map(f => f.hora_inici);
  if (new Set(hores).size !== hores.length) {
    return res.status(400).json({ error: 'No pots tenir dues franges a la mateixa hora per al mateix dia.' });
  }

  const { error: deleteError } = await supabaseAdmin
    .from('horaris')
    .delete()
    .eq('grup_id', grup_id)
    .eq('dia_setmana', parseInt(dia_setmana));

  if (deleteError) return res.status(500).json({ error: deleteError.message });

  if (franges.length === 0) {
    return res.json({ ok: true, missatge: 'Franges buides, s\'han eliminat totes.' });
  }

  const novesFranges = franges.map(f => ({
    grup_id,
    dia_setmana: parseInt(dia_setmana),
    hora_inici: f.hora_inici,
    durada_min: f.durada_min,
    materia_id: f.materia_id
  }));

  const { error: insertError } = await supabaseAdmin
    .from('horaris')
    .insert(novesFranges);

  if (insertError) return res.status(500).json({ error: insertError.message });
  res.json({ ok: true, missatge: `Guardades ${franges.length} franges.` });
});

// ==========================================
// RUTES PER A ASSISTÈNCIA
// ==========================================

function getDiaSetmana(data) {
  const date = new Date(data);
  let dia = date.getDay();
  return dia === 0 ? 7 : dia;
}

app.get('/assistencia/config', async (req, res) => {
  const { grup_id, data } = req.query;
  if (!grup_id || !data) {
    return res.status(400).json({ error: 'Falten grup_id o data' });
  }

  const diaSetmana = getDiaSetmana(data);

  const { data: sessions, error: errSessions } = await supabaseAdmin
    .from('horaris')
    .select(`*, materies(nom)`)
    .eq('grup_id', grup_id)
    .eq('dia_setmana', diaSetmana)
    .order('hora_inici');

  if (errSessions) return res.status(500).json({ error: errSessions.message });

  const { data: alumnes, error: errAlumnes } = await supabaseAdmin
    .from('alumnes')
    .select('id, nom, cognoms')
    .eq('grup_id', grup_id)
    .eq('actiu', true)
    .order('nom');

  if (errAlumnes) return res.status(500).json({ error: errAlumnes.message });

  const sessionIds = sessions.map(s => s.id);
  let registresExistents = [];
  if (sessionIds.length > 0) {
    const { data: registres, error: errReg } = await supabaseAdmin
      .from('registres')
      .select('*, minuts_justificats')
      .in('horari_id', sessionIds)
      .eq('data', data);
    if (!errReg) registresExistents = registres;
  }

  res.json({ sessions, alumnes, registresExistents });
});

app.post('/assistencia/guardar', async (req, res) => {
  const { data, registres } = req.body;
  if (!data || !Array.isArray(registres)) {
    return res.status(400).json({ error: 'Falten dades o format incorrecte' });
  }

  const registresPerUpsert = registres.map(r => ({
    alumne_id: r.alumne_id,
    horari_id: r.horari_id,
    data: data,
    minuts_assistits: r.minuts_assistits || 0,
    minuts_justificats: r.minuts_justificats || 0,
    observacions: r.observacions || null
  }));

  const { error } = await supabaseAdmin
    .from('registres')
    .upsert(registresPerUpsert, { onConflict: 'alumne_id, horari_id, data' });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ==========================================
// RUTES PER A DIES NO LECTIUS
// ==========================================

// Llistar dies no lectius d'un grup
app.get('/dies_no_lectius', async (req, res) => {
  const { grup_id } = req.query;
  if (!grup_id) {
    return res.status(400).json({ error: 'Falta grup_id' });
  }
  const { data, error } = await supabaseAdmin
    .from('dies_no_lectius')
    .select('*')
    .eq('grup_id', grup_id)
    .order('data', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Crear dia no lectiu
app.post('/dies_no_lectius', async (req, res) => {
  const { grup_id, data, motiu } = req.body;
  if (!grup_id || !data) {
    return res.status(400).json({ error: 'Falten grup_id o data' });
  }
  const { error } = await supabaseAdmin
    .from('dies_no_lectius')
    .insert([{ grup_id, data, motiu }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Actualitzar dia no lectiu
app.put('/dies_no_lectius/:id', async (req, res) => {
  const { id } = req.params;
  const { data, motiu } = req.body;
  const { error } = await supabaseAdmin
    .from('dies_no_lectius')
    .update({ data, motiu })
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Eliminar dia no lectiu
app.delete('/dies_no_lectius/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin
    .from('dies_no_lectius')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Copiar dies no lectius d'un grup origen a un grup destí
app.post('/dies_no_lectius/copiar', async (req, res) => {
  const { origen_grup_id, desti_grup_id } = req.body;
  if (!origen_grup_id || !desti_grup_id) {
    return res.status(400).json({ error: 'Falten els IDs dels grups' });
  }
  
  const { data: diesOrigen, error: errGet } = await supabaseAdmin
    .from('dies_no_lectius')
    .select('data, motiu')
    .eq('grup_id', origen_grup_id);
  if (errGet) return res.status(500).json({ error: errGet.message });
  
  if (diesOrigen.length === 0) {
    return res.json({ ok: true, missatge: 'El grup origen no té dies no lectius' });
  }
  
  const diesPerInsertar = diesOrigen.map(d => ({
    grup_id: desti_grup_id,
    data: d.data,
    motiu: d.motiu
  }));
  
  const { error: errInsert } = await supabaseAdmin
    .from('dies_no_lectius')
    .insert(diesPerInsertar);
  
  if (errInsert) return res.status(500).json({ error: errInsert.message });
  res.json({ ok: true, missatge: `Copiats ${diesOrigen.length} dies al grup destí` });
});

// ==========================================
// RUTES PER A INFORMES D'ASSISTÈNCIA
// ==========================================

app.get('/informes/assistencia', async (req, res) => {
  const { grup_id, data_inici, data_fi } = req.query;
  
  if (!grup_id || !data_inici || !data_fi) {
    return res.status(400).json({ error: 'Falten paràmetres: grup_id, data_inici, data_fi' });
  }

  try {
    // 1. Obtenir tots els horaris del grup
    const { data: horaris, error: errHoraris } = await supabaseAdmin
      .from('horaris')
      .select('id, dia_setmana, hora_inici, durada_min, materia_id, materies(nom)')
      .eq('grup_id', grup_id);
    
    if (errHoraris) throw new Error(errHoraris.message);

    // 2. Obtenir els dies no lectius del grup en el període
    const { data: diesNoLectius, error: errDies } = await supabaseAdmin
      .from('dies_no_lectius')
      .select('data')
      .eq('grup_id', grup_id)
      .gte('data', data_inici)
      .lte('data', data_fi);
    
    if (errDies) throw new Error(errDies.message);
    
    const diesNoLectiusSet = new Set(diesNoLectius.map(d => d.data));

    // 3. Obtenir tots els alumnes del grup
    const { data: alumnes, error: errAlumnes } = await supabaseAdmin
      .from('alumnes')
      .select('id, nom, cognoms, actiu')
      .eq('grup_id', grup_id)
      .order('nom');
    
    if (errAlumnes) throw new Error(errAlumnes.message);

    // 4. Obtenir tots els registres d'assistència del període per aquests alumnes
    const alumnesIds = alumnes.map(a => a.id);
    const { data: registres, error: errRegistres } = await supabaseAdmin
      .from('registres')
      .select('alumne_id, horari_id, minuts_assistits, minuts_justificats, data')
      .in('alumne_id', alumnesIds)
      .gte('data', data_inici)
      .lte('data', data_fi);
    
    if (errRegistres) throw new Error(errRegistres.message);

    // Crear mapes per accedir ràpidament als registres per alumne
    const registresPerAlumne = {};
    registres.forEach(r => {
      if (!registresPerAlumne[r.alumne_id]) {
        registresPerAlumne[r.alumne_id] = [];
      }
      registresPerAlumne[r.alumne_id].push(r);
    });

    // 5. Calcular minuts teòrics totals del període per a qualsevol alumne
    const dataIniciDate = new Date(data_inici);
    const dataFiDate = new Date(data_fi);
    
    let minutsTeoricsPerAlumne = 0;
    
    // Per cada dia del període
    for (let d = new Date(dataIniciDate); d <= dataFiDate; d.setDate(d.getDate() + 1)) {
      const dataStr = d.toISOString().split('T')[0];
      
      // Saltar dies no lectius
      if (diesNoLectiusSet.has(dataStr)) continue;
      
      const diaSetmana = d.getDay() === 0 ? 7 : d.getDay();
      
      // Sumar durada de les sessions que coincideixen amb aquest dia
      horaris.forEach(h => {
        if (h.dia_setmana === diaSetmana) {
          minutsTeoricsPerAlumne += h.durada_min;
        }
      });
    }

    // Funció per convertir minuts a format "X h Y min"
    function formatHoresMinuts(minuts) {
      const hores = Math.floor(minuts / 60);
      const minutsRestants = minuts % 60;
      if (hores === 0) return `${minutsRestants} min`;
      if (minutsRestants === 0) return `${hores} h`;
      return `${hores} h ${minutsRestants} min`;
    }

    // 6. Calcular per cada alumne
    const resultat = alumnes.map(alumne => {
      let minutsAssistits = 0;
      let minutsJustificats = 0;
      
      const registresAlumne = registresPerAlumne[alumne.id] || [];
      
      registresAlumne.forEach(r => {
        // Comprovar que la data sigui lectiva per al grup
        const dataRegistre = r.data;
        if (!diesNoLectiusSet.has(dataRegistre)) {
          minutsAssistits += r.minuts_assistits || 0;
          minutsJustificats += r.minuts_justificats || 0;
        }
      });
      
      const percentAssistit = minutsTeoricsPerAlumne > 0 
        ? (minutsAssistits / minutsTeoricsPerAlumne) * 100 
        : 0;
      const percentAssistitJustificat = minutsTeoricsPerAlumne > 0 
        ? ((minutsAssistits + minutsJustificats) / minutsTeoricsPerAlumne) * 100 
        : 0;
      
      return {
        id: alumne.id,
        nom: alumne.nom,
        cognoms: alumne.cognoms,
        actiu: alumne.actiu,
        minuts_teorics: minutsTeoricsPerAlumne,
        minuts_assistits: minutsAssistits,
        minuts_justificats: minutsJustificats,
        hores_teoric: formatHoresMinuts(minutsTeoricsPerAlumne),
        hores_assistit: formatHoresMinuts(minutsAssistits),
        hores_justificat: formatHoresMinuts(minutsJustificats),
        percent_assistit: Math.round(percentAssistit * 100) / 100,
        percent_assistit_justificat: Math.round(percentAssistitJustificat * 100) / 100
      };
    });

    // Afegir informació addicional a la resposta
    res.json({
      grup_id,
      data_inici,
      data_fi,
      minuts_teorics_totals: minutsTeoricsPerAlumne,
      hores_teoric_total: formatHoresMinuts(minutsTeoricsPerAlumne),
      alumnes: resultat
    });
    
  } catch (error) {
    console.error('Error generant informe:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// INFORME: ASSISTÈNCIA PER MATÈRIA
// ==========================================

app.get('/informes/assistencia_materia', async (req, res) => {
  const { grup_id, materia_id, data_inici, data_fi } = req.query;
  
  if (!grup_id || !materia_id || !data_inici || !data_fi) {
    return res.status(400).json({ error: 'Falten paràmetres' });
  }

  try {
    // Obtenir sessions de la matèria per aquest grup
    const { data: sessionsMateria, error: errSessions } = await supabaseAdmin
      .from('horaris')
      .select('id, dia_setmana, durada_min')
      .eq('grup_id', grup_id)
      .eq('materia_id', materia_id);
    
    if (errSessions) throw new Error(errSessions.message);
    
    const sessionIds = sessionsMateria.map(s => s.id);

    // Obtenir dies no lectius
    const { data: diesNoLectius, error: errDies } = await supabaseAdmin
      .from('dies_no_lectius')
      .select('data')
      .eq('grup_id', grup_id)
      .gte('data', data_inici)
      .lte('data', data_fi);
    
    if (errDies) throw new Error(errDies.message);
    const diesNoLectiusSet = new Set(diesNoLectius.map(d => d.data));

    // Calcular minuts teòrics totals per a aquesta matèria
    const dataIniciDate = new Date(data_inici);
    const dataFiDate = new Date(data_fi);
    
    let minutsTeorics = 0;
    for (let d = new Date(dataIniciDate); d <= dataFiDate; d.setDate(d.getDate() + 1)) {
      const dataStr = d.toISOString().split('T')[0];
      if (diesNoLectiusSet.has(dataStr)) continue;
      const diaSetmana = d.getDay() === 0 ? 7 : d.getDay();
      sessionsMateria.forEach(s => {
        if (s.dia_setmana === diaSetmana) {
          minutsTeorics += s.durada_min;
        }
      });
    }

    // Obtenir alumnes del grup
    const { data: alumnes, error: errAlumnes } = await supabaseAdmin
      .from('alumnes')
      .select('id, nom, cognoms, actiu')
      .eq('grup_id', grup_id)
      .order('nom');
    
    if (errAlumnes) throw new Error(errAlumnes.message);

    // Obtenir registres d'assistència per a aquestes sessions
    const alumnesIds = alumnes.map(a => a.id);
    const { data: registres, error: errRegistres } = await supabaseAdmin
      .from('registres')
      .select('alumne_id, horari_id, minuts_assistits, minuts_justificats, data')
      .in('alumne_id', alumnesIds)
      .in('horari_id', sessionIds)
      .gte('data', data_inici)
      .lte('data', data_fi);
    
    if (errRegistres) throw new Error(errRegistres.message);

    // Funció per formatar hores
    function formatHores(minuts) {
      const h = Math.floor(minuts / 60);
      const m = minuts % 60;
      if (h === 0) return `${m} min`;
      if (m === 0) return `${h} h`;
      return `${h} h ${m} min`;
    }

    // Calcular per cada alumne
    const resultat = alumnes.map(alumne => {
      const registresAlumne = registres.filter(r => r.alumne_id === alumne.id);
      let minutsAssistits = 0;
      let minutsJustificats = 0;
      
      registresAlumne.forEach(r => {
        if (!diesNoLectiusSet.has(r.data)) {
          minutsAssistits += r.minuts_assistits || 0;
          minutsJustificats += r.minuts_justificats || 0;
        }
      });
      
      const percentAssistit = minutsTeorics > 0 ? (minutsAssistits / minutsTeorics) * 100 : 0;
      const percentAssistitJustificat = minutsTeorics > 0 ? ((minutsAssistits + minutsJustificats) / minutsTeorics) * 100 : 0;
      
      return {
        id: alumne.id,
        nom: alumne.nom,
        cognoms: alumne.cognoms,
        actiu: alumne.actiu,
        minuts_teorics: minutsTeorics,
        minuts_assistits: minutsAssistits,
        minuts_justificats: minutsJustificats,
        hores_teoric: formatHores(minutsTeorics),
        hores_assistit: formatHores(minutsAssistits),
        hores_justificat: formatHores(minutsJustificats),
        percent_assistit: Math.round(percentAssistit * 100) / 100,
        percent_assistit_justificat: Math.round(percentAssistitJustificat * 100) / 100
      };
    });

    res.json({
      grup_id,
      materia_id,
      data_inici,
      data_fi,
      minuts_teorics_totals: minutsTeorics,
      hores_teoric_total: formatHores(minutsTeorics),
      alumnes: resultat
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// INFORME: ASSISTÈNCIA PER GRUP
// ==========================================

app.get('/informes/assistencia_grup', async (req, res) => {
  const { grup_id, data_inici, data_fi } = req.query;
  if (!data_inici || !data_fi) {
    return res.status(400).json({ error: 'Falten les dates' });
  }

  try {
    // Obtenir la llista de grups (si es filtra per grup_id, només un)
    let queryGrups = supabaseAdmin.from('grups').select('id, nom');
    if (grup_id) {
      queryGrups = queryGrups.eq('id', grup_id);
    }
    const { data: grups, error: errGrups } = await queryGrups;
    if (errGrups) throw new Error(errGrups.message);

    const resultat = [];

    for (const grup of grups) {
      // Obtenir horaris del grup
      const { data: horaris, error: errHor } = await supabaseAdmin
        .from('horaris')
        .select('dia_setmana, durada_min')
        .eq('grup_id', grup.id);
      if (errHor) throw new Error(errHor.message);

      // Obtenir dies no lectius del grup en el període
      const { data: diesNoLectius, error: errDies } = await supabaseAdmin
        .from('dies_no_lectius')
        .select('data')
        .eq('grup_id', grup.id)
        .gte('data', data_inici)
        .lte('data', data_fi);
      if (errDies) throw new Error(errDies.message);
      const diesNoLectiusSet = new Set(diesNoLectius.map(d => d.data));

      // Calcular minuts teòrics totals per al grup
      const dataIniciDate = new Date(data_inici);
      const dataFiDate = new Date(data_fi);
      let minutsTeorics = 0;
      for (let d = new Date(dataIniciDate); d <= dataFiDate; d.setDate(d.getDate() + 1)) {
        const dataStr = d.toISOString().split('T')[0];
        if (diesNoLectiusSet.has(dataStr)) continue;
        const diaSetmana = d.getDay() === 0 ? 7 : d.getDay();
        horaris.forEach(h => {
          if (h.dia_setmana === diaSetmana) {
            minutsTeorics += h.durada_min;
          }
        });
      }

      // Obtenir alumnes del grup
      const { data: alumnes, error: errAl } = await supabaseAdmin
        .from('alumnes')
        .select('id')
        .eq('grup_id', grup.id);
      if (errAl) throw new Error(errAl.message);
      const alumnesIds = alumnes.map(a => a.id);

      // Obtenir registres d'assistència dels alumnes d'aquest grup en el període
      let minutsAssistitsGrup = 0;
      let minutsJustificatsGrup = 0;
      if (alumnesIds.length > 0) {
        const { data: registres, error: errReg } = await supabaseAdmin
          .from('registres')
          .select('minuts_assistits, minuts_justificats, data')
          .in('alumne_id', alumnesIds)
          .gte('data', data_inici)
          .lte('data', data_fi);
        if (errReg) throw new Error(errReg.message);

        // Sumar només els registres en dies lectius (respectant dies no lectius)
        registres.forEach(r => {
          if (!diesNoLectiusSet.has(r.data)) {
            minutsAssistitsGrup += r.minuts_assistits || 0;
            minutsJustificatsGrup += r.minuts_justificats || 0;
          }
        });
      }

      const percentAssistit = minutsTeorics > 0 ? (minutsAssistitsGrup / minutsTeorics) * 100 : 0;
      const percentAssistitJustificat = minutsTeorics > 0 ? ((minutsAssistitsGrup + minutsJustificatsGrup) / minutsTeorics) * 100 : 0;

      function formatHores(minuts) {
        const h = Math.floor(minuts / 60);
        const m = minuts % 60;
        if (h === 0) return `${m} min`;
        if (m === 0) return `${h} h`;
        return `${h} h ${m} min`;
      }

      resultat.push({
        grup_id: grup.id,
        grup_nom: grup.nom,
        hores_teoric: formatHores(minutsTeorics),
        hores_assistit: formatHores(minutsAssistitsGrup),
        hores_justificat: formatHores(minutsJustificatsGrup),
        percent_assistit: Math.round(percentAssistit * 100) / 100,
        percent_assistit_justificat: Math.round(percentAssistitJustificat * 100) / 100,
      });
    }

    res.json({
      data_inici,
      data_fi,
        grups: resultat
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// INFORME: ALERTES D'ASSISTÈNCIA
// ==========================================

app.get('/informes/alertes', async (req, res) => {
  const { grup_id, data_inici, data_fi, llindar_personalitzat } = req.query;
  
  if (!data_inici || !data_fi) {
    return res.status(400).json({ error: 'Falten les dates' });
  }

  try {
    // Obtenir els grups (si es filtra per grup_id, només un)
    let queryGrups = supabaseAdmin.from('grups').select('id, nom, llindar_assistencia');
    if (grup_id) {
      queryGrups = queryGrups.eq('id', grup_id);
    }
    const { data: grups, error: errGrups } = await queryGrups;
    if (errGrups) throw new Error(errGrups.message);

    const alertes = [];

    for (const grup of grups) {
      // Obtenir horaris del grup
      const { data: horaris, error: errHor } = await supabaseAdmin
        .from('horaris')
        .select('dia_setmana, durada_min')
        .eq('grup_id', grup.id);
      if (errHor) throw new Error(errHor.message);

      // Obtenir dies no lectius
      const { data: diesNoLectius, error: errDies } = await supabaseAdmin
        .from('dies_no_lectius')
        .select('data')
        .eq('grup_id', grup.id)
        .gte('data', data_inici)
        .lte('data', data_fi);
      if (errDies) throw new Error(errDies.message);
      const diesNoLectiusSet = new Set(diesNoLectius.map(d => d.data));

      // Calcular minuts teòrics totals per a qualsevol alumne del grup
      const dataIniciDate = new Date(data_inici);
      const dataFiDate = new Date(data_fi);
      let minutsTeorics = 0;
      
      for (let d = new Date(dataIniciDate); d <= dataFiDate; d.setDate(d.getDate() + 1)) {
        const dataStr = d.toISOString().split('T')[0];
        if (diesNoLectiusSet.has(dataStr)) continue;
        const diaSetmana = d.getDay() === 0 ? 7 : d.getDay();
        horaris.forEach(h => {
          if (h.dia_setmana === diaSetmana) {
            minutsTeorics += h.durada_min;
          }
        });
      }

      // Si no hi ha hores teòriques, saltar aquest grup
      if (minutsTeorics === 0) continue;

      // Obtenir alumnes actius del grup
      const { data: alumnes, error: errAl } = await supabaseAdmin
        .from('alumnes')
        .select('id, nom, cognoms')
        .eq('grup_id', grup.id)
        .eq('actiu', true);
      if (errAl) throw new Error(errAl.message);
      
      if (alumnes.length === 0) continue;

      const alumnesIds = alumnes.map(a => a.id);

      // Obtenir registres d'assistència
      const { data: registres, error: errReg } = await supabaseAdmin
        .from('registres')
        .select('alumne_id, minuts_assistits, minuts_justificats, data')
        .in('alumne_id', alumnesIds)
        .gte('data', data_inici)
        .lte('data', data_fi);
      if (errReg) throw new Error(errReg.message);

      // Agrupar registres per alumne
      const registresPerAlumne = {};
      registres.forEach(r => {
        if (!registresPerAlumne[r.alumne_id]) {
          registresPerAlumne[r.alumne_id] = [];
        }
        registresPerAlumne[r.alumne_id].push(r);
      });

      // Funció per formatar hores
      function formatHores(minuts) {
        const h = Math.floor(minuts / 60);
        const m = minuts % 60;
        if (h === 0) return `${m} min`;
        if (m === 0) return `${h} h`;
        return `${h} h ${m} min`;
      }

      // Calcular per cada alumne
      for (const alumne of alumnes) {
        const registresAlumne = registresPerAlumne[alumne.id] || [];
        let minutsAssistits = 0;
        let minutsJustificats = 0;
        
        registresAlumne.forEach(r => {
          if (!diesNoLectiusSet.has(r.data)) {
            minutsAssistits += r.minuts_assistits || 0;
            minutsJustificats += r.minuts_justificats || 0;
          }
        });
        
        const percentAssistit = (minutsAssistits / minutsTeorics) * 100;
        
        // Determinar el llindar (personalitzat o el del grup)
        const llindar = llindar_personalitzat 
          ? parseFloat(llindar_personalitzat) 
          : grup.llindar_assistencia;
        
        // Si està per sota del llindar, afegir a alertes
        if (percentAssistit < llindar) {
          alertes.push({
            alumne_id: alumne.id,
            alumne_nom: alumne.nom,
            alumne_cognoms: alumne.cognoms,
            grup_id: grup.id,
            grup_nom: grup.nom,
            hores_teoric: formatHores(minutsTeorics),
            hores_assistit: formatHores(minutsAssistits),
            minuts_teoric: minutsTeorics,
            minuts_assistit: minutsAssistits,
            percent_assistit: Math.round(percentAssistit * 100) / 100,
            llindar: llindar,
            llindar_grup: grup.llindar_assistencia,
            llindar_personalitzat_utilitzat: llindar_personalitzat ? true : false
          });
        }
      }
    }

    // Ordenar alertes per percentatge (de menor a major)
    alertes.sort((a, b) => a.percent_assistit - b.percent_assistit);

    res.json({
      data_inici,
      data_fi,
      total_alertes: alertes.length,
      alertes
    });
    
  } catch (error) {
    console.error('Error generant alertes:', error);
    res.status(500).json({ error: error.message });
  }
});




// ==========================================
// INICI DEL SERVIDOR
// ==========================================

//app.listen(3000, () => console.log('Backend corrent a http://localhost:3000'))
app.listen(3000, '0.0.0.0', () => console.log('Backend corrent a http://0.0.0.0:3000'))

