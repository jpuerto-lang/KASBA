import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import WebSocket from 'ws'        // ← afegir aquesta importació

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

// Crear el client amb l'opció 'transport' per a WebSocket
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    transport: WebSocket,
  },
})

async function testConnection() {
  // Prova d'autenticació (esperem error de credencials)
  const { error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'wrongpassword'
  })

  if (error && error.message.includes('Invalid login credentials')) {
    console.log('✅ Connexió a Supabase funcionant correctament! (resposta de l\'API rebuda)')
  } else if (error) {
    console.error('❌ Error inesperat:', error.message)
  } else {
    console.log('⚠️ La connexió funciona però l’autenticació ha donat un resultat inesperat')
  }
}

testConnection()
