""" 
Endpoint para exponer variables de entorno del servidor al cliente
"""
import os
import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Devuelve las variables de entorno públicas para el cliente"""
        
        # Parse HORARIOS from env (formato: "08:30-12:15,15:45-18:00")
        horarios_str = os.getenv('HORARIOS', '08:30-12:15,15:45-18:00')
        horarios = [rango.split('-') for rango in horarios_str.split(',')]
        
        # Parse DIAS_LABORABLES from env (formato: "1,2,3,4,5")
        dias_str = os.getenv('DIAS_LABORABLES', '1,2,3,4,5')
        dias_laborables = [int(d) for d in dias_str.split(',')]
        
        # Variables de entorno que se exponen al cliente
        env_vars = {
            # API y servicios externos
            'API_BASE_URL': os.getenv('API_BASE_URL', 'https://api-citas-seven.vercel.app/api'),
            'API_KEY': os.getenv('API_KEY', ''),
            'WEBHOOK_URL': os.getenv('WEBHOOK_URL', 'https://webhook.arvera.es/webhook/cal-event'),
            'CHECK_UPDATE_URL': os.getenv('CHECK_UPDATE_URL', 'https://webhook.arvera.es/webhook/check-update'),
            
            # Supabase
            'SUPABASE_URL': os.getenv('SUPABASE_URL', 'https://pvvxwibhqowjcdxazalx.supabase.co'),
            'SUPABASE_ANON_KEY': os.getenv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dnh3aWJocW93amNkeGF6YWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzNTY4MjIsImV4cCI6MjA1MTkzMjgyMn0.RJLCqGTiNx-bQFa8tXrM1B9j6wqP8wCEA7xGI1vPw4I'),
            
            # Configuraciones de aplicación
            'TIMEZONE': os.getenv('TIMEZONE', 'Europe/Madrid'),
            'HORARIOS': horarios,
            'DURACION_CITA': int(os.getenv('DURACION_CITA', '45')),
            'DIAS_LABORABLES': dias_laborables,
            'POLL_INTERVAL': int(os.getenv('POLL_INTERVAL', '10000'))
        }
        
        # Headers CORS para permitir acceso desde el frontend
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Cache-Control', 'public, max-age=300')  # Cache 5 minutos
        self.end_headers()
        
        # Devolver variables en formato JSON
        self.wfile.write(json.dumps(env_vars).encode())
        return
    
    def do_OPTIONS(self):
        """Manejar preflight CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
