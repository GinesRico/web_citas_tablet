# Variables de Entorno - Configuración Segura

## 📋 Resumen

Este proyecto utiliza variables de entorno para gestionar configuraciones sensibles de forma segura. Las credenciales y URLs de servicios externos no se almacenan en el código fuente, sino que se configuran como variables de entorno en Vercel.

## 🔐 Variables de Entorno Disponibles

### API y Backend

| Variable | Descripción | Valor por defecto | Requerida |
|----------|-------------|-------------------|-----------|
| `API_BASE_URL` | URL base de la API REST | `https://api-citas-seven.vercel.app/api` | No |
| `API_KEY` | Token de autenticación para la API | `(vacío)` | **Sí** |
| `WEBHOOK_URL` | URL del webhook n8n para notificaciones | `https://webhook.arvera.es/webhook/cal-event` | No |
| `CHECK_UPDATE_URL` | URL del webhook para verificar actualizaciones | `https://webhook.arvera.es/webhook/check-update` | No |

### Supabase (Base de Datos)

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `SUPABASE_URL` | URL del proyecto Supabase | **Sí** |
| `SUPABASE_ANON_KEY` | Clave anónima (pública) de Supabase | **Sí** |

### Configuración de Aplicación

| Variable | Descripción | Valor por defecto | Formato |
|----------|-------------|-------------------|---------|
| `TIMEZONE` | Zona horaria para operaciones | `Europe/Madrid` | Nombre de zona horaria IANA |
| `HORARIOS` | Rangos de horario de trabajo | `08:30-12:15,15:45-18:00` | `HH:MM-HH:MM,HH:MM-HH:MM` |
| `DURACION_CITA` | Duración de cada cita en minutos | `45` | Número entero |
| `DIAS_LABORABLES` | Días laborables (1=Lun, 7=Dom) | `1,2,3,4,5` | Números separados por comas |
| `POLL_INTERVAL` | Intervalo de polling en milisegundos | `10000` | Número entero |

> ⚠️ **IMPORTANTE**: 
> - `API_KEY` es **REQUERIDA** - La API rechazará peticiones sin este token
> - TODAS las variables vienen de Vercel - Puedes cambiar horarios, timezone, etc. sin modificar código
> - Nunca compartas las API keys por canales no seguros

## 🚀 Configuración en Vercel

### Paso 1: Acceder al Dashboard de Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto (`web_citas_tablet`)
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Agregar Variables de Entorno

Para cada variable, haz clic en **Add New** y configura:

#### Variables de API
```
Name: API_BASE_URL
Value: https://api-citas-seven.vercel.app/api
Environment: Production, Preview, Development
```

```
Name: API_KEY
Value: tu-token-seguro-generado
Environment: Production, Preview, Development
```

> ⚠️ **IMPORTANTE**: La API está protegida y requiere `API_KEY`. Genera un token seguro único.
> Puedes usar: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

```
Name: WEBHOOK_URL
Value: https://webhook.arvera.es/webhook/cal-event
Environment: Production, Preview, Development
```

```
Name: CHECK_UPDATE_URL
Value: https://webhook.arvera.es/webhook/check-update
Environment: Production, Preview, Development
```

#### Variables de Supabase
```
Name: SUPABASE_URL
Value: https://pvvxwibhqowjcdxazalx.supabase.co
Environment: Production, Preview, Development
```

```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dnh3aWJocW93amNkeGF6YWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzNTY4MjIsImV4cCI6MjA1MTkzMjgyMn0.RJLCqGTiNx-bQFa8tXrM1B9j6wqP8wCEA7xGI1vPw4I
Environment: Production, Preview, Development
```

#### Variables de Configuración de Aplicación
```
Name: TIMEZONE
Value: Europe/Madrid
Environment: Production, Preview, Development
```

```
Name: HORARIOS
Value: 08:30-12:15,15:45-18:00
Environment: Production, Preview, Development
```

```
Name: DURACION_CITA
Value: 45
Environment: Production, Preview, Development
```

```
Name: DIAS_LABORABLES
Value: 1,2,3,4,5
Environment: Production, Preview, Development
```

```
Name: POLL_INTERVAL
Value: 10000
Environment: Production, Preview, Development
```

### Paso 3: Re-desplegar

Después de agregar las variables de entorno:
1. Ve a la pestaña **Deployments**
2. Selecciona el último deployment
3. Haz clic en el botón de tres puntos (⋯)
4. Selecciona **Redeploy**

