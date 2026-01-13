# API de Gestión de Citas

API REST para gestión de citas desplegada en Vercel con base de datos Supabase PostgreSQL.

## 🚀 Características

- ✅ CRUD completo de citas con autenticación por token
- ✅ Filtrado por rango de fechas y estado
- ✅ **Cancelación suave**: DELETE cambia estado a "Cancelada" (no elimina)
- ✅ Sistema de cancelación pública con tokens seguros
- ✅ Webhooks para notificaciones
- ✅ CORS habilitado
- ✅ Base de datos PostgreSQL (Supabase)
- ✅ Desplegado en Vercel

## 🔗 URL de Producción

```
https://api-citas-seven.vercel.app
```

## 📋 Endpoints

**Autenticación requerida:** Todos los endpoints (excepto `/api/cancelar`) requieren un token de API en el header:
```
Authorization: Bearer TU_TOKEN_AQUI
```

### GET /api/citas
Obtiene todas las citas o filtra por rango de fechas y/o estado.

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
```

**Query Parameters (opcionales):**
- `startDate` - Fecha inicio en ISO 8601 (ej: `2026-01-01T00:00:00Z`)
- `endDate` - Fecha fin en ISO 8601 (ej: `2026-01-31T23:59:59Z`)
- `estado` - Filtra por estado: `Confirmada`, `Cancelada`, `Completada`

**Ejemplos:**
```bash
# Todas las citas
curl -H "Authorization: Bearer TU_TOKEN" https://api-citas-seven.vercel.app/api/citas

# Solo citas confirmadas (excluye canceladas)
curl -H "Authorization: Bearer TU_TOKEN" \
  "https://api-citas-seven.vercel.app/api/citas?estado=Confirmada"

# Citas de enero 2026 confirmadas
curl -H "Authorization: Bearer TU_TOKEN" \
  "https://api-citas-seven.vercel.app/api/citas?startDate=2026-01-01T00:00:00Z&endDate=2026-01-31T23:59:59Z&estado=Confirmada"
```

**Respuesta:**
```json
[
  {
    "Id": "20260108173953-2683cfa7",
    "Nombre": "Juan Perez",
    "Telefono": "123456789",
    "Email": "juan@example.com",
    "Servicio": "Revision",
    "startTime": "2026-01-15T10:00:00+00:00",
    "endTime": "2026-01-15T11:00:00+00:00",
    "Matricula": "ABC123",
    "Modelo": "Toyota Corolla",
    "Notas": "Prueba",
    "Estado": "Confirmada",
    "Notificacion": "enviada",
    "Recordatorio": "no enviada",
    "CancelToken": "QmUimF6j8pOpl2CaHRQ5uD7HWCLffZGerWCy4vo7FKI",
    "Url_Cancelacion": "https://api-citas-seven.vercel.app/api/cancelar?token=..."
  }
]
```

### POST /api/citas
Crea una nueva cita.

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Campos obligatorios:**
- `Nombre` - Nombre del cliente
- `Telefono` - Teléfono de contacto
- `Servicio` - Tipo de servicio
- `startTime` - Fecha/hora inicio en ISO 8601 (ej: `2026-01-20T10:30:00Z`)
- `endTime` - Fecha/hora fin en ISO 8601 (ej: `2026-01-20T11:00:00Z`)

**Campos opcionales:**
- `Email`, `Matricula`, `Modelo`, `Notas`

**Ejemplo:**
```bash
curl -X POST https://api-citas-seven.vercel.app/api/citas \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Nombre": "Juan Pérez",
    "Telefono": "+34600000000",
    "Email": "juan@email.com",
    "Servicio": "Revisión",
    "startTime": "2026-01-20T10:30:00Z",
    "endTime": "2026-01-20T11:00:00Z",
    "Matricula": "1234ABC",
    "Modelo": "Ford Focus",
    "Notas": "Cliente prefiere por la mañana"
  }'
```

**Respuesta:** 201 Created
- Se genera automáticamente: `Id`, `CancelToken`, `Url_Cancelacion`, `Estado`, `Notificacion`, `Recordatorio`
- Se envía webhook si está configurado

### GET /api/citas/{id}
Obtiene una cita específica por ID.

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
```

