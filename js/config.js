/****************************************
 * CONFIGURACIÓN GLOBAL
 * Lee variables de entorno desde el servidor (Vercel)
 * TODAS las configuraciones vienen de variables de entorno
 ****************************************/

// Configuración inicial (se sobrescribirá con valores del servidor)
let CONFIG = {
  // Valores por defecto temporales (solo para desarrollo local sin servidor)
  API_BASE_URL: 'https://api-citas-seven.vercel.app/api',
  API_KEY: '',
  WEBHOOK_URL: 'https://webhook.arvera.es/webhook/cal-event',
  CHECK_UPDATE_URL: 'https://webhook.arvera.es/webhook/check-update',
  SUPABASE_URL: 'https://pvvxwibhqowjcdxazalx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dnh3aWJocW93amNkeGF6YWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzNTY4MjIsImV4cCI6MjA1MTkzMjgyMn0.RJLCqGTiNx-bQFa8tXrM1B9j6wqP8wCEA7xGI1vPw4I',
  TIMEZONE: 'Europe/Madrid',
  HORARIOS: [['08:30', '12:15'], ['15:45', '18:00']],
  DURACION_CITA: 45,
  DIAS_LABORABLES: [1, 2, 3, 4, 5],
  POLL_INTERVAL: 10000
};

// Función para cargar variables de entorno desde el servidor
async function loadEnvFromServer() {
  try {
    // Intentar obtener configuración desde el endpoint de Vercel
    const response = await fetch('/api/env');
    
    if (response.ok) {
      const envVars = await response.json();
      
      // Sobrescribir CONFIG con TODOS los valores del servidor
      CONFIG.API_BASE_URL = envVars.API_BASE_URL || CONFIG.API_BASE_URL;
      CONFIG.API_KEY = envVars.API_KEY || CONFIG.API_KEY;
      CONFIG.WEBHOOK_URL = envVars.WEBHOOK_URL || CONFIG.WEBHOOK_URL;
      CONFIG.CHECK_UPDATE_URL = envVars.CHECK_UPDATE_URL || CONFIG.CHECK_UPDATE_URL;
      CONFIG.SUPABASE_URL = envVars.SUPABASE_URL || CONFIG.SUPABASE_URL;
      CONFIG.SUPABASE_ANON_KEY = envVars.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY;
      
      // Configuraciones de aplicación
      CONFIG.TIMEZONE = envVars.TIMEZONE || CONFIG.TIMEZONE;
      CONFIG.HORARIOS = envVars.HORARIOS || CONFIG.HORARIOS;
      CONFIG.DURACION_CITA = envVars.DURACION_CITA || CONFIG.DURACION_CITA;
      CONFIG.DIAS_LABORABLES = envVars.DIAS_LABORABLES || CONFIG.DIAS_LABORABLES;
      CONFIG.POLL_INTERVAL = envVars.POLL_INTERVAL || CONFIG.POLL_INTERVAL;
      
      return true;
    }
  } catch (error) {
    console.warn('⚠️ No se pudieron cargar variables de entorno del servidor, usando valores por defecto:', error.message);
  }
  return false;
}

// Cargar configuración al inicio
const configPromise = loadEnvFromServer();

// Exportar para usar en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
