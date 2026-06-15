import express from 'express'
import cors from 'cors'
import ws from 'ws'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
console.log('ROL DE LA CLAU:', JSON.parse(atob(process.env.SUPABASE_SERVICE_KEY.split('.')[1])).role)

// Funció per crear un client Supabase fresc per a cada petició
function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      realtime: { transport: ws },
      auth: {
        persistSession: false   // per assegurar que no es guarda estat de sessió
      }
    }
  )
}

const app = express()

//app.use(cors({ origin: 'http://localhost:5173' }))

//Només per proves a la LAN
app.use(cors({ origin: true }))   // Permet qualsevol origen

app.use(express.json())

// ==========================================
// MIDDLEWARE D'AUTENTICACIÓ
// ==========================================

async function autenticacio(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autoritzat: falta token' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Token invàlid o expirat' });
  }

  // Obtenir el rol i el grup (si és tutor) de l'usuari
  const { data: professor, error: errProf } = await supabase
    .from('professors')
    .select('id, nom, email, rol')
    .eq('id', user.id)
    .single();
  
  if (errProf || !professor) {
    return res.status(403).json({ error: 'Usuari no autoritzat com a professor' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    nom: professor.nom,
    rol: professor.rol
  };

  // Si és tutor, obtenir el seu grup_id
  if (professor.rol === 'tutor') {
    const { data: grup, error: errGrup } = await supabase
      .from('grups')
      .select('id')
      .eq('professor_id', user.id)
      .single();
    if (!errGrup && grup) {
      req.user.grup_id = grup.id;
    }
  }

  next();
}

function adminOnly(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Accés denegat: necessites permisos d\'administrador' });
  }
  next();
}

// ==========================================
// AUTENTICACIÓ: LOGIN (públic)
// ==========================================

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Falten email o contrasenya' });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(401).json({ error: 'Credencials incorrectes' });
  }

  // Obtenir rol i grup del professor
  const { data: professor, error: errProf } = await supabase
    .from('professors')
    .select('id, nom, email, rol')
    .eq('id', data.user.id)
    .single();

  if (errProf || !professor) {
    return res.status(403).json({ error: 'Usuari no autoritzat com a professor' });
  }

  let grup_id = null;
  if (professor.rol === 'tutor') {
    const { data: grup } = await supabase
      .from('grups')
      .select('id')
      .eq('professor_id', professor.id)
      .single();
    if (grup) grup_id = grup.id;
  }

  res.json({
    token: data.session.access_token,
    user: {
      id: professor.id,
      nom: professor.nom,
      email: professor.email,
      rol: professor.rol,
      grup_id
    }
  });
});

// ==========================================
// RUTES PER A PROFESSORS (només admin)
// ==========================================

app.get('/professors', autenticacio, adminOnly, async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('professors').select('*').order('nom')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/professors', autenticacio, adminOnly, async (req, res) => {
  const { email, nom, rol, password } = req.body
  if (!email || !nom || !rol || !password)
    return res.status(400).json({ error: 'Falten camps obligatoris' })

  const supabase = getSupabaseAdmin();
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email, password, email_confirm: true
    })
  if (authError) return res.status(400).json({ error: authError.message })

  const userId = authData.user.id

  const { error: dbError } = await supabase
    .from('professors')
    .insert([{ id: userId, email, nom, rol }])

  if (dbError) {
    await supabase.auth.admin.deleteUser(userId)
    return res.status(500).json({ error: dbError.message })
  }

  res.json({ id: userId, email, nom, rol })
})

app.put('/professors/:id', autenticacio, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { nom, email, rol } = req.body;

  if (!nom && !email && !rol) {
    return res.status(400).json({ error: 'Cal proporcionar algun camp per actualitzar' });
  }

  const updates = {};
  if (nom) updates.nom = nom;
  if (email) updates.email = email;
  if (rol) updates.rol = rol;

  const supabase = getSupabaseAdmin();

  // 1. Actualitzar taula professors
  const { error: dbError } = await supabase
    .from('professors')
    .update(updates)
    .eq('id', id);

  if (dbError) {
    return res.status(500).json({ error: dbError.message });
  }

  // 2. Si s'ha canviat l'email, actualitzar també a Auth (opcional, no crític)
  if (email) {
    const { error: authError } = await supabase.auth.admin.updateUserById(id, { email });
    if (authError) console.error('Error actualitzant email a Auth:', authError);
    // No retornem error per evitar bloquejar l'operació principal
  }

  res.json({ ok: true, message: 'Professor actualitzat correctament' });
});