### PUT /api/citas/{id}
Actualiza una cita existente. Permite modificar cualquier campo de la cita.

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json
```

**Campos actualizables:**
- `Nombre`, `Telefono`, `Email`, `Servicio`
- `startTime`, `endTime` - Para drag & drop (modificar horarios)
- `Matricula`, `Modelo`, `Notas`, `Estado`
- `Notificacion` - Estado de notificación: `"enviada"` o `"no enviada"`
- `Recordatorio` - Estado de recordatorio: `"enviada"` o `"no enviada"`

**Ejemplos:**

```bash
# Actualizar horario (drag & drop)
curl -X PUT https://api-citas-seven.vercel.app/api/citas/CITA_ID \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2026-01-21T15:00:00Z",
    "endTime": "2026-01-21T15:30:00Z"
  }'

# Marcar notificación como enviada
curl -X PUT https://api-citas-seven.vercel.app/api/citas/CITA_ID \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"Notificacion": "enviada"}'
```

### DELETE /api/citas/{id}
**Cancela una cita** cambiando su estado a `Cancelada` (no la elimina de la base de datos).

**Headers:**
```
Authorization: Bearer TU_TOKEN_AQUI
```

**¿Por qué cancelar en lugar de eliminar?**
- ✅ Mantiene historial completo de citas
- ✅ Permite análisis de cancelaciones
- ✅ Las citas canceladas no aparecen cuando filtras por `estado=Confirmada`
- ✅ El horario queda disponible para nuevas reservas
- ✅ Se puede recuperar información si es necesario

**Ejemplo:**
```bash
curl -X DELETE https://api-citas-seven.vercel.app/api/citas/CITA_ID \
  -H "Authorization: Bearer TU_TOKEN"
```

**Respuesta:**
```json
{
  "mensaje": "Cita cancelada correctamente",
  "cita": {
    "Id": "20260108173953-2683cfa7",
    "Estado": "Cancelada",
    ...
  }
}
```

**💡 Tip:** Para mostrar solo citas activas en el calendario, usa:
```bash
curl -H "Authorization: Bearer TU_TOKEN" \
  "https://api-citas-seven.vercel.app/api/citas?estado=Confirmada"
```

### GET /api/cancelar?token={token}
**Endpoint público** (sin autenticación) para cancelar citas usando el token de cancelación.

**Características:**
- ✅ No requiere token de API
- ✅ Permite a los clientes cancelar sus citas con un solo clic
- ✅ Token único e irrepetible por cita
- ✅ URL incluida automáticamente en la respuesta de creación

**Ejemplo:**
```bash
curl "https://api-citas-seven.vercel.app/api/cancelar?token=QmUimF6j8pOpl2CaHRQ5uD7HWCLffZGerWCy4vo7FKI"
```

**Respuesta:**
```json
{
  "mensaje": "Cita cancelada correctamente",
  "cita": {
    "Id": "20260108173953-2683cfa7",
    "Estado": "Cancelada"
  }
}
```

### GET /api/disponibles
Obtiene las horas disponibles (no ocupadas) en un rango de fechas.

**Query Parameters:**
- `startDate` (requerido) - Fecha inicio en formato `YYYY-MM-DD` o ISO 8601 (ej: `2026-01-20` o `2026-01-20T00:00:00Z`)
- `endDate` (requerido) - Fecha fin en formato `YYYY-MM-DD` o ISO 8601 (ej: `2026-01-25` o `2026-01-25T23:59:59Z`)
- `duracion` (opcional) - Duración de cada slot en minutos (por defecto: `60`)
- `horarios` (opcional) - Múltiples rangos horarios separados por comas (ej: `08:30-12:15,15:45-18:00`)
- `horaInicio` (opcional) - Hora de inicio del horario laboral HH:MM (por defecto: `09:00`)
- `horaFin` (opcional) - Hora de fin del horario laboral HH:MM (por defecto: `18:00`)
- `timezone` (opcional) - Zona horaria para los horarios (ej: `Europe/Madrid`). Si se especifica, los horarios se interpretan como hora local y se convierten automáticamente a UTC

**Notas:**
- Si se especifica `horarios`, se ignoran `horaInicio` y `horaFin`
- Si se especifica `timezone`, los horarios en `horarios`/`horaInicio`/`horaFin` se interpretan como hora local de esa zona horaria

**Ejemplo:**
```bash
# Ver horas disponibles de un solo día (12 de enero) - horarios en hora local de España
curl "https://api-citas-seven.vercel.app/api/disponibles?startDate=2026-01-12&endDate=2026-01-12&duracion=45&horarios=08:30-12:15,15:45-18:00&timezone=Europe/Madrid"

