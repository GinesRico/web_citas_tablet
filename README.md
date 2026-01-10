# Calendario de Citas - Arvera

Aplicación web para gestión de citas optimizada para tablets y dispositivos táctiles.

## 🚀 Características

- ✅ **Doble vista**: Calendario semanal y slots disponibles
- ✅ Vista de calendario semanal (7 días laborables desde hoy)
- ✅ Vista de slots disponibles (horarios libres consultados desde API)
- ✅ Sincronización automática cada 30 segundos
- ✅ Agendamiento de citas con formulario táctil
- ✅ Drag & drop para reorganizar citas
- ✅ API REST completa con Supabase PostgreSQL
- ✅ Diseño Material Design responsive
- ✅ Optimizado para tablets táctiles
- ✅ Pull to refresh en móviles
- ✅ Dark mode support
- ✅ Arquitectura modular y SOLID

## 📱 Tecnologías

- HTML5 / CSS3 / Vanilla JavaScript
- Day.js para manejo de fechas
- Fetch API para comunicación con API REST
- Session Storage para persistencia
- Material Design guidelines
- API REST en Python (Vercel Serverless)
- Base de datos Supabase PostgreSQL

## 🏗️ Arquitectura

El código sigue principios SOLID con una arquitectura modular:

### Módulos de Vista (separados en `js/`)
- **`ViewManager.js`**: Gestor de vistas (cambio entre calendario y slots)
- **`CalendarioView.js`**: Renderizado del calendario semanal con drag & drop
- **`SlotsView.js`**: Renderizado de horarios disponibles (consume endpoint `/api/disponibles`)

### Servicios Principales (en `app.js`)
- **`ApiService`**: Comunicación con API REST
- **`UIService`**: Manipulación del DOM y modales
- **`HorarioService`**: Generación de horarios (08:30-12:15, 15:45-18:00)
- **`DiasLaborablesService`**: Generación de días laborables (excluye sábados/domingos)
- **`EstadisticasService`**: Cálculo de estadísticas de citas
- **`MiniCalendarioService`**: Calendario lateral de navegación
- **`CalendarioApp`**: Orquestación principal

### Principios Aplicados
- **Single Responsibility**: Cada clase/módulo tiene una única responsabilidad
- **Open/Closed**: Extendible sin modificar código existente
- **Separation of Concerns**: Vistas separadas en módulos independientes
- **Dependency Inversion**: Las clases dependen de abstracciones

## 🔗 API

La aplicación consume una API REST desplegada en:
```
https://api-citas-seven.vercel.app
```

Para más información sobre la API, consulta [api/README.md](api/README.md)

## � Migración de Datos

Si estás migrando desde el sistema antiguo de Cal.com, usa el script de migración incluido:

### Opción 1: Menú interactivo (Windows)

```powershell
.\migrar.bat
```

### Opción 2: Scripts directos

```powershell
# Instalar dependencias
pip install -r requirements_migration.txt

# Probar conectividad
python test_conexion.py

# Ejecutar migración
python migrate_citas.py

# Verificar migración
python verificar_migracion.py
```

Para instrucciones detalladas, consulta [MIGRACION.md](MIGRACION.md)

## �🚀 Deploy en Vercel

### Opción 1: Deploy con CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Opción 2: Deploy con Git

1. Sube el proyecto a GitHub
2. Importa en Vercel desde https://vercel.com/new
3. Selecciona el repositorio
4. Deploy automático

## 📂 Estructura del Proyecto

```
web_citas_tablet/
├── index.html                  # Panel de administración
├── reservas.html               # Página de reservas públicas
├── verificar-env.html          # Verificador de variables de entorno
├── app.js                      # Lógica de la aplicación principal
├── vercel.json                 # Configuración de Vercel
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker
├── migrate_citas.py            # Script de migración principal
├── test_conexion.py            # Script de prueba de conectividad
├── verificar_migracion.py      # Script de verificación post-migración
├── migrar.bat                  # Menú interactivo para Windows
├── requirements_migration.txt  # Dependencias para migración
├── MIGRACION.md               # Guía completa de migración
├── VARIABLES_ENTORNO.md       # Guía de configuración de variables de entorno
├── .gitignore                 # Archivos a ignorar en Git
├── api/                        # Documentación de la API
│   └── README.md
├── css/
│   ├── styles.css             # Estilos de la aplicación principal
│   ├── stats-extras.css       # Estilos de estadísticas y extras
│   └── reservas.css           # Estilos de la página pública
├── js/
│   ├── config.js              # Configuración centralizada (variables de entorno)
│   ├── ViewManager.js         # Gestor de vistas
│   ├── CalendarioView.js      # Vista de calendario
│   ├── SlotsView.js           # Vista de slots disponibles
│   └── reservas.js            # Lógica de reservas públicas
├── icons/                     # Iconos de la PWA
└── README.md                  # Este archivo
```

## 🎨 Mejoras Implementadas

### UI/UX para Tablets
- Botones más grandes (min 48px) para touch
- Pull to refresh en móviles
- Feedback visual mejorado
- Animaciones suaves
- Loading states claros
- Eliminación de citas con confirmación

### Performance
- Código modular y reutilizable
- Lazy rendering
- Debouncing de eventos
- Cache de datos en sessionStorage

### Accesibilidad
- Contraste mejorado
- Áreas de toque grandes
- Feedback visual claro
- Soporte para dark mode

## 🔧 Configuración

### Variables de Entorno

La aplicación utiliza variables de entorno para gestionar configuraciones sensibles de forma segura. 

**Configuración centralizada**: Todas las variables se gestionan desde `js/config.js`.

**Variables disponibles**:
- `API_BASE_URL`: URL de la API REST
- `WEBHOOK_URL`: URL del webhook n8n
- `CHECK_UPDATE_URL`: URL para verificar actualizaciones
- `SUPABASE_URL`: URL del proyecto Supabase
- `SUPABASE_ANON_KEY`: Clave anónima de Supabase

**Configurar en Vercel**:
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard) → Settings → Environment Variables
2. Agrega cada variable con su valor correspondiente
3. Re-despliega el proyecto

Para instrucciones detalladas, consulta [VARIABLES_ENTORNO.md](VARIABLES_ENTORNO.md)

**Verificar configuración**:
Abre `verificar-env.html` en tu navegador para ver el estado de las variables de entorno.

### Configuración de Horarios y Slots

Los horarios y duración de citas se configuran en `js/config.js`:

```javascript
const CONFIG = {
  HORARIOS: [['08:30', '12:15'], ['15:45', '18:00']], // Rangos horarios
  DURACION_CITA: 45, // minutos
  DIAS_LABORABLES: [1, 2, 3, 4, 5], // Lunes a Viernes
  TIMEZONE: 'Europe/Madrid'
};
```

## 📱 Uso en Tablet

1. Abre la aplicación en tu tablet
2. El calendario muestra 7 días laborables desde hoy
3. Toca una celda libre para agendar
4. Arrastra y suelta citas para reorganizar
5. Toca una cita para ver detalles y eliminarla
4. Toca una cita para ver detalles
5. Arrastra citas para reorganizar
6. Desliza hacia abajo para refrescar (mobile)

## 🔄 Sincronización

La aplicación verifica cambios cada 2 minutos consultando el webhook de actualización. Cuando detecta cambios, recarga automáticamente para mostrar las citas más recientes.

## 📝 Licencia

Propietario - Arvera

## 👨‍💻 Mantenimiento

Para modificar horarios, servicios o configuración, edita el objeto `CONFIG` en el código.
