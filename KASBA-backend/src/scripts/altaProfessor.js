import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function altaProfessor({ email, nom, rol, password }) {
  // 1. Crear l'usuari a Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError) throw new Error('Error Auth: ' + authError.message)

  const userId = authData.user.id

  // 2. Inserir a la taula professors
  const { error: dbError } = await supabaseAdmin
    .from('professors')
    .insert([{ id: userId, email, nom, rol }])

  if (dbError) {
    // Si falla la BD, esborrem l'usuari d'Auth per no deixar-lo penjat
    await supabaseAdmin.auth.admin.deleteUser(userId)
    throw new Error('Error BD: ' + dbError.message)
  }

  return { id: userId, email, nom, rol }
}
