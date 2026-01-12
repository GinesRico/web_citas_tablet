"""
Proxy serverless para llamadas API
Maneja API_KEY de forma segura en el servidor
"""
import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import HTTPError

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Proxy GET requests"""
        self._proxy_request('GET')
    
    def do_POST(self):
        """Proxy POST requests"""
        self._proxy_request('POST')
    
    def do_PUT(self):
        """Proxy PUT requests"""
        self._proxy_request('PUT')
    
    def do_DELETE(self):
        """Proxy DELETE requests"""
        self._proxy_request('DELETE')
    
    def _proxy_request(self, method):
        """Proxy la petición añadiendo API_KEY de forma segura"""
        try:
            # Obtener API_KEY del servidor (nunca expuesta al cliente)
            api_key = os.getenv('API_KEY', '')
            api_base_url = os.getenv('API_BASE_URL', 'https://api-citas-seven.vercel.app/api')
            
            # Construir URL destino
            path = self.path.replace('/api/proxy', '')
            target_url = f"{api_base_url}{path}"
            
            # Leer body si existe
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else None
            
            # Crear request con headers seguros
            headers = {
                'Content-Type': 'application/json',
                'X-API-Key': api_key
            }
            
            req = Request(target_url, data=body, headers=headers, method=method)
            
            # Ejecutar petición
            with urlopen(req) as response:
                response_data = response.read()
                
                # Enviar respuesta al cliente
                origin = self.headers.get('Origin', '')
                allowed_origins = ['https://tablet.arvera.es', 'https://citas.arvera.es', 'http://localhost:3000', 'http://localhost:5173']
                
                self.send_response(response.status)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', origin if origin in allowed_origins else 'https://tablet.arvera.es')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                self.end_headers()
                self.wfile.write(response_data)
                
        except HTTPError as e:
            # Propagar errores HTTP
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_msg = e.read()
            self.wfile.write(error_msg)
            
        except Exception as e:
            # Error interno
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def do_OPTIONS(self):
        """Manejar preflight CORS"""
        origin = self.headers.get('Origin', '')
        allowed_origins = ['https://tablet.arvera.es', 'https://citas.arvera.es', 'http://localhost:3000', 'http://localhost:5173']
        
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', origin if origin in allowed_origins else 'https://tablet.arvera.es')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