app.delete('/professors/:id', autenticacio, adminOnly, async (req, res) => {
  const { id } = req.params
  const supabase = getSupabaseAdmin();
  await supabase.auth.admin.deleteUser(id)
  const { error } = await supabase
    .from('professors').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ==========================================
// RUTES PER A GRUPS
// ==========================================

app.get('/grups', autenticacio, async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('grups')
    .select('*, professors(nom)') 
    .order('nom');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/grups', autenticacio, adminOnly, async (req, res) => {
  const { nom, curs, professor_id, llindar_assistencia } = req.body;
  if (!nom || !curs) {
    return res.status(400).json({ error: 'El nom i el curs són obligatoris' });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
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

app.put('/grups/:id', autenticacio, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { nom, curs, professor_id, llindar_assistencia } = req.body;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('grups')
    .update({ nom, curs, professor_id, llindar_assistencia })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/grups/:id', autenticacio, adminOnly, async (req, res) => {
  const { id } = req.params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('grups')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ==========================================
// RUTES PER A ALUMNES (tots autenticats, tutors només el seu grup)
// ==========================================

app.get('/alumnes', autenticacio, async (req, res) => {
  const supabase = getSupabaseAdmin();
  let query = supabase.from('alumnes').select('*, grups (nom)');
  if (req.user.rol === 'tutor' && req.user.grup_id) {
    query = query.eq('grup_id', req.user.grup_id);
  }
  const { data, error } = await query.order('nom');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/alumnes', autenticacio, async (req, res) => {
  const { nom, cognoms, email, dni, grup_id, actiu } = req.body;
  if (!nom || !cognoms) {
    return res.status(400).json({ error: 'Nom i cognoms són obligatoris' });
  }
  // Tutor només pot crear alumnes en el seu grup
  if (req.user.rol === 'tutor') {
    if (!req.user.grup_id || grup_id !== req.user.grup_id) {
      return res.status(403).json({ error: 'No pots crear alumnes en un altre grup' });
    }
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('alumnes')
    .insert([{ nom, cognoms, email, dni, grup_id, actiu: actiu ?? true }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/alumnes/:id', autenticacio, async (req, res) => {
  const { id } = req.params;
  const { nom, cognoms, email, dni, grup_id, actiu } = req.body;
  
  // Per a tutors, comprovar que l'alumne pertany al seu grup
  if (req.user.rol === 'tutor') {
    const supabase = getSupabaseAdmin();
    const { data: alumne, error: errAl } = await supabase
      .from('alumnes')
      .select('grup_id')
      .eq('id', id)
      .single();
    if (errAl || !alumne || alumne.grup_id !== req.user.grup_id) {
      return res.status(403).json({ error: 'No pots modificar alumnes d\'un altre grup' });
    }
  }
  
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('alumnes')
    .update({ nom, cognoms, email, dni, grup_id, actiu })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/alumnes/:id', autenticacio, async (req, res) => {
  const { id } = req.params;
  // Per a tutors, comprovar que l'alumne pertany al seu grup
  if (req.user.rol === 'tutor') {
    const supabase = getSupabaseAdmin();
    const { data: alumne, error: errAl } = await supabase
      .from('alumnes')
      .select('grup_id')
      .eq('id', id)
      .single();
    if (errAl || !alumne || alumne.grup_id !== req.user.grup_id) {
      return res.status(403).json({ error: 'No pots eliminar alumnes d\'un altre grup' });
    }
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('alumnes')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ==========================================
// RUTES PER A MATERIES (només admin)
// ==========================================

app.get('/materies', autenticacio, adminOnly, async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('materies')
    .select('*')
    .order('nom');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/materies', autenticacio, adminOnly, async (req, res) => {
  const { nom, descripcio } = req.body;
  if (!nom) return res.status(400).json({ error: 'El nom és obligatori' });
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('materies')
    .insert([{ nom, descripcio }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/materies/:id', autenticacio, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { nom, descripcio } = req.body;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('materies')
    .update({ nom, descripcio })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/materies/:id', autenticacio, adminOnly, async (req, res) => {
  const { id } = req.params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('materies')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ==========================================
// RUTES PER A HORARIS (consulta: tots autenticats, modificació: només admin)
// ==========================================

app.get('/horaris', autenticacio, async (req, res) => {
  const supabase = getSupabaseAdmin();
  let query = supabase.from('horaris').select('*, materies(nom), grups(nom)');
  if (req.query.grup_id) {
    query = query.eq('grup_id', req.query.grup_id);
  }
  const { data, error } = await query.order('dia_setmana').order('hora_inici');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/horaris', autenticacio, adminOnly, async (req, res) => {
  const { grup_id, materia_id, dia_setmana, hora_inici, durada_min } = req.body;
  if (!grup_id || !materia_id || !dia_setmana || !hora_inici || !durada_min) {
    return res.status(400).json({ error: 'Falten camps obligatoris' });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('horaris')
    .insert([{ grup_id, materia_id, dia_setmana, hora_inici, durada_min }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/horaris/:id', autenticacio, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { grup_id, materia_id, dia_setmana, hora_inici, durada_min } = req.body;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('horaris')
    .update({ grup_id, materia_id, dia_setmana, hora_inici, durada_min })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/horaris/:id', autenticacio, adminOnly, async (req, res) => {
  const { id } = req.params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('horaris')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ==========================================
// RUTES PER A HORARIS PER DIA (gestió ràpida, només admin)
// ==========================================

app.get('/horaris/grup-dia', autenticacio, async (req, res) => {
  const { grup_id, dia_setmana } = req.query;
  if (!grup_id || !dia_setmana) {
    return res.status(400).json({ error: 'Falten grup_id o dia_setmana' });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('horaris')
    .select('*, materies(nom, id)')
    .eq('grup_id', grup_id)
    .eq('dia_setmana', parseInt(dia_setmana))
    .order('hora_inici');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/horaris/grup-dia', autenticacio, adminOnly, async (req, res) => {
  const { grup_id, dia_setmana, franges } = req.body;
  if (!grup_id || !dia_setmana || !Array.isArray(franges)) {
    return res.status(400).json({ error: 'Dades invàlides' });
  }

  const hores = franges.map(f => f.hora_inici);
  if (new Set(hores).size !== hores.length) {
    return res.status(400).json({ error: 'No pots tenir dues franges a la mateixa hora per al mateix dia.' });
  }

  const supabase = getSupabaseAdmin();
  const { error: deleteError } = await supabase
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

  const { error: insertError } = await supabase
    .from('horaris')
    .insert(novesFranges);

  if (insertError) return res.status(500).json({ error: insertError.message });
  res.json({ ok: true, missatge: `Guardades ${franges.length} franges.` });
});

// ==========================================
// RUTES PER A ASSISTÈNCIA (tots autenticats)
// ==========================================

function getDiaSetmana(data) {
  const date = new Date(data);
  let dia = date.getDay();
  return dia === 0 ? 7 : dia;
}

app.get('/assistencia/config', autenticacio, async (req, res) => {
  const { grup_id, data } = req.query;
  if (!grup_id || !data) {
    return res.status(400).json({ error: 'Falten grup_id o data' });
  }

  const diaSetmana = getDiaSetmana(data);
  const supabase = getSupabaseAdmin();

  const { data: sessions, error: errSessions } = await supabase
    .from('horaris')
    .select(`*, materies(nom)`)
    .eq('grup_id', grup_id)
    .eq('dia_setmana', diaSetmana)
    .order('hora_inici');

  if (errSessions) return res.status(500).json({ error: errSessions.message });

  const { data: alumnes, error: errAlumnes } = await supabase
    .from('alumnes')
    .select('id, nom, cognoms')
    .eq('grup_id', grup_id)
    .eq('actiu', true)
    .order('nom');

  if (errAlumnes) return res.status(500).json({ error: errAlumnes.message });

  const sessionIds = sessions.map(s => s.id);
  let registresExistents = [];
  if (sessionIds.length > 0) {
    const { data: registres, error: errReg } = await supabase
      .from('registres')
      .select('*, minuts_justificats')
      .in('horari_id', sessionIds)
      .eq('data', data);
    if (!errReg) registresExistents = registres;
  }

  res.json({ sessions, alumnes, registresExistents });
});

app.post('/assistencia/guardar', autenticacio, async (req, res) => {
  const { data, registres } = req.body;
  if (!data || !Array.isArray(registres)) {
    return res.status(400).json({ error: 'Falten dades o format incorrecte' });
  }

  const supabase = getSupabaseAdmin();
  const registresPerUpsert = registres.map(r => ({
    alumne_id: r.alumne_id,
    horari_id: r.horari_id,
    data: data,
    minuts_assistits: r.minuts_assistits || 0,
    minuts_justificats: r.minuts_justificats || 0,
    observacions: r.observacions || null
  }));

  const { error } = await supabase
    .from('registres')
    .upsert(registresPerUpsert, { onConflict: 'alumne_id, horari_id, data' });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ==========================================
// RUTES PER A DIES NO LECTIUS (només admin)
// ==========================================

app.get('/dies_no_lectius', autenticacio, adminOnly, async (req, res) => {
  const { grup_id } = req.query;
  if (!grup_id) {
    return res.status(400).json({ error: 'Falta grup_id' });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('dies_no_lectius')
    .select('*')
    .eq('grup_id', grup_id)
    .order('data', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/dies_no_lectius', autenticacio, adminOnly, async (req, res) => {
  const { grup_id, data, motiu } = req.body;
  if (!grup_id || !data) {
    return res.status(400).json({ error: 'Falten grup_id o data' });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('dies_no_lectius')
    .insert([{ grup_id, data, motiu }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.put('/dies_no_lectius/:id', autenticacio, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { data, motiu } = req.body;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('dies_no_lectius')
    .update({ data, motiu })
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.delete('/dies_no_lectius/:id', autenticacio, adminOnly, async (req, res) => {
  const { id } = req.params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('dies_no_lectius')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.post('/dies_no_lectius/copiar', autenticacio, adminOnly, async (req, res) => {
  const { origen_grup_id, desti_grup_id } = req.body;
  if (!origen_grup_id || !desti_grup_id) {
    return res.status(400).json({ error: 'Falten els IDs dels grups' });
  }
  
  const supabase = getSupabaseAdmin();
  const { data: diesOrigen, error: errGet } = await supabase
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
  
  const { error: errInsert } = await supabase
    .from('dies_no_lectius')
    .insert(diesPerInsertar);
  
  if (errInsert) return res.status(500).json({ error: errInsert.message });
  res.json({ ok: true, missatge: `Copiats ${diesOrigen.length} dies al grup destí` });
});

// ==========================================
// RUTES PER A INFORMES (tots autenticats)
// ==========================================

app.get('/informes/assistencia', autenticacio, async (req, res) => {
  const { grup_id, data_inici, data_fi } = req.query;
  if (!grup_id || !data_inici || !data_fi) {
    return res.status(400).json({ error: 'Falten paràmetres: grup_id, data_inici, data_fi' });
  }

  const supabase = getSupabaseAdmin();

  try {
    const { data: horaris, error: errHoraris } = await supabase
      .from('horaris')
      .select('id, dia_setmana, hora_inici, durada_min, materia_id, materies(nom)')
      .eq('grup_id', grup_id);
    
    if (errHoraris) throw new Error(errHoraris.message);

    const { data: diesNoLectius, error: errDies } = await supabase
      .from('dies_no_lectius')
      .select('data')
      .eq('grup_id', grup_id)
      .gte('data', data_inici)
      .lte('data', data_fi);
    
    if (errDies) throw new Error(errDies.message);
    
    const diesNoLectiusSet = new Set(diesNoLectius.map(d => d.data));

    const { data: alumnes, error: errAlumnes } = await supabase
      .from('alumnes')
      .select('id, nom, cognoms, actiu')
      .eq('grup_id', grup_id)
      .order('nom');
    
    if (errAlumnes) throw new Error(errAlumnes.message);

    const alumnesIds = alumnes.map(a => a.id);
    const { data: registres, error: errRegistres } = await supabase
      .from('registres')
      .select('alumne_id, horari_id, minuts_assistits, minuts_justificats, data')
      .in('alumne_id', alumnesIds)
      .gte('data', data_inici)
      .lte('data', data_fi);
    
    if (errRegistres) throw new Error(errRegistres.message);

    const registresPerAlumne = {};
    registres.forEach(r => {
      if (!registresPerAlumne[r.alumne_id]) {
        registresPerAlumne[r.alumne_id] = [];
      }
      registresPerAlumne[r.alumne_id].push(r);
    });

    const dataIniciDate = new Date(data_inici);
    const dataFiDate = new Date(data_fi);
    let minutsTeoricsPerAlumne = 0;
    
    for (let d = new Date(dataIniciDate); d <= dataFiDate; d.setDate(d.getDate() + 1)) {
      const dataStr = d.toISOString().split('T')[0];
      if (diesNoLectiusSet.has(dataStr)) continue;
      const diaSetmana = d.getDay() === 0 ? 7 : d.getDay();
      horaris.forEach(h => {
        if (h.dia_setmana === diaSetmana) {
          minutsTeoricsPerAlumne += h.durada_min;
        }
      });
    }

    function formatHoresMinuts(minuts) {
      const hores = Math.floor(minuts / 60);
      const minutsRestants = minuts % 60;
      if (hores === 0) return `${minutsRestants} min`;
      if (minutsRestants === 0) return `${hores} h`;
      return `${hores} h ${minutsRestants} min`;
    }

    const resultat = alumnes.map(alumne => {
      let minutsAssistits = 0;
      let minutsJustificats = 0;
      const registresAlumne = registresPerAlumne[alumne.id] || [];
      registresAlumne.forEach(r => {
        const dataRegistre = r.data;
        if (!diesNoLectiusSet.has(dataRegistre)) {
          minutsAssistits += r.minuts_assistits || 0;
          minutsJustificats += r.minuts_justificats || 0;
        }
      });
      const percentAssistit = minutsTeoricsPerAlumne > 0 ? (minutsAssistits / minutsTeoricsPerAlumne) * 100 : 0;
      const percentAssistitJustificat = minutsTeoricsPerAlumne > 0 ? ((minutsAssistits + minutsJustificats) / minutsTeoricsPerAlumne) * 100 : 0;
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

app.get('/informes/assistencia_materia', autenticacio, async (req, res) => {
  const { grup_id, materia_id, data_inici, data_fi } = req.query;
  if (!grup_id || !materia_id || !data_inici || !data_fi) {
    return res.status(400).json({ error: 'Falten paràmetres' });
  }

  const supabase = getSupabaseAdmin();

  try {
    const { data: sessionsMateria, error: errSessions } = await supabase
      .from('horaris')
      .select('id, dia_setmana, durada_min')
      .eq('grup_id', grup_id)
      .eq('materia_id', materia_id);
    if (errSessions) throw new Error(errSessions.message);
    const sessionIds = sessionsMateria.map(s => s.id);

    const { data: diesNoLectius, error: errDies } = await supabase
      .from('dies_no_lectius')
      .select('data')
      .eq('grup_id', grup_id)
      .gte('data', data_inici)
      .lte('data', data_fi);
    if (errDies) throw new Error(errDies.message);
    const diesNoLectiusSet = new Set(diesNoLectius.map(d => d.data));

    const dataIniciDate = new Date(data_inici);
    const dataFiDate = new Date(data_fi);
    let minutsTeorics = 0;
    for (let d = new Date(dataIniciDate); d <= dataFiDate; d.setDate(d.getDate() + 1)) {
      const dataStr = d.toISOString().split('T')[0];
      if (diesNoLectiusSet.has(dataStr)) continue;
      const diaSetmana = d.getDay() === 0 ? 7 : d.getDay();
      sessionsMateria.forEach(s => {
        if (s.dia_setmana === diaSetmana) minutsTeorics += s.durada_min;
      });
    }

    const { data: alumnes, error: errAlumnes } = await supabase
      .from('alumnes')
      .select('id, nom, cognoms, actiu')
      .eq('grup_id', grup_id)
      .order('nom');
    if (errAlumnes) throw new Error(errAlumnes.message);

    const alumnesIds = alumnes.map(a => a.id);
    const { data: registres, error: errRegistres } = await supabase
      .from('registres')
      .select('alumne_id, horari_id, minuts_assistits, minuts_justificats, data')
      .in('alumne_id', alumnesIds)
      .in('horari_id', sessionIds)
      .gte('data', data_inici)
      .lte('data', data_fi);
    if (errRegistres) throw new Error(errRegistres.message);

    function formatHores(minuts) {
      const h = Math.floor(minuts / 60);
      const m = minuts % 60;
      if (h === 0) return `${m} min`;
      if (m === 0) return `${h} h`;
      return `${h} h ${m} min`;
    }

    const resultat = alumnes.map(alumne => {
      const registresAlumne = registres.filter(r => r.alumne_id === alumne.id);
      let minutsAssistits = 0, minutsJustificats = 0;
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

app.get('/informes/assistencia_grup', autenticacio, async (req, res) => {
  const { grup_id, data_inici, data_fi } = req.query;
  if (!data_inici || !data_fi) {
    return res.status(400).json({ error: 'Falten les dates' });
  }

  const supabase = getSupabaseAdmin();

  try {
    let queryGrups = supabase.from('grups').select('id, nom');
    if (grup_id) queryGrups = queryGrups.eq('id', grup_id);
    const { data: grups, error: errGrups } = await queryGrups;
    if (errGrups) throw new Error(errGrups.message);

    const resultat = [];

    for (const grup of grups) {
      const { data: horaris, error: errHor } = await supabase
        .from('horaris')
        .select('dia_setmana, durada_min')
        .eq('grup_id', grup.id);
      if (errHor) throw new Error(errHor.message);

      const { data: diesNoLectius, error: errDies } = await supabase
        .from('dies_no_lectius')
        .select('data')
        .eq('grup_id', grup.id)
        .gte('data', data_inici)
        .lte('data', data_fi);
      if (errDies) throw new Error(errDies.message);
      const diesNoLectiusSet = new Set(diesNoLectius.map(d => d.data));

      const dataIniciDate = new Date(data_inici);
      const dataFiDate = new Date(data_fi);
      let minutsTeorics = 0;
      for (let d = new Date(dataIniciDate); d <= dataFiDate; d.setDate(d.getDate() + 1)) {
        const dataStr = d.toISOString().split('T')[0];
        if (diesNoLectiusSet.has(dataStr)) continue;
        const diaSetmana = d.getDay() === 0 ? 7 : d.getDay();
        horaris.forEach(h => {
          if (h.dia_setmana === diaSetmana) minutsTeorics += h.durada_min;
        });
      }

      const { data: alumnes, error: errAl } = await supabase
        .from('alumnes')
        .select('id')
        .eq('grup_id', grup.id);
      if (errAl) throw new Error(errAl.message);
      const alumnesIds = alumnes.map(a => a.id);
      let minutsAssistitsGrup = 0, minutsJustificatsGrup = 0;
      if (alumnesIds.length > 0) {
        const { data: registres, error: errReg } = await supabase
          .from('registres')
          .select('minuts_assistits, minuts_justificats, data')
          .in('alumne_id', alumnesIds)
          .gte('data', data_inici)
          .lte('data', data_fi);
        if (errReg) throw new Error(errReg.message);
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

    res.json({ data_inici, data_fi, grups: resultat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/informes/alertes', autenticacio, async (req, res) => {
  const { grup_id, data_inici, data_fi, llindar_personalitzat } = req.query;
  if (!data_inici || !data_fi) {
    return res.status(400).json({ error: 'Falten les dates' });
  }

  const supabase = getSupabaseAdmin();

  try {
    let queryGrups = supabase.from('grups').select('id, nom, llindar_assistencia');
    if (grup_id) queryGrups = queryGrups.eq('id', grup_id);
    const { data: grups, error: errGrups } = await queryGrups;
    if (errGrups) throw new Error(errGrups.message);

    const alertes = [];

    for (const grup of grups) {
      const { data: horaris, error: errHor } = await supabase
        .from('horaris')
        .select('dia_setmana, durada_min')
        .eq('grup_id', grup.id);
      if (errHor) throw new Error(errHor.message);

      const { data: diesNoLectius, error: errDies } = await supabase
        .from('dies_no_lectius')
        .select('data')
        .eq('grup_id', grup.id)
        .gte('data', data_inici)
        .lte('data', data_fi);
      if (errDies) throw new Error(errDies.message);
      const diesNoLectiusSet = new Set(diesNoLectius.map(d => d.data));

      const dataIniciDate = new Date(data_inici);
      const dataFiDate = new Date(data_fi);
      let minutsTeorics = 0;
      for (let d = new Date(dataIniciDate); d <= dataFiDate; d.setDate(d.getDate() + 1)) {
        const dataStr = d.toISOString().split('T')[0];
        if (diesNoLectiusSet.has(dataStr)) continue;
        const diaSetmana = d.getDay() === 0 ? 7 : d.getDay();
        horaris.forEach(h => {
          if (h.dia_setmana === diaSetmana) minutsTeorics += h.durada_min;
        });
      }
      if (minutsTeorics === 0) continue;

      const { data: alumnes, error: errAl } = await supabase
        .from('alumnes')
        .select('id, nom, cognoms')
        .eq('grup_id', grup.id)
        .eq('actiu', true);
      if (errAl) throw new Error(errAl.message);
      if (alumnes.length === 0) continue;

      const alumnesIds = alumnes.map(a => a.id);
      const { data: registres, error: errReg } = await supabase
        .from('registres')
        .select('alumne_id, minuts_assistits, minuts_justificats, data')
        .in('alumne_id', alumnesIds)
        .gte('data', data_inici)
        .lte('data', data_fi);
      if (errReg) throw new Error(errReg.message);

      const registresPerAlumne = {};
      registres.forEach(r => {
        if (!registresPerAlumne[r.alumne_id]) registresPerAlumne[r.alumne_id] = [];
        registresPerAlumne[r.alumne_id].push(r);
      });

      function formatHores(minuts) {
        const h = Math.floor(minuts / 60);
        const m = minuts % 60;
        if (h === 0) return `${m} min`;
        if (m === 0) return `${h} h`;
        return `${h} h ${m} min`;
      }

      for (const alumne of alumnes) {
        const registresAlumne = registresPerAlumne[alumne.id] || [];
        let minutsAssistits = 0, minutsJustificats = 0;
        registresAlumne.forEach(r => {
          if (!diesNoLectiusSet.has(r.data)) {
            minutsAssistits += r.minuts_assistits || 0;
            minutsJustificats += r.minuts_justificats || 0;
          }
        });
        const percentAssistit = (minutsAssistits / minutsTeorics) * 100;
        const llindar = llindar_personalitzat ? parseFloat(llindar_personalitzat) : grup.llindar_assistencia;
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
            llindar_personalitzat_utilitzat: !!llindar_personalitzat
          });
        }
      }
    }

    alertes.sort((a, b) => a.percent_assistit - b.percent_assistit);
    res.json({ data_inici, data_fi, total_alertes: alertes.length, alertes });
  } catch (error) {
    console.error('Error generant alertes:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// INICI DEL SERVIDOR
// ==========================================

//app.listen(3000, '0.0.0.0', () => console.log('Backend corrent a http://0.0.0.0:3000'))
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend corrent a http://0.0.0.0:${PORT}`))