Esto reconstruirá tu aplicación con las nuevas variables de entorno.

## 🛠️ Desarrollo Local

### Opción 1: Variables de Entorno Locales

Crea un archivo `.env.local` en la raíz del proyecto (este archivo NO se subirá a Git):

```env
# .env.local
API_BASE_URL=https://api-citas-seven.vercel.app/api
API_KEY=tu-token-seguro-generado
WEBHOOK_URL=https://webhook.arvera.es/webhook/cal-event
CHECK_UPDATE_URL=https://webhook.arvera.es/webhook/check-update
SUPABASE_URL=https://pvvxwibhqowjcdxazalx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dnh3aWJocW93amNkeGF6YWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzNTY4MjIsImV4cCI6MjA1MTkzMjgyMn0.RJLCqGTiNx-bQFa8tXrM1B9j6wqP8wCEA7xGI1vPw4I
```

> **Generar API_KEY segura**:
> ```bash
> python -c "import secrets; print(secrets.token_urlsafe(32))"
> ```
> Usa el mismo valor que configuraste en la API de Vercel.

### Opción 2: Valores por Defecto

Si no configuras variables de entorno localmente, la aplicación usará los valores por defecto especificados en `js/config.js`.

## 📝 Cómo Funciona

### Endpoint Serverless para Configuración

La aplicación obtiene todas las variables de entorno desde un endpoint serverless (`/api/env`) que:

1. **Ejecuta en el servidor de Vercel** - Tiene acceso a las variables de entorno configuradas
2. **Expone solo variables públicas** - No expone secretos del servidor (como `SUPABASE_SERVICE_KEY`)
3. **Devuelve JSON** - El cliente consume la configuración vía fetch
4. **Cache de 5 minutos** - Para reducir llamadas y mejorar rendimiento

**Flujo de carga**:
```
1. Usuario abre la aplicación
2. config.js hace fetch a /api/env
3. Servidor lee variables de entorno de Vercel
4. Servidor devuelve JSON con las variables
5. config.js actualiza el objeto CONFIG
6. Aplicación se inicializa con la configuración correcta
```

### Archivo de Configuración del Cliente

El archivo `js/config.js` carga la configuración de forma asíncrona:

```javascript
async function loadEnvFromServer() {
  const response = await fetch('/api/env');
  const envVars = await response.json();
  
  // Actualiza CONFIG con valores del servidor
  CONFIG.API_BASE_URL = envVars.API_BASE_URL;
  CONFIG.API_KEY = envVars.API_KEY;
  // ... etc
}

// Promesa que se resuelve cuando la config está lista
const configPromise = loadEnvFromServer();
```

La aplicación espera a que `configPromise` se resuelva antes de inicializarse.

## 🔒 Mejores Prácticas de Seguridad

### ✅ Hacer

- ✅ Configurar todas las credenciales como variables de entorno en Vercel
- ✅ Rotar las claves periódicamente (cada 3-6 meses)
- ✅ Usar diferentes valores para Development, Preview y Production
- ✅ Mantener `.env.local` en `.gitignore`
- ✅ Documentar todas las variables requeridas

### ❌ No Hacer

- ❌ Nunca subir credenciales al repositorio Git
- ❌ No compartir las claves por email o chat sin cifrar
- ❌ No usar las mismas claves en desarrollo y producción
- ❌ No exponer claves "service_role" de Supabase en el cliente (solo usar "anon")

## 🔄 Actualización de Variables

Cuando necesites cambiar una variable de entorno:

1. **Vercel Dashboard**: Settings → Environment Variables → Edita la variable
2. **Re-desplegar**: Deployments → Redeploy para aplicar cambios
3. **Verificar**: Comprueba que la aplicación funcione correctamente

## 📚 Referencias

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase API Keys](https://supabase.com/docs/guides/api#api-keys)
- [n8n Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

## 🐛 Troubleshooting

### Problema: Las variables no se aplican

**Solución**: Re-despliega el proyecto después de configurar las variables.

### Problema: Error de autenticación con Supabase

**Solución**: Verifica que `SUPABASE_ANON_KEY` sea la clave "anon" (no "service_role").

### Problema: Los webhooks no funcionan

**Solución**: Comprueba que las URLs de webhook sean correctas y accesibles desde internet.

---

**Última actualización**: 10 de enero de 2026