# Ver horas disponibles del 20 al 25 de enero, slots de 60 minutos
curl "https://api-citas-seven.vercel.app/api/disponibles?startDate=2026-01-20&endDate=2026-01-25&duracion=60"

# Con horario personalizado (8:00 - 20:00) en hora local
curl "https://api-citas-seven.vercel.app/api/disponibles?startDate=2026-01-20&endDate=2026-01-25&duracion=30&horaInicio=08:00&horaFin=20:00&timezone=Europe/Madrid"

# Sin timezone (horarios en UTC)
curl "https://api-citas-seven.vercel.app/api/disponibles?startDate=2026-01-20&endDate=2026-01-25&duracion=45&horarios=07:30-11:15,14:45-17:00"
```

**Respuesta:**
```json
{
  "total": 45,
  "parametros": {
    "startDate": "2026-01-20T00:00:00Z",
    "endDate": "2026-01-25T23:59:59Z",
    "duracion": 60,
    "horaInicio": "09:00",
    "horaFin": "18:00"
  },
  "disponibles": [
    {
      "fecha": "2026-01-20",
      "hora_inicio": "09:00",
      "hora_fin": "10:00",
      "startTime": "2026-01-20T09:00:00+00:00",
      "endTime": "2026-01-20T10:00:00+00:00"
    },
    {
      "fecha": "2026-01-20",
      "hora_inicio": "11:00",
      "hora_fin": "12:00",
      "startTime": "2026-01-20T11:00:00+00:00",
      "endTime": "2026-01-20T12:00:00+00:00"
    }
  ]
}
```

## 🛠️ Configuración

### Variables de Entorno (Vercel)

Configura en **Vercel Dashboard → Settings → Environment Variables**:

```
SUPABASE_URL=https://wgsqgvxoipnbetxinzgb.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon public key)
API_TOKEN=tu-token-seguro-para-autenticacion
WEBHOOK_URL=https://tu-webhook.com/endpoint (opcional)
```

**Notas:**
- `SUPABASE_KEY`: Obtén la clave **anon/public** desde Supabase → Settings → API
- `API_TOKEN`: Genera un token seguro para autenticar tus peticiones
- `WEBHOOK_URL`: (Opcional) URL donde se enviarán notificaciones de nuevas citas

**Token de API (Seguridad):**
- `API_TOKEN` (opcional pero recomendado): Token de seguridad para proteger los endpoints
- Genera un token seguro ejecutando: `python generar_token.py`
- Si no se configura, la API funciona sin autenticación (modo retrocompatible)
- Envía el token en las peticiones usando uno de estos headers:
  - `Authorization: Bearer TU_TOKEN`
  - `X-API-Key: TU_TOKEN`

**Endpoints protegidos:** GET/POST /api/citas, GET/PUT/DELETE /api/citas/{id}, GET /api/disponibles

**Endpoints públicos:** GET /api/cancelar (no requiere token)

**Webhooks:**
- `WEBHOOK_URL` (opcional): URL donde se enviarán notificaciones de cambios en citas
- Si no se configura, las operaciones funcionan normalmente sin enviar webhooks
- El webhook recibe un POST con el evento y los datos de la cita afectada

**Eventos de webhook enviados:**
- `cita.creada` - Cuando se crea una nueva cita
- `cita.actualizada` - Cuando se modifica una cita existente
- `cita.eliminada` - Cuando se elimina una cita
- `cita.cancelada` - Cuando se cancela una cita por token

**Formato del payload:**
```json
{
  "event": "cita.creada",
  "timestamp": 1704900000,
  "data": {
    "Id": "20260109123456-abc123",
    "Nombre": "Juan Pérez",
    "Telefono": "600000000",
    "Servicio": "Revisión",
    "startTime": "2026-01-20T10:00:00+00:00",
    "endTime": "2026-01-20T11:00:00+00:00",
    "Estado": "Confirmada"
  }
}
```

### Base de Datos (Supabase)

1. Crea la tabla `citas` usando [schema.sql](schema.sql)
2. Configura las políticas RLS:
   - SELECT: `true`
   - INSERT: `true`
   - UPDATE: `true`
   - DELETE: `true`

### Instalación Local

```bash
# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Desarrollo local
vercel dev
```

## 🌐 Despliegue

El proyecto se despliega automáticamente en Vercel cuando haces push a GitHub.

```bash
git push origin main
```

## 📁 Estructura

```
api_citas/
├── api/
│   ├── cancelar.py       # GET /api/cancelar (cancelación por token)
│   ├── disponibles.py    # GET /api/disponibles (horas disponibles)
│   └── citas/
│       ├── index.py      # GET/POST /api/citas
│       └── [id].py       # GET/PUT/DELETE /api/citas/{id}
├── lib/
│   ├── db.py             # Conexión a Supabase REST API
│   └── utils.py          # Funciones de negocio (CRUD, validación)
├── .env.example          # Plantilla de variables de entorno
├── requirements.txt      # Dependencias Python
├── schema.sql            # Esquema de base de datos
├── vercel.json           # Configuración de Vercel
└── README.md
```

## 📝 Formato de Fechas

- **Formato:** ISO 8601 con timezone UTC
- **Ejemplos válidos:**
  - `2026-01-20T10:30:00Z`
  - `2026-01-20T10:30:00+00:00`

## 🔄 Ejemplos de Uso

### Crear cita
```bash
curl -X POST https://api-citas-seven.vercel.app/api/citas \
  -H "Content-Type: application/json" \
  -d '{
    "Nombre": "Juan Pérez",
    "Telefono": "123456789",
    "Servicio": "Revision",
    "startTime": "2026-01-20T10:30:00Z",
    "endTime": "2026-01-20T11:00:00Z",
    "Matricula": "ABC123",
    "Modelo": "Toyota"
  }'
