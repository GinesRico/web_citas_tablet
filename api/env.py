""" 
Endpoint para exponer variables de entorno del servidor al cliente
Protegido con autenticación por token
"""
import os
import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Devuelve las variables de entorno públicas para el cliente autenticado"""
        
        # SEGURIDAD: Validar token de autenticación
        auth_token = self.headers.get('X-Config-Token', '')
        expected_token = os.getenv('CONFIG_TOKEN', '')
        
        if not expected_token or auth_token != expected_token:
            self.send_response(403)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Acceso no autorizado'}).encode())
            return
        
        # Validar origen
        origin = self.headers.get('Origin', '')
        allowed_origins = ['https://tablet.arvera.es', 'https://citas.arvera.es', 'http://localhost:3000', 'http://localhost:5173']
        
        if origin and origin not in allowed_origins:
            self.send_response(403)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Origen no permitido'}).encode())
            return
        
        # Parse HORARIOS from env (formato: "08:30-12:15,15:45-18:00")
        horarios_str = os.getenv('HORARIOS', '08:30-12:15,15:45-18:00')
        horarios = [rango.split('-') for rango in horarios_str.split(',')]
        
        # Parse DIAS_LABORABLES from env (formato: "1,2,3,4,5")
        dias_str = os.getenv('DIAS_LABORABLES', '1,2,3,4,5')
        dias_laborables = [int(d) for d in dias_str.split(',')]
        
        # Variables de entorno que se exponen al cliente
        # NOTA: NO exponer API_KEY aquí, debe manejarse solo en backend
        env_vars = {
            # API y servicios externos (sin credenciales)
            'API_BASE_URL': os.getenv('API_BASE_URL', 'https://api-citas-seven.vercel.app/api'),
            'WEBHOOK_URL': os.getenv('WEBHOOK_URL', 'https://webhook.arvera.es/webhook/cal-event'),
            'CHECK_UPDATE_URL': os.getenv('CHECK_UPDATE_URL', 'https://webhook.arvera.es/webhook/check-update'),
            
            # Supabase (ANON_KEY es seguro exponer, está diseñado para frontend)
            'SUPABASE_URL': os.getenv('SUPABASE_URL', 'https://pvvxwibhqowjcdxazalx.supabase.co'),
            'SUPABASE_ANON_KEY': os.getenv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dnh3aWJocW93amNkeGF6YWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzNTY4MjIsImV4cCI6MjA1MTkzMjgyMn0.RJLCqGTiNx-bQFa8tXrM1B9j6wqP8wCEA7xGI1vPw4I'),
            
            # Configuraciones de aplicación
            'TIMEZONE': os.getenv('TIMEZONE', 'Europe/Madrid'),
            'HORARIOS': horarios,
            'DURACION_CITA': int(os.getenv('DURACION_CITA', '45')),
            'DIAS_LABORABLES': dias_laborables,
            'POLL_INTERVAL': int(os.getenv('POLL_INTERVAL', '10000'))
        }
        
        # Headers CORS para permitir acceso solo desde dominios autorizados
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', origin if origin in allowed_origins else 'https://tablet.arvera.es')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Config-Token')
        self.send_header('Cache-Control', 'private, max-age=300')  # Cache 5 minutos, privado
        self.end_headers()
        
        # Devolver variables en formato JSON
        self.wfile.write(json.dumps(env_vars).encode())
        return
    
    def do_OPTIONS(self):
        """Manejar preflight CORS"""
        origin = self.headers.get('Origin', '')
        allowed_origins = ['https://tablet.arvera.es', 'https://citas.arvera.es', 'http://localhost:3000', 'http://localhost:5173']
        
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', origin if origin in allowed_origins else 'https://tablet.arvera.es')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Config-Token')
        self.end_headers()
