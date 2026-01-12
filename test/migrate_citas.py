#!/usr/bin/env python3
"""
Script de migración de citas desde Cal.com (webhook antiguo) a la nueva API REST
Autor: Sistema de migración
Fecha: 8 de enero de 2026
"""

import requests
import json
from datetime import datetime
import time
import pytz

# Configuración
WEBHOOK_ANTIGUO = 'https://webhook.arvera.es/webhook/citas'
API_NUEVA = 'https://api-citas-seven.vercel.app/api/citas'
TIMEZONE_MADRID = pytz.timezone('Europe/Madrid')

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

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

def obtener_citas_antiguas():
    """Obtiene todas las citas del webhook antiguo"""
    print_info("Conectando al webhook antiguo...")
    try:
        response = requests.get(WEBHOOK_ANTIGUO, timeout=10)
        response.raise_for_status()
        citas = response.json()
        
        # Asegurar que sea un array
        if not isinstance(citas, list):
            citas = [citas] if citas else []
        
        print_success(f"Se obtuvieron {len(citas)} citas del webhook antiguo")
        return citas
    except requests.exceptions.RequestException as e:
        print_error(f"Error al obtener citas antiguas: {e}")
        return []

def mapear_cita(cita_antigua):
    """
    Mapea una cita del formato antiguo al formato de la nueva API
    
    Formato antiguo (Cal.com):
    {
        "id": 12731666,
        "start": "2025-11-14T10:30:00.000Z",  (UTC)
        "end": "2025-11-14T11:15:00.000Z",    (UTC)
        "date": "2025-11-14",
        "time": "11:30",                      (hora local Madrid)
        "name": "Same",
        "phone": "+34631253869",
        "service": "Alineación",
        "timeZone": "Europe/Madrid"
    }
    
    Formato nuevo (API REST):
    {
        "Nombre": "Same",
        "Telefono": "+34631253869",
        "Email": "",
        "Servicio": "Alineación",
        "startTime": "2025-11-14T10:30:00.000Z",  (se mantiene UTC)
        "endTime": "2025-11-14T11:15:00.000Z",    (se mantiene UTC)
        "Matricula": "",
        "Modelo": "",
        "Notas": ""
    }
    
    IMPORTANTE: Las fechas start/end ya vienen en UTC (.000Z), 
    se guardan tal cual en la BD y la UI las convierte a Europe/Madrid
    """
    # Las fechas ya vienen en formato UTC correcto de Cal.com
    start_time = cita_antigua.get("start", "")
    end_time = cita_antigua.get("end", "")
    
    # Si las fechas no tienen el .000Z, lo agregamos
    if start_time and not start_time.endswith('Z'):
        start_time = start_time.replace('+00:00', '.000Z')
    if end_time and not end_time.endswith('Z'):
        end_time = end_time.replace('+00:00', '.000Z')
    
    return {
        "Nombre": cita_antigua.get("name", ""),
        "Telefono": str(cita_antigua.get("phone", "")),
        "Email": cita_antigua.get("email", ""),
        "Servicio": cita_antigua.get("service", ""),
        "startTime": start_time,
        "endTime": end_time,
        "Matricula": cita_antigua.get("matricula", ""),
        "Modelo": cita_antigua.get("modelo", ""),
        "Notas": cita_antigua.get("notes", "")
    }

