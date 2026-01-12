#!/usr/bin/env python3
"""
Script de prueba rápida - Verifica conectividad con webhook antiguo y API nueva
"""

import requests
import json

print("=" * 60)
print("PRUEBA DE CONECTIVIDAD")
print("=" * 60)

# Test 1: Webhook antiguo
print("\n1. Probando webhook antiguo...")
try:
    response = requests.get('https://webhook.arvera.es/webhook/citas', timeout=5)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        citas = data if isinstance(data, list) else [data]
        print(f"   ✓ Conectado - {len(citas)} citas encontradas")
        
        if citas:
            print(f"\n   Ejemplo de cita:")
            cita = citas[0]
            print(f"   - Nombre: {cita.get('name', 'N/A')}")
            print(f"   - Fecha: {cita.get('start', 'N/A')}")
            print(f"   - Servicio: {cita.get('service', 'N/A')}")
    else:
        print(f"   ✗ Error: {response.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 2: API nueva
print("\n2. Probando API nueva (GET)...")
try:
    response = requests.get('https://api-citas-seven.vercel.app/api/citas', timeout=5)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        citas = response.json()
        print(f"   ✓ Conectado - {len(citas)} citas existentes")
    else:
        print(f"   ✗ Error: {response.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 3: Prueba de escritura (opcional)
print("\n3. ¿Quieres hacer una prueba de escritura en la API nueva? (s/n): ", end='')
respuesta = input().strip().lower()

if respuesta == 's':
    print("\n   Creando cita de prueba...")
    cita_prueba = {
        "Nombre": "Test Migración",
        "Telefono": "600000000",
        "Email": "test@migracion.com",
        "Servicio": "Prueba",
        "startTime": "2026-12-31T23:00:00Z",
        "endTime": "2026-12-31T23:45:00Z",
        "Matricula": "TEST123",
        "Modelo": "Prueba",
        "Notas": "Cita de prueba - ELIMINAR"
    }
    
    try:
        response = requests.post(
            'https://api-citas-seven.vercel.app/api/citas',
            json=cita_prueba,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 201:
            print("   ✓ Cita de prueba creada correctamente")
            print("   IMPORTANTE: Elimina esta cita de prueba desde la app")
        else:
            print(f"   ✗ Error: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")

print("\n" + "=" * 60)
print("PRUEBA COMPLETADA")
print("=" * 60)
