# 📦 Guía de Migración de Citas

Este documento explica cómo migrar todas las citas desde el webhook antiguo de Cal.com a la nueva API REST.

## 🎯 Objetivo

Transferir todas las citas almacenadas en:
- **Origen**: `https://webhook.arvera.es/webhook/citas` (Cal.com)
- **Destino**: `https://api-citas-seven.vercel.app/api/citas` (Nueva API)

## 📋 Requisitos

- Python 3.7 o superior
- Biblioteca `requests`

## 🚀 Instalación

### Opción 1: Usando pip

```powershell
pip install requests
```

### Opción 2: Usando el requirements incluido

```powershell
pip install -r requirements_migration.txt
```

## �️ Scripts Incluidos

Este paquete incluye 3 scripts para facilitar la migración:

### 1. `test_conexion.py`
Verifica la conectividad con ambos sistemas antes de migrar.

**Uso:**
```powershell
python test_conexion.py
```

**Características:**
- Prueba conexión al webhook antiguo
- Prueba conexión a la API nueva
- Opción de crear cita de prueba

### 2. `migrate_citas.py`
Script principal de migración.

**Uso:**
```powershell
python migrate_citas.py
```

**Características:**
- Descarga todas las citas del webhook antiguo
- Muestra preview antes de migrar
- Pide confirmación
- Migra cita por cita con feedback
- Muestra resumen final

### 3. `verificar_migracion.py`
Verifica que la migración fue exitosa.

**Uso:**
```powershell
python verificar_migracion.py
```

**Características:**
- Compara citas antiguas vs nuevas
- Identifica citas faltantes
- Muestra estadísticas
- Calcula porcentaje de éxito

## �📝 Uso del Script

### Paso 0: Verificar conectividad (Recomendado)

Antes de migrar, verifica que puedes conectarte a ambos sistemas:

```powershell
python test_conexion.py
```

Este script:
- ✅ Verifica conexión al webhook antiguo
- ✅ Verifica conexión a la API nueva
- ✅ Opcionalmente crea una cita de prueba

### 1. Ejecutar el script de migración

```powershell
python migrate_citas.py
```

### 2. El script hará lo siguiente:

1. **Conectará** al webhook antiguo y descargará todas las citas
2. **Mostrará** un preview de las primeras 5 citas a migrar
3. **Pedirá confirmación** antes de proceder
4. **Migrará** cada cita a la nueva API
5. **Mostrará** un resumen final con estadísticas

### 3. Ejemplo de salida

```
============================================================
         MIGRACIÓN DE CITAS - Cal.com → API REST
============================================================

ℹ Paso 1: Obteniendo citas del webhook antiguo...
✓ Se obtuvieron 15 citas del webhook antiguo

ℹ Paso 2: Preview de citas (15 total)
ℹ Preview de las primeras 5 citas a migrar:

1. Juan Pérez
   Teléfono: 600123456
   Servicio: Revisión
   Fecha/Hora: 2026-01-15 10:00
   Modelo: Toyota Corolla (1234ABC)

...

⚠ ¿Deseas migrar 15 citas a la nueva API?
Escribe 'SI' para continuar: SI

============================================================
                  INICIANDO MIGRACIÓN
============================================================

✓ [1/15] Migrada: Juan Pérez - 2026-01-15 10:00
✓ [2/15] Migrada: María García - 2026-01-16 11:30
...
✓ [15/15] Migrada: Pedro López - 2026-01-28 09:00

============================================================
                  RESUMEN DE MIGRACIÓN
============================================================

Total de citas: 15
✓ Migradas exitosamente: 15
ℹ Tiempo total: 5.43 segundos

✓ ¡MIGRACIÓN COMPLETADA CON ÉXITO!
```

## 🔍 Mapeo de Campos

El script transforma automáticamente los campos del formato antiguo al nuevo:

| Campo Antiguo (Cal.com) | Campo Nuevo (API) |
|------------------------|-------------------|
| `name`                 | `Nombre`          |
| `phone`                | `Telefono`        |
| `email`                | `Email`           |
| `service`              | `Servicio`        |
| `start`                | `startTime`       |
| `end`                  | `endTime`         |
| `matricula`            | `Matricula`       |
| `modelo`               | `Modelo`          |
| `notes`                | `Notas`           |

### ⏰ Importante sobre las Horas

Las fechas y horas se migran **completas** en formato ISO 8601:
- **Formato origen**: `"2026-01-15T10:00:00+00:00"` (Cal.com)
- **Formato destino**: `"2026-01-15T10:00:00Z"` (API nueva)

✅ Las horas **SÍ se migran correctamente** - cada cita mantiene su hora exacta
✅ Las zonas horarias se preservan (UTC/+00:00)

## ⚠️ Validaciones

El script valida que cada cita tenga:
- ✅ Nombre (obligatorio)
- ✅ Teléfono (obligatorio)
- ✅ Servicio (obligatorio)
- ✅ Fecha de inicio (obligatorio)
- ✅ Fecha de fin (obligatorio)

Las citas que no cumplan estas validaciones se saltarán con un aviso.

## 🛡️ Seguridad

- El script **NO elimina** las citas del webhook antiguo
- Cada cita se crea como nueva en la API (con nuevo ID)
- Puedes ejecutar el script múltiples veces (creará duplicados)
- Se recomienda hacer una prueba primero con pocas citas

## 🔧 Personalización

Para modificar el comportamiento del script, edita las constantes al inicio de `migrate_citas.py`:

```python
# URLs
WEBHOOK_ANTIGUO = 'https://webhook.arvera.es/webhook/citas'
API_NUEVA = 'https://api-citas-seven.vercel.app/api/citas'

# Tiempo de espera entre peticiones (segundos)
time.sleep(0.2)  # Línea 179
```

## 🐛 Solución de Problemas

### Error: "No module named 'requests'"
```powershell
pip install requests
```

### Error de conexión al webhook antiguo
- Verifica que la URL sea correcta
- Comprueba tu conexión a Internet
- El webhook puede estar temporalmente inactivo

### Error 400/500 al migrar
- Verifica que la API nueva esté funcionando
- Revisa los logs para ver qué campo falta o está mal formateado

### Citas duplicadas
Si ejecutaste el script varias veces, puedes eliminar duplicados usando el panel de administración de la API o directamente en Supabase.

## 📊 Verificación Post-Migración

Después de la migración, verifica que todo esté correcto:

### Opción 1: Script de verificación automática

```powershell
python verificar_migracion.py
```

Este script compara las citas del webhook antiguo con las de la nueva API y te muestra:
- Total de citas migradas
- Citas que no se encontraron (si hay)
- Estadísticas de servicios
- Porcentaje de éxito

### Opción 2: Verificación manual

1. **Abre la aplicación web** y comprueba que se muestran todas las citas
2. **Revisa fechas** para asegurar que no hay errores de zona horaria
3. **Compara el total** con el número de citas migradas

## 🆘 Rollback

Si algo sale mal y necesitas volver atrás:

1. Las citas originales siguen en el webhook antiguo
2. Elimina las citas de la nueva API usando:
   - El endpoint DELETE `/api/citas/{id}` 
   - O directamente desde Supabase

## 📞 Soporte

Si encuentras problemas durante la migración, revisa:
- Los logs del script (salida en consola)
- Los logs de Vercel (para la API)
- Los logs de Supabase (para la base de datos)
