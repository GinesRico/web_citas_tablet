#!/usr/bin/env python3
"""
Script de depuración - Verifica qué devuelve la API
"""

import requests
import json
from datetime import datetime, timezone

def test_api():
    print("=" * 60)
    print("DEBUG: Probando endpoint de la API")
    print("=" * 60)
    
    # Test 1: Sin filtros
    print("\n1. GET /api/citas (sin filtros)")
    try:
        response = requests.get('https://api-citas-seven.vercel.app/api/citas', timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Total citas: {len(data)}")
            if data:
                print(f"\n   Primera cita:")
                print(json.dumps(data[0], indent=2, ensure_ascii=False))
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Con filtro de hoy
    print("\n2. GET /api/citas (filtrado por hoy)")
    try:
        hoy = datetime.now(timezone.utc)
        inicio = hoy.replace(hour=0, minute=0, second=0).isoformat()
        fin = hoy.replace(hour=23, minute=59, second=59).isoformat()
        
        url = f'https://api-citas-seven.vercel.app/api/citas?startDate={inicio}&endDate={fin}'
        print(f"   URL: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Citas de hoy: {len(data)}")
            for cita in data:
                print(f"   - {cita.get('Nombre')} a las {cita.get('startTime', 'N/A')[11:16]}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: Estructura de datos
    print("\n3. Verificar estructura de datos")
    try:
        response = requests.get('https://api-citas-seven.vercel.app/api/citas', timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data:
                cita = data[0]
                print("   Campos presentes en la API:")
                for key in cita.keys():
                    print(f"   - {key}: {type(cita[key]).__name__}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_api()
