#!/usr/bin/env python3
"""
Script de verificación post-migración
Compara las citas del webhook antiguo con las de la API nueva
"""

import requests
from collections import defaultdict
from datetime import datetime

class Colors:
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_success(text):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def obtener_citas_antiguas():
    """Obtiene citas del webhook antiguo"""
    try:
        response = requests.get('https://webhook.arvera.es/webhook/citas', timeout=10)
        response.raise_for_status()
        data = response.json()
        return data if isinstance(data, list) else [data]
    except Exception as e:
        print_error(f"Error obteniendo citas antiguas: {e}")
        return []

def obtener_citas_nuevas():
    """Obtiene citas de la nueva API"""
    try:
        response = requests.get('https://api-citas-seven.vercel.app/api/citas', timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print_error(f"Error obteniendo citas nuevas: {e}")
        return []

def normalizar_telefono(tel):
    """Normaliza un teléfono para comparación"""
    return ''.join(filter(str.isdigit, str(tel)))

def comparar_citas(antiguas, nuevas):
    """Compara las citas antiguas con las nuevas"""
    
    # Crear índice de citas nuevas por teléfono y fecha
    indice_nuevas = defaultdict(list)
    for cita in nuevas:
        telefono = normalizar_telefono(cita.get('Telefono', ''))
        fecha = cita.get('startTime', '')[:10]  # Solo fecha
        clave = f"{telefono}_{fecha}"
        indice_nuevas[clave].append(cita)
    
    encontradas = 0
    no_encontradas = []
    
    for cita_antigua in antiguas:
        telefono = normalizar_telefono(cita_antigua.get('phone', ''))
        fecha = cita_antigua.get('start', '')[:10]
        clave = f"{telefono}_{fecha}"
        
        if clave in indice_nuevas and len(indice_nuevas[clave]) > 0:
            encontradas += 1
        else:
            no_encontradas.append({
                'nombre': cita_antigua.get('name', 'N/A'),
                'telefono': cita_antigua.get('phone', 'N/A'),
                'fecha': fecha,
                'servicio': cita_antigua.get('service', 'N/A')
            })
    
    return encontradas, no_encontradas

def main():
    print()
    print("=" * 60)
    print(f"{Colors.BOLD}VERIFICACIÓN POST-MIGRACIÓN{Colors.ENDC}".center(60))
    print("=" * 60)
    print()
    
    # Obtener citas
    print("Obteniendo citas del webhook antiguo...")
    citas_antiguas = obtener_citas_antiguas()
    print(f"  → {len(citas_antiguas)} citas encontradas")
    
    print("\nObteniendo citas de la API nueva...")
    citas_nuevas = obtener_citas_nuevas()
    print(f"  → {len(citas_nuevas)} citas encontradas")
    
    if not citas_antiguas:
        print_warning("\nNo hay citas antiguas para comparar")
        return
    
    # Comparar
    print("\nComparando citas...")
    encontradas, no_encontradas = comparar_citas(citas_antiguas, citas_nuevas)
    
    # Resultados
    print("\n" + "=" * 60)
    print(f"{Colors.BOLD}RESULTADOS{Colors.ENDC}".center(60))
    print("=" * 60)
    print()
    
    print(f"{Colors.BOLD}Total citas antiguas:{Colors.ENDC} {len(citas_antiguas)}")
    print(f"{Colors.BOLD}Total citas nuevas:{Colors.ENDC} {len(citas_nuevas)}")
    print()
    
    porcentaje = (encontradas / len(citas_antiguas) * 100) if citas_antiguas else 0
    
    if encontradas == len(citas_antiguas):
        print_success(f"¡Todas las citas fueron migradas! ({encontradas}/{len(citas_antiguas)})")
    else:
        print_warning(f"Citas migradas: {encontradas}/{len(citas_antiguas)} ({porcentaje:.1f}%)")
    
    if no_encontradas:
        print()
        print_warning(f"Citas no encontradas en la nueva API: {len(no_encontradas)}")
        print()
        print("Detalles de citas faltantes:")
        for i, cita in enumerate(no_encontradas[:10], 1):
            print(f"\n{i}. {cita['nombre']}")
            print(f"   Teléfono: {cita['telefono']}")
            print(f"   Fecha: {cita['fecha']}")
            print(f"   Servicio: {cita['servicio']}")
        
        if len(no_encontradas) > 10:
            print(f"\n... y {len(no_encontradas) - 10} más")
    
    # Estadísticas adicionales
    print("\n" + "=" * 60)
    print(f"{Colors.BOLD}ESTADÍSTICAS{Colors.ENDC}".center(60))
    print("=" * 60)
    print()
    
    # Servicios en citas nuevas
    servicios = defaultdict(int)
    for cita in citas_nuevas:
        servicio = cita.get('Servicio', 'Sin servicio')
        servicios[servicio] += 1
    
    print("Distribución de servicios en la nueva API:")
    for servicio, count in sorted(servicios.items(), key=lambda x: x[1], reverse=True):
        print(f"  • {servicio}: {count} citas")
    
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nVerificación interrumpida por el usuario")
    except Exception as e:
        print_error(f"\nError fatal: {e}")
        import traceback
        traceback.print_exc()
