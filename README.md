# Calendario de Citas - Arvera

Aplicación web para gestión de citas optimizada para tablets y dispositivos táctiles.

## 🚀 Características

- ✅ Vista de calendario semanal (7 días laborables desde hoy)
- ✅ Sincronización automática cada 30 segundos
- ✅ Agendamiento de citas con formulario táctil
- ✅ Drag & drop para reorganizar citas
- ✅ API REST completa con Supabase PostgreSQL
- ✅ Diseño Material Design responsive
- ✅ Optimizado para tablets táctiles
- ✅ Pull to refresh en móviles
- ✅ Dark mode support
- ✅ Arquitectura SOLID

## 📱 Tecnologías

- HTML5 / CSS3 / Vanilla JavaScript
- Day.js para manejo de fechas
- Fetch API para comunicación con API REST
- Session Storage para persistencia
- Material Design guidelines
- API REST en Python (Vercel Serverless)
- Base de datos Supabase PostgreSQL

## 🏗️ Arquitectura

El código sigue principios SOLID:

- **Single Responsibility**: Cada clase tiene una única responsabilidad
  - `ApiService`: Comunicación con API REST
  - `StorageService`: Persistencia de datos
  - `UIService`: Manipulación del DOM
  - `HorarioService`: Generación de horarios
  - `DiasLaborablesService`: Generación de días laborables
  - `CalendarioApp`: Orquestación principal

- **Open/Closed**: Extendible sin modificar código existente
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
├── index.html                  # Aplicación principal
├── app.js                      # Lógica de la aplicación
├── vercel.json                 # Configuración de Vercel
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker
├── migrate_citas.py            # Script de migración principal
├── test_conexion.py            # Script de prueba de conectividad
├── verificar_migracion.py      # Script de verificación post-migración
├── migrar.bat                  # Menú interactivo para Windows
├── requirements_migration.txt  # Dependencias para migración
├── MIGRACION.md               # Guía completa de migración
├── api/                        # Documentación de la API
│   └── README.md
├── css/
│   └── styles.css              # Estilos de la aplicación
├── icons/                      # Iconos de la PWA
└── README.md                   # Este archivo
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

La configuración de la API se encuentra en `CONFIG` al inicio de `app.js`:

```javascript
const CONFIG = {
  API_BASE_URL: 'https://api-citas-seven.vercel.app/api',
  AUTO_REFRESH_INTERVAL: 30 * 1000, // 30 segundos
  HORARIOS: [['08:30', '12:15'], ['15:45', '18:00']],
  DURACION_CITA: 45, // minutos
  DIAS_LABORABLES: 7 // 7 días laborables
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