```

### Listar todas las citas
```bash
curl https://api-citas-seven.vercel.app/api/citas
```

### Filtrar por rango de fechas
```bash
curl "https://api-citas-seven.vercel.app/api/citas?startDate=2026-01-01T00:00:00Z&endDate=2026-01-31T23:59:59Z"
```

### Actualizar cita
```bash
curl -X PUT https://api-citas-seven.vercel.app/api/citas/CITA_ID \
  -H "Content-Type: application/json" \
  -d '{"Notas": "Actualizada"}'
```

### Eliminar cita
```bash
curl -X DELETE https://api-citas-seven.vercel.app/api/citas/CITA_ID
```

### Cancelar por token
```bash
curl "https://api-citas-seven.vercel.app/api/cancelar?token=TOKEN_AQUI"
```

### Ver horas disponibles
```bash
# Horas disponibles para un día específico (12 de enero) - hora local España
curl "https://api-citas-seven.vercel.app/api/disponibles?startDate=2026-01-12&endDate=2026-01-12&duracion=45&horarios=08:30-12:15,15:45-18:00&timezone=Europe/Madrid"

# Slots de 60 minutos del 20 al 25 de enero
curl "https://api-citas-seven.vercel.app/api/disponibles?startDate=2026-01-20&endDate=2026-01-25&duracion=60"

# Slots de 30 minutos con horario extendido (8:00 - 20:00) en hora local
curl "https://api-citas-seven.vercel.app/api/disponibles?startDate=2026-01-20&endDate=2026-01-25&duracion=30&horaInicio=08:00&horaFin=20:00&timezone=Europe/Madrid"

# Sin timezone (horarios en UTC directamente)
curl "https://api-citas-seven.vercel.app/api/disponibles?startDate=2026-01-20&endDate=2026-01-25&duracion=45&horarios=07:30-11:15,14:45-17:00"
```

## 🔒 Seguridad

- **Autenticación:** Token de API requerido en header `Authorization: Bearer TOKEN` (excepto `/api/cancelar`)
- **Tokens de cancelación:** Generados con `secrets.token_urlsafe(32)` (43 caracteres)
- **CORS:** Habilitado para todos los orígenes
- **RLS:** Row Level Security configurado en Supabase
- **Variables de entorno:** Credenciales sensibles almacenadas en Vercel

## 📊 Estados de Cita

- `Confirmada` - Cita activa (se muestra en calendario)
- `Cancelada` - Cita cancelada (no aparece al filtrar por `estado=Confirmada`)
- `Completada` - Cita finalizada
- Puedes definir estados personalizados según tus necesidades

## 💡 Mejores Prácticas

1. **Filtrar por estado en el calendario:** Usa `?estado=Confirmada` para mostrar solo citas activas
2. **No eliminar citas:** Usa DELETE que cambia estado a "Cancelada" para mantener historial
3. **Tokens de cancelación:** Incluye la `Url_Cancelacion` en emails/SMS a clientes
4. **Webhooks:** Configura `WEBHOOK_URL` para recibir notificaciones de nuevas citas
5. **Notificaciones:** Marca como enviadas usando PUT con `{"Notificacion": "enviada"}`

## 📄 Licencia

MIT
