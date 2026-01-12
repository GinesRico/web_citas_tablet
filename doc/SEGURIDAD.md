# 🔐 Mejoras de Seguridad - Configuración Protegida

## Problema Identificado

El endpoint `/api/env` exponía variables de entorno sensibles (API_KEY, credenciales) sin autenticación, permitiendo acceso público a información confidencial.

## Soluciones Implementadas

### 1. ✅ Autenticación con Token Secreto

**Archivo**: `api/env.py`

El endpoint ahora requiere un token de autenticación en el header:

```python
X-Config-Token: tu_token_secreto
```

Si el token no coincide o no se envía, responde con `403 Forbidden`.

### 2. ✅ Validación de Origen (CORS Estricto)

Solo permite acceso desde:
- `https://tablet.arvera.es` (panel admin)
- `https://citas.arvera.es` (reservas públicas)
- `http://localhost:3000` (desarrollo)
- `http://localhost:5173` (Vite dev)

### 3. ✅ API_KEY NO Expuesta al Frontend

**Antes**: API_KEY se enviaba al cliente en `/api/env`  
**Ahora**: API_KEY solo existe en el servidor

**Nuevo Flujo**:
```
Cliente → /api/proxy/citas → Backend (con API_KEY)
```

El archivo `api/proxy.py` actúa como proxy seguro que añade el API_KEY en el servidor.

### 4. ✅ Cache Privado

```
Cache-Control: private, max-age=300
```

El navegador cachea la configuración pero no la comparte entre usuarios.

---

## Configuración Requerida en Vercel

### Variables de Entorno

```bash
# NUEVA - Token de seguridad
CONFIG_TOKEN=genera-un-uuid-aleatorio-aqui

# Existentes
API_KEY=tu_api_key_secreta
API_BASE_URL=https://api-citas-seven.vercel.app/api
WEBHOOK_URL=https://webhook.arvera.es/webhook/cal-event
CHECK_UPDATE_URL=https://webhook.arvera.es/webhook/check-update
SUPABASE_URL=https://pvvxwibhqowjcdxazalx.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
TIMEZONE=Europe/Madrid
HORARIOS=08:30-12:15,15:45-18:00
DURACION_CITA=45
DIAS_LABORABLES=1,2,3,4,5
POLL_INTERVAL=10000
```

### Generar CONFIG_TOKEN

```bash
# Linux/Mac
uuidgen

# Windows PowerShell
[guid]::NewGuid()

# Online
https://www.uuidgenerator.net/
```

### Actualizar config.js

**IMPORTANTE**: Antes de desplegar, actualiza el token en `js/config.js`:

```javascript
const configToken = 'TU_CONFIG_TOKEN_AQUI'; // Mismo valor que en Vercel
```

**Alternativa más segura** (recomendado):
- Inyectar el token en tiempo de build desde variable de entorno
- O almacenarlo después de autenticación de usuario

---

## Arquitectura de Seguridad

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ GET /api/env
       │ Header: X-Config-Token
       ▼
┌──────────────┐
│   env.py     │  ← Valida token + origen
└──────┬───────┘  ← NO expone API_KEY
       │
       └─→ Configuración segura
       
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ POST /api/proxy/citas
       │ (sin API_KEY)
       ▼
┌──────────────┐
│  proxy.py    │  ← Añade API_KEY del servidor
└──────┬───────┘
       │
       │ POST /api/citas
       │ Header: X-API-Key
       ▼
┌──────────────┐
│   Backend    │
│     API      │
└──────────────┘
```

---

## Migración de Código

### Cambiar llamadas a API

**Antes**:
```javascript
// app.js - Cliente enviaba API_KEY
fetch(`${CONFIG.API_BASE_URL}/citas`, {
  headers: { 'X-API-Key': CONFIG.API_KEY }
})
```

**Después**:
```javascript
// app.js - Usar proxy (API_KEY en servidor)
fetch(`/api/proxy/citas`, {
  headers: { 'Content-Type': 'application/json' }
})
```

**Nota**: Este cambio ya está implementado en el código si usas `this.api.fetch()` o `ApiService`.

---

## Testing

### Verificar endpoint protegido

```bash
# Sin token - debe fallar (403)
curl https://tablet.arvera.es/api/env

# Con token correcto - debe funcionar
curl -H "X-Config-Token: tu_token" https://tablet.arvera.es/api/env

# Desde origen no permitido - debe fallar (403)
curl -H "Origin: https://malicious.com" https://tablet.arvera.es/api/env
```

### Verificar proxy API

```bash
# GET citas a través del proxy
curl https://tablet.arvera.es/api/proxy/citas

# POST nueva cita (API_KEY añadido en servidor)
curl -X POST https://tablet.arvera.es/api/proxy/citas \
  -H "Content-Type: application/json" \
  -d '{"Nombre":"Test","Telefono":"+34600123456",...}'
```

---

## Checklist de Despliegue

- [ ] Generar `CONFIG_TOKEN` único y aleatorio
- [ ] Configurar `CONFIG_TOKEN` en Vercel (Settings > Environment Variables)
- [ ] Actualizar `configToken` en `js/config.js` con el mismo valor
- [ ] Desplegar a Vercel
- [ ] Verificar que `/api/env` requiere token (403 sin token)
- [ ] Verificar que la app carga correctamente
- [ ] Probar crear/editar/eliminar citas
- [ ] Verificar que API_KEY no aparece en DevTools > Network

---

## Notas de Seguridad

1. **CONFIG_TOKEN** debe ser único y aleatorio (UUID recomendado)
2. **Nunca** commitear el token real en Git
3. **API_KEY** solo debe existir en variables de entorno de Vercel
4. **SUPABASE_ANON_KEY** es seguro exponer (está diseñado para frontend)
5. Para mayor seguridad, considerar autenticación de usuario real (OAuth, etc.)

---

## Soporte

Si encuentras problemas:
1. Verificar que CONFIG_TOKEN está configurado en Vercel
2. Verificar que el token en config.js coincide
3. Revisar logs de Vercel Functions
4. Comprobar DevTools > Console para errores
