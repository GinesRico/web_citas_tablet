#!/usr/bin/env python3
"""
Script para ver las citas de hoy
"""

import requests
from datetime import datetime, timezone

# Colores para terminal
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(60)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def obtener_citas_hoy():
    """Obtiene las citas de hoy desde la API"""
    try:
        # Fecha de hoy
        hoy = datetime.now(timezone.utc)
        inicio_dia = hoy.replace(hour=0, minute=0, second=0, microsecond=0)
        fin_dia = hoy.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Formatear para la API
        start_date = inicio_dia.isoformat()
        end_date = fin_dia.isoformat()
        
        # Hacer petición
        url = f'https://api-citas-seven.vercel.app/api/citas?startDate={start_date}&endDate={end_date}'
        
        print_info(f"Consultando citas del {hoy.strftime('%d/%m/%Y')}...")
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        citas = response.json()
        return citas, hoy
        
    except Exception as e:
        print_error(f"Error al obtener citas: {e}")
        return [], None

def mostrar_citas(citas, fecha):
    """Muestra las citas en formato legible"""
    if not citas:
        print_info("No hay citas programadas para hoy")
        return
    
    print_success(f"Se encontraron {len(citas)} cita(s) para hoy:\n")
    
    # Ordenar por hora
    citas_ordenadas = sorted(citas, key=lambda x: x.get('startTime', ''))
    
    for i, cita in enumerate(citas_ordenadas, 1):
        # Extraer hora
        start_time = cita.get('startTime', '')
        hora = start_time[11:16] if len(start_time) > 16 else 'N/A'
        
        print(f"{Colors.BOLD}{i}. {hora} - {cita.get('Nombre', 'N/A')}{Colors.ENDC}")
        print(f"   📞 {cita.get('Telefono', 'N/A')}")
        print(f"   🔧 {cita.get('Servicio', 'N/A')}")
        
        if cita.get('Modelo'):
            print(f"   🚗 {cita.get('Modelo')} ({cita.get('Matricula', '')})")
        
        if cita.get('Email'):
            print(f"   ✉️  {cita.get('Email')}")
        
        if cita.get('Notas'):
            print(f"   📝 {cita.get('Notas')}")
        
        print(f"   Estado: {cita.get('Estado', 'N/A')}")
        print()

def main():
    print_header("CITAS DE HOY")
    
    citas, fecha = obtener_citas_hoy()
    
    if fecha:
        mostrar_citas(citas, fecha)
    
    print(f"{Colors.BOLD}{'='*60}{Colors.ENDC}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nConsulta interrumpida")
    except Exception as e:
        print_error(f"Error: {e}")
        import traceback
        traceback.print_exc()
