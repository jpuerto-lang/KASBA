const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const supabaseUrl = 'https://aaurzyqkucdbedqfrtu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdXJ6enlxa2N1ZGJlZHFmcnR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDI4Njk2MSwiZXhwIjoyMDk1ODYyOTYxfQ._Vn1cZOtfyhHfVlI8Ja1HPvN2l4MBIs4LVsdGPoahYo';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: { transport: WebSocket }
});

async function crearProfessor(email, nom, rol = 'professor') {
  try {
    console.log(`📝 Creant professor: ${nom} (${email})...`);
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true,
      password: 'Canviar123!',
      user_metadata: { nom, rol }
    });

    if (authError) {
      console.error('❌ Error creant usuari a auth:', authError);
      return;
    }

    console.log('✅ Usuari creat amb ID:', authUser.user.id);

    const { data: professor, error: dbError } = await supabaseAdmin
      .from('professors')
      .insert([{ id: authUser.user.id, email, nom, rol }])
      .select();

    if (dbError) {
      console.error('❌ Error inserint a professors:', dbError);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return;
    }

    console.log('✅ Professor creat correctament!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password temporal: Canviar123!`);
    console.log(`👤 Rol: ${rol}`);
  } catch (error) {
    console.error('❌ Error inesperat:', error);
  }
}

const email = process.argv[2];
const nom = process.argv[3];
const rol = process.argv[4] || 'professor';

if (!email || !nom) {
  console.log('Ús: node src/scripts/crearProfessor.js <email> <nom> [rol]');
  process.exit(1);
}

crearProfessor(email, nom, rol);
