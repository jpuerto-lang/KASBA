const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Opció per evitar errors de WebSocket a Node.js 20
const customFetch = async (url, options) => {
  return fetch(url, options);
};

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    transport: WebSocket,
  },
});

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: {
    transport: WebSocket,
  },
});

module.exports = { supabase, supabaseAdmin };
