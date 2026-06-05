const { supabase } = require('../config/supabase');

async function testConnection() {
  console.log('🔌 Connectant a Supabase...');
  
  const { count, error } = await supabase
    .from('professors')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Error de connexió o permisos:', error.message);
    console.log('ℹ️ Intentant accedir a la taula grups...');
    const { data, error: err2 } = await supabase
      .from('grups')
      .select('id')
      .limit(1);
    if (err2) {
      console.error('❌ No s\'ha pogut accedir a grups:', err2.message);
    } else {
      console.log('✅ Connexió OK, taula grups accessible. Resultat:', data);
    }
  } else {
    console.log(`✅ Connexió exitosa! Hi ha ${count} professor(s) a la base de dades.`);
  }
}

testConnection();
