# Calendario de Citas - Arvera

Aplicación web para gestión de citas optimizada para tablets y dispositivos táctiles.

## 🚀 Características

- ✅ Vista de calendario semanal (7 días desde hoy)
- ✅ Sincronización automática cada 2 minutos
- ✅ Agendamiento de citas con formulario táctil
- ✅ Drag & drop para reorganizar citas
- ✅ Diseño Material Design responsive
- ✅ Optimizado para tablets táctiles
- ✅ Pull to refresh en móviles
- ✅ Dark mode support
- ✅ Arquitectura SOLID

## 📱 Tecnologías

- HTML5 / CSS3 / Vanilla JavaScript
- Day.js para manejo de fechas
- Fetch API para comunicación con webhooks
- Session Storage para persistencia
- Material Design guidelines

## 🏗️ Arquitectura

El código sigue principios SOLID:

- **Single Responsibility**: Cada clase tiene una única responsabilidad
  - `ApiService`: Comunicación con API
  - `StorageService`: Persistencia de datos
  - `UIService`: Manipulación del DOM
  - `HorarioService`: Generación de horarios
  - `CalendarioApp`: Orquestación principal

- **Open/Closed**: Extendible sin modificar código existente
- **Dependency Inversion**: Las clases dependen de abstracciones

## 🚀 Deploy en Vercel

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

### Variables de Entorno (opcional)

Puedes configurar las URLs de los webhooks como variables de entorno en Vercel:

```
WEBHOOK_CITAS_URL=https://webhook.arvera.es/webhook/citas
WEBHOOK_CHECK_URL=https://webhook.arvera.es/webhook/check-update
WEBHOOK_AGENDAR_URL=https://webhook.arvera.es/webhook/agendar
```

## 📂 Estructura del Proyecto

```
web_citas_tablet/
├── index.html              # Versión original
├── index_mejorado.html     # Versión mejorada con SOLID
├── vercel.json            # Configuración de Vercel
├── README.md              # Este archivo
└── .gitignore             # Archivos a ignorar
```

## 🎨 Mejoras Implementadas

### UI/UX para Tablets
- Botones más grandes (min 48px) para touch
- Pull to refresh en móviles
- Feedback visual mejorado
- Animaciones suaves
- Loading states claros

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

Edita las constantes en `CONFIG` al inicio del JavaScript:

```javascript
const CONFIG = {
  WEBHOOK_URL: 'tu-webhook-url',
  CHECK_UPDATE_URL: 'tu-check-url',
  AGENDAR_URL: 'tu-agendar-url',
  AUTO_REFRESH_INTERVAL: 2 * 60 * 1000,
  HORARIOS: [['08:30', '12:15'], ['15:45', '18:00']],
  DURACION_CITA: 45,
  DIAS_VISTA: 7
};
```

## 📱 Uso en Tablet

1. Abre la aplicación en tu tablet
2. El calendario muestra 7 días desde hoy
3. Toca una celda libre para agendar
4. Toca una cita para ver detalles
5. Arrastra citas para reorganizar
6. Desliza hacia abajo para refrescar (mobile)

## 🔄 Sincronización

La aplicación verifica cambios cada 2 minutos consultando el webhook de actualización. Cuando detecta cambios, recarga automáticamente para mostrar las citas más recientes.

## 📝 Licencia

Propietario - Arvera

## 👨‍💻 Mantenimiento

Para modificar horarios, servicios o configuración, edita el objeto `CONFIG` en el código.