def migrar_cita(cita_antigua, index, total):
    """Migra una cita individual a la nueva API"""
    try:
        # Mapear datos
        cita_nueva = mapear_cita(cita_antigua)
        
        # Validar campos obligatorios
        if not cita_nueva["Nombre"] or not cita_nueva["Telefono"] or not cita_nueva["Servicio"]:
            print_warning(f"[{index+1}/{total}] Cita sin datos obligatorios (ID: {cita_antigua.get('id', 'N/A')})")
            return False
        
        if not cita_nueva["startTime"] or not cita_nueva["endTime"]:
            print_warning(f"[{index+1}/{total}] Cita sin fechas válidas (ID: {cita_antigua.get('id', 'N/A')})")
            return False
        
        # Enviar a la nueva API
        response = requests.post(
            API_NUEVA,
            json=cita_nueva,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 201:
            # Mostrar fecha y hora
            fecha_hora = cita_nueva["startTime"][:16].replace('T', ' ')
            print_success(f"[{index+1}/{total}] Migrada: {cita_nueva['Nombre']} - {fecha_hora}")
            return True
        else:
            print_error(f"[{index+1}/{total}] Error HTTP {response.status_code}: {cita_nueva['Nombre']}")
            try:
                error_detail = response.json()
                print_error(f"          Detalle: {error_detail}")
            except:
                print_error(f"          Detalle: {response.text[:100]}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"[{index+1}/{total}] Error de red: {e}")
        return False
    except Exception as e:
        print_error(f"[{index+1}/{total}] Error inesperado: {e}")
        return False

def mostrar_preview(citas):
    """Muestra un preview de las citas a migrar"""
    if not citas:
        print_warning("No hay citas para mostrar")
        return
    
    print_info("Preview de las primeras 5 citas a migrar:")
    print()
    
    for i, cita in enumerate(citas[:5], 1):
        cita_mapeada = mapear_cita(cita)
        # Formatear fecha y hora - convertir de UTC a Europe/Madrid para mostrar
        fecha_hora_str = 'N/A'
        if cita_mapeada['startTime']:
            try:
                # Parsear UTC y convertir a Madrid
                fecha_utc = datetime.fromisoformat(cita_mapeada['startTime'].replace('Z', '+00:00'))
                fecha_madrid = fecha_utc.astimezone(TIMEZONE_MADRID)
                fecha_hora_str = fecha_madrid.strftime('%Y-%m-%d %H:%M') + ' (Madrid)'
            except:
                fecha_hora_str = cita_mapeada['startTime'][:16].replace('T', ' ')
        
        print(f"{Colors.BOLD}{i}. {cita_mapeada['Nombre']}{Colors.ENDC}")
        print(f"   Teléfono: {cita_mapeada['Telefono']}")
        print(f"   Servicio: {cita_mapeada['Servicio']}")
        print(f"   Fecha/Hora: {fecha_hora_str}")
        print(f"   UTC guardado: {cita_mapeada['startTime']}")
        if cita_mapeada['Modelo']:
            print(f"   Modelo: {cita_mapeada['Modelo']} ({cita_mapeada['Matricula']})")
        print()
    
    if len(citas) > 5:
        print(f"... y {len(citas) - 5} citas más\n")

def main():
    print_header("MIGRACIÓN DE CITAS - Cal.com → API REST")
    
    # Paso 1: Obtener citas antiguas
    print_info("Paso 1: Obteniendo citas del webhook antiguo...")
    citas_antiguas = obtener_citas_antiguas()
    
    if not citas_antiguas:
        print_error("No se encontraron citas para migrar")
        return
    
    # Paso 2: Mostrar preview
    print_info(f"\nPaso 2: Preview de citas ({len(citas_antiguas)} total)")
    mostrar_preview(citas_antiguas)
    
    # Paso 3: Confirmar migración
    print_warning(f"\n¿Deseas migrar {len(citas_antiguas)} citas a la nueva API?")
    respuesta = input(f"{Colors.BOLD}Escribe 'SI' para continuar: {Colors.ENDC}").strip().upper()
    
    if respuesta != 'SI':
        print_warning("Migración cancelada por el usuario")
        return
    
    # Paso 4: Migrar citas
    print_header("INICIANDO MIGRACIÓN")
    
    exitosas = 0
    fallidas = 0
    inicio = time.time()
    
    for index, cita in enumerate(citas_antiguas):
        if migrar_cita(cita, index, len(citas_antiguas)):
            exitosas += 1
        else:
            fallidas += 1
        
        # Pequeña pausa para no saturar la API
        time.sleep(0.2)
    
    # Paso 5: Resumen
    duracion = time.time() - inicio
    print_header("RESUMEN DE MIGRACIÓN")
    
    print(f"{Colors.BOLD}Total de citas:{Colors.ENDC} {len(citas_antiguas)}")
    print_success(f"Migradas exitosamente: {exitosas}")
    if fallidas > 0:
        print_error(f"Fallidas: {fallidas}")
    print_info(f"Tiempo total: {duracion:.2f} segundos")
    
    if exitosas == len(citas_antiguas):
        print()
        print_success("✓ ¡MIGRACIÓN COMPLETADA CON ÉXITO!")
    elif exitosas > 0:
        print()
        print_warning("⚠ Migración completada con algunos errores")
    else:
        print()
        print_error("✗ La migración falló completamente")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
        print_warning("\nMigración interrumpida por el usuario")
    except Exception as e:
        print()
        print_error(f"Error fatal: {e}")
        import traceback
        traceback.print_exc()
