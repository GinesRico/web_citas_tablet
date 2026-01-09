/****************************************
 * CONFIGURACIÓN
 ****************************************/
const CONFIG = {
  API_BASE_URL: 'https://api-citas-seven.vercel.app/api',
  AUTO_REFRESH_INTERVAL: 30 * 1000, // 30 segundos
  HORARIOS: [
    ['08:30', '12:15'],
    ['15:45', '18:00']
  ],
  DURACION_CITA: 45, // minutos
  DIAS_LABORABLES: 7 // 7 días laborables (sin sábados ni domingos)
};

/****************************************
 * SERVICIOS (Single Responsibility)
 ****************************************/

// DeviceDetectionService: Detecta tipo de dispositivo
class DeviceDetectionService {
  static getDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    
    // Detectar Android
    const isAndroid = ua.includes('android');
    
    // Detectar iOS/iPadOS (mejorado para iPads modernos)
    const isIOS = /ipad|iphone|ipod/.test(ua) || 
                  (platform === 'macintel' && maxTouchPoints > 1); // iPadOS 13+ se identifica como Mac
    
    // Detectar iPad específicamente (incluyendo iPadOS 13+)
    const isIPad = ua.includes('ipad') || 
                   (platform === 'macintel' && maxTouchPoints > 1);
    
    // Detectar iPhone
    const isIPhone = ua.includes('iphone') || ua.includes('ipod');
    
    // Detectar tablets (Android, iPad, o por características)
    const isTablet = (
      (isAndroid && !ua.includes('mobile')) || // Android tablet
      isIPad || // iPad/iPadOS
      ua.includes('tablet') || // Generic tablet
      // Detectar tablets por touch points y tamaño de pantalla
      (maxTouchPoints > 1 && window.innerWidth >= 768 && window.innerWidth <= 1366) ||
      // Tablets Android grandes
      (isAndroid && window.innerWidth >= 600)
    );
    
    // Detectar móvil
    const isMobile = (
      (isAndroid && ua.includes('mobile')) || // Android móvil
      isIPhone || // iPhone
      (maxTouchPoints > 0 && window.innerWidth < 768 && !isTablet) || // Touch pequeño
      window.innerWidth < 600
    );
    
    // Desktop: no es tablet ni móvil Y (no tiene touch points O tiene pantalla muy grande)
    const isDesktop = !isTablet && !isMobile && 
                      (maxTouchPoints === 0 || window.innerWidth > 1366);
    
    return {
      isAndroid,
      isIOS,
      isIPad,
      isIPhone,
      isTablet,
      isMobile,
      isDesktop,
      isAndroidTablet: isAndroid && isTablet,
      maxTouchPoints,
      screenWidth: window.innerWidth
    };
  }
  
  static applyDeviceClasses() {
    const device = this.getDeviceType();
    const body = document.body;
    
    // Limpiar clases anteriores
    body.classList.remove('device-mobile', 'device-tablet', 'device-desktop', 
                         'device-android-tablet', 'device-ipad', 'device-iphone');
    
    // Aplicar clases según dispositivo
    if (device.isMobile) {
      body.classList.add('device-mobile');
      if (device.isIPhone) {
        body.classList.add('device-iphone');
      }
    } else if (device.isTablet) {
      body.classList.add('device-tablet');
      if (device.isAndroidTablet) {
        body.classList.add('device-android-tablet');
      }
      if (device.isIPad) {
        body.classList.add('device-ipad');
      }
    } else {
      body.classList.add('device-desktop');
    }
    
    // Debug info (puedes ver en consola)
    console.log('Device Detection:', device);
    
    return device;
  }
}

// Servicio de API
class ApiService {
  async fetch(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      return response;
    } catch (error) {
      console.error('Error en fetch:', error);
      throw error;
    }
  }

  async getCitas(startDate = null, endDate = null) {
    let url = `${CONFIG.API_BASE_URL}/citas`;
    if (startDate && endDate) {
      url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    }
    const res = await this.fetch(url);
    if (!res.ok) throw new Error('Error al obtener citas');
    const data = await res.json();
    
    // Normalizar los datos de la API al formato esperado por la app
    return data.map(cita => ({
      id: cita.Id,
      start: cita.startTime,
      end: cita.endTime,
      name: cita.Nombre,
      phone: String(cita.Telefono || ''),
      email: cita.Email || '',
      service: cita.Servicio,
      matricula: cita.Matricula || '',
      modelo: cita.Modelo || '',
      notes: cita.Notas || '',
      estado: cita.Estado,
      cancelToken: cita.CancelToken
    }));
  }

  async agendarCita(datos) {
    const res = await this.fetch(`${CONFIG.API_BASE_URL}/citas`, {
      method: 'POST',
      body: JSON.stringify({
        Nombre: datos.name,
        Telefono: datos.phone,
        Email: datos.email || '',
        Servicio: datos.service,
        startTime: datos.start,
        endTime: datos.end,
        Matricula: datos.matricula || '',
        Modelo: datos.modelo || '',
        Notas: datos.notes || ''
      })
    });
    return res;
  }

  async actualizarCita(citaId, datos) {
    const res = await this.fetch(`${CONFIG.API_BASE_URL}/citas/${citaId}`, {
      method: 'PUT',
      body: JSON.stringify(datos)
    });
    return res;
  }

  async eliminarCita(citaId) {
    const res = await this.fetch(`${CONFIG.API_BASE_URL}/citas/${citaId}`, {
      method: 'DELETE'
    });
    return res;
  }
}

// Servicio de almacenamiento
class StorageService {
  constructor() {
    this.fallbackStorage = {};
    this.usesFallback = false;
    this.testStorage();
  }

  testStorage() {
    try {
      sessionStorage.setItem('__test__', '1');
      sessionStorage.removeItem('__test__');
      this.usesFallback = false;
    } catch (e) {
      console.warn('SessionStorage bloqueado, usando fallback en memoria');
      this.usesFallback = true;
    }
  }

  get(key) {
    try {
      if (this.usesFallback) {
        return this.fallbackStorage[key] || null;
      }
      return sessionStorage.getItem(key);
    } catch (e) {
      return this.fallbackStorage[key] || null;
    }
  }

  set(key, value) {
    try {
      if (this.usesFallback) {
        this.fallbackStorage[key] = value;
        return;
      }
      sessionStorage.setItem(key, value);
    } catch (e) {
      this.fallbackStorage[key] = value;
    }
  }

  remove(key) {
    try {
      if (this.usesFallback) {
        delete this.fallbackStorage[key];
        return;
      }
      sessionStorage.removeItem(key);
    } catch (e) {
      delete this.fallbackStorage[key];
    }
  }

  clear() {
    try {
      if (this.usesFallback) {
        this.fallbackStorage = {};
        return;
      }
      sessionStorage.clear();
    } catch (e) {
      this.fallbackStorage = {};
    }
  }
}

// Servicio de UI
class UIService {
  showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
  }

  hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
  }

  showModal(content) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-body').innerHTML = content;
    modal.classList.add('show');
    modal.style.display = 'flex';
  }

  closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 200);
  }

  setTitle(text) {
    document.getElementById('title').innerText = text;
  }

  setLastUpdate(text) {
    document.getElementById('lastUpdate').innerText = text;
  }

  setRefreshLoading(loading) {
    const btn = document.getElementById('btnRefresh');
    if (loading) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  showError(message) {
    console.error(message);
  }

  showSuccess(message) {
    console.log(message);
  }
}

// Generador de horarios
class HorarioService {
  generar() {
    const horas = [];
    CONFIG.HORARIOS.forEach(([inicio, fin]) => {
      let t = dayjs(`2000-01-01 ${inicio}`);
      const end = dayjs(`2000-01-01 ${fin}`);
      while (t.isSameOrBefore(end)) {
        horas.push(t.format('HH:mm'));
        t = t.add(CONFIG.DURACION_CITA, 'minute');
      }
    });
    return horas;
  }
}

// Servicio de días laborables
class DiasLaborablesService {
  /**
   * Obtiene el siguiente día laborable (lunes a viernes) desde una fecha
   */
  obtenerSiguienteDiaLaborable(fecha) {
    let dia = fecha.clone();
    // Si es fin de semana, avanza al lunes
    while (dia.day() === 0 || dia.day() === 6) {
      dia = dia.add(1, 'day');
    }
    return dia;
  }

  /**
   * Genera array de días laborables desde una fecha inicial
   */
  generarDiasLaborables(fechaInicio, cantidad) {
    const dias = [];
    let diaActual = this.obtenerSiguienteDiaLaborable(fechaInicio);
    
    while (dias.length < cantidad) {
      dias.push(diaActual);
      diaActual = diaActual.add(1, 'day');
      // Saltar fin de semana
      while (diaActual.day() === 0 || diaActual.day() === 6) {
        diaActual = diaActual.add(1, 'day');
      }
    }
    
    return dias;
  }
}

// Servicio de Mini Calendario
class MiniCalendarioService {
  constructor(app) {
    this.app = app;
    this.currentMonth = dayjs();
  }

  render() {
    const grid = document.getElementById('miniCalendarGrid');
    const header = document.getElementById('miniCalendarMonth');
    
    if (!grid || !header) return;

    header.textContent = this.currentMonth.format('MMMM YYYY');
    grid.innerHTML = '';

    // Cabeceras de días
    const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    diasSemana.forEach(dia => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'mini-calendar-day-header';
      dayHeader.textContent = dia;
      grid.appendChild(dayHeader);
    });

    // Días del mes
    const primerDia = this.currentMonth.startOf('month');
    const ultimoDia = this.currentMonth.endOf('month');
    const primerDiaSemana = primerDia.day() === 0 ? 7 : primerDia.day(); // Lunes = 1
    
    // Días del mes anterior
    for (let i = 1; i < primerDiaSemana; i++) {
      const day = primerDia.subtract(primerDiaSemana - i, 'day');
      this.renderDay(grid, day, true);
    }

    // Días del mes actual
    let dia = primerDia;
    while (dia.isSameOrBefore(ultimoDia, 'day')) {
      this.renderDay(grid, dia, false);
      dia = dia.add(1, 'day');
    }

    // Días del siguiente mes para completar grid
    const diasRestantes = 42 - grid.children.length + 7; // Total 42 celdas (7 headers + 35 días)
    for (let i = 1; i <= diasRestantes; i++) {
      const day = ultimoDia.add(i, 'day');
      this.renderDay(grid, day, true);
    }
  }

  renderDay(grid, dia, otherMonth) {
    const dayCell = document.createElement('div');
    dayCell.className = 'mini-calendar-day';
    dayCell.textContent = dia.format('D');
    
    if (otherMonth) {
      dayCell.classList.add('other-month');
    }

    // Marcar hoy
    if (dia.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')) {
      dayCell.classList.add('today');
    }

    // Marcar semana seleccionada
    const semanaActual = this.app.currentWeek;
    const finSemana = semanaActual.add(6, 'day');
    const diaStr = dia.format('YYYY-MM-DD');
    const inicioStr = semanaActual.format('YYYY-MM-DD');
    const finStr = finSemana.format('YYYY-MM-DD');
    if (diaStr >= inicioStr && diaStr <= finStr) {
      dayCell.classList.add('selected');
    }

    // Marcar fin de semana
    if (dia.day() === 0 || dia.day() === 6) {
      dayCell.classList.add('weekend');
    }

    // Marcar si hay citas
    const tieneCitas = this.app.citas.some(c => {
      const fechaCita = dayjs.utc(c.start).local().format('YYYY-MM-DD');
      return fechaCita === dia.format('YYYY-MM-DD');
    });
    
    if (tieneCitas) {
      dayCell.classList.add('has-citas');
    }

    // Click para navegar a esa semana
    dayCell.addEventListener('click', () => {
      if (dia.day() !== 0 && dia.day() !== 6) { // Solo días laborables
        this.app.currentWeek = dia;
        this.app.render();
        this.render();
      }
    });

    grid.appendChild(dayCell);
  }

  prevMonth() {
    this.currentMonth = this.currentMonth.subtract(1, 'month');
    this.render();
  }

  nextMonth() {
    this.currentMonth = this.currentMonth.add(1, 'month');
    this.render();
  }
}

// Servicio de Estadísticas
class EstadisticasService {
  constructor(app) {
    this.app = app;
  }

  calcular() {
    const hoy = dayjs().format('YYYY-MM-DD');
    const diasSemana = this.app.diasLaborablesService.generarDiasLaborables(
      this.app.currentWeek,
      CONFIG.DIAS_LABORABLES
    );

    // Citas de hoy
    const citasHoy = this.app.citas.filter(c => {
      return dayjs.utc(c.start).local().format('YYYY-MM-DD') === hoy;
    }).length;

    // Citas de esta semana
    const fechasSemana = diasSemana.map(d => d.format('YYYY-MM-DD'));
    const citasSemana = this.app.citas.filter(c => {
      const fechaCita = dayjs.utc(c.start).local().format('YYYY-MM-DD');
      return fechasSemana.includes(fechaCita);
    }).length;

    // Ocupación (slots ocupados vs disponibles)
    const horariosService = new HorarioService();
    const slotsDisponibles = horariosService.generar().length * diasSemana.length;
    const ocupacion = slotsDisponibles > 0 
      ? Math.round((citasSemana / slotsDisponibles) * 100) 
      : 0;

    // Servicio más solicitado
    const servicios = {};
    this.app.citas.forEach(c => {
      if (c.service) {
        servicios[c.service] = (servicios[c.service] || 0) + 1;
      }
    });

    const servicioTop = Object.entries(servicios)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return {
      citasHoy,
      citasSemana,
      ocupacion,
      servicioTop
    };
  }

  render() {
    const stats = this.calcular();

    const elementos = {
      statToday: document.getElementById('statToday'),
      statWeek: document.getElementById('statWeek'),
      statOccupancy: document.getElementById('statOccupancy'),
      statService: document.getElementById('statService')
    };

    if (elementos.statToday) elementos.statToday.textContent = stats.citasHoy;
    if (elementos.statWeek) elementos.statWeek.textContent = stats.citasSemana;
    
    if (elementos.statOccupancy) {
      elementos.statOccupancy.textContent = `${stats.ocupacion}%`;
      elementos.statOccupancy.className = 'stat-badge';
      if (stats.ocupacion >= 80) {
        elementos.statOccupancy.classList.add('error');
      } else if (stats.ocupacion >= 50) {
        elementos.statOccupancy.classList.add('warning');
      } else {
        elementos.statOccupancy.classList.add('success');
      }
    }

    if (elementos.statService) {
      elementos.statService.textContent = stats.servicioTop;
    }
  }
}

/****************************************
 * APLICACIÓN PRINCIPAL
 ****************************************/
class CalendarioApp {
  constructor() {
    // Iniciar desde hoy, ajustado a día laborable
    this.diasLaborablesService = new DiasLaborablesService();
    this.currentWeek = this.diasLaborablesService.obtenerSiguienteDiaLaborable(dayjs().startOf('day'));
    this.citas = [];
    this.draggedCita = null;
    
    // Servicios
    this.api = new ApiService();
    this.storage = new StorageService();
    this.ui = new UIService();
    this.horarioService = new HorarioService();
    this.miniCalendar = new MiniCalendarioService(this);
    this.estadisticas = new EstadisticasService(this);
    
    // Detectar y aplicar clases de dispositivo
    this.deviceInfo = DeviceDetectionService.applyDeviceClasses();
    
    // Auto-refresh interval
    this.refreshInterval = null;
    
    this.init();
  }

  async init() {
    await this.verificarActualizaciones();
    this.startAutoRefresh();
    this.setupOrientationListener();
  }

  setupOrientationListener() {
    let currentWidth = window.innerWidth;
    
    // Detectar cambios de orientación/tamaño
    window.addEventListener('resize', () => {
      const newWidth = window.innerWidth;
      const wasDesktop = currentWidth > 768;
      const isDesktop = newWidth > 768;
      
      // Re-renderizar solo si cambió entre móvil ↔ desktop
      if (wasDesktop !== isDesktop) {
        console.log('Cambio de orientación detectado, re-renderizando...');
        this.render();
      }
      
      currentWidth = newWidth;
    });
  }

  startAutoRefresh() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      this.verificarActualizaciones();
    }, CONFIG.AUTO_REFRESH_INTERVAL);
  }

  async verificarActualizaciones() {
    try {
      console.log('Cargando citas desde API');
      await this.cargarCitas();
      this.ui.setLastUpdate(`✓ Sincronizado - ${dayjs().format('HH:mm:ss')}`);
    } catch(e) {
      console.error('Error verificando actualizaciones:', e);
      this.ui.setLastUpdate('⚠️ Error al sincronizar');
    }
  }

  async cargarCitas() {
    try {
      console.log('Cargando citas desde API');
      const citas = await this.api.getCitas();
      
      // Validar que sea un array
      this.citas = Array.isArray(citas) ? citas : [];
      
      console.log('Citas cargadas:', this.citas.length);
      console.log('Primera cita (si existe):', this.citas[0]);
      
      this.ui.setLastUpdate(`Última actualización: ${dayjs().format('HH:mm:ss')}`);
      this.render();
    } catch(e) {
      console.error('Error cargando citas:', e);
      this.citas = [];
      this.ui.setLastUpdate('❌ Error al cargar');
      this.ui.showError('Error al cargar las citas');
      this.render();
    }
  }

  async manualRefresh() {
    this.ui.setRefreshLoading(true);
    await this.verificarActualizaciones();
    this.ui.setRefreshLoading(false);
  }

  render() {
    // Generar días laborables
    const diasLaborables = this.diasLaborablesService.generarDiasLaborables(
      this.currentWeek, 
      CONFIG.DIAS_LABORABLES
    );
    
    const primerDia = diasLaborables[0];
    const ultimoDia = diasLaborables[diasLaborables.length - 1];
    
    this.ui.setTitle(`${primerDia.format('D MMM YYYY')} - ${ultimoDia.format('D MMM YYYY')}`);
    
    const grid = document.getElementById('week');
    grid.innerHTML = '';

    // Detectar si es móvil
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Renderizado vertical para móvil
      this.renderMobile(grid, diasLaborables);
    } else {
      // Renderizado horizontal para tablet/desktop
      this.renderDesktop(grid, diasLaborables);
    }

    // Actualizar mini calendario y estadísticas (solo en desktop)
    if (window.innerWidth >= 1200) {
      this.miniCalendar.render();
      this.estadisticas.render();
    }
  }

  renderDesktop(grid, diasLaborables) {
    const hoy = dayjs().format('YYYY-MM-DD');
    
    // Cabecera vacía para columna de horas
    grid.appendChild(document.createElement('div'));
    
    // Cabeceras de días
    diasLaborables.forEach(day => {
      const h = document.createElement('div');
      h.className = 'cell day-header';
      if (day.format('YYYY-MM-DD') === hoy) {
        h.classList.add('today');
      }
      h.innerText = day.format('ddd D');
      grid.appendChild(h);
    });

    // Generar horarios y celdas
    this.horarioService.generar().forEach(hora => {
      const timeCell = document.createElement('div');
      timeCell.className = 'cell time';
      timeCell.innerText = hora;
      grid.appendChild(timeCell);

      diasLaborables.forEach(day => {
        const fecha = day.format('YYYY-MM-DD');
        const fechaHoraSlot = `${fecha} ${hora}`;
        
        const cita = this.citas.find(c => {
          if (!c.start) return false;
          // Parsear la fecha UTC y convertirla a hora local para comparar
          const citaFechaHora = dayjs.utc(c.start).local().format('YYYY-MM-DD HH:mm');
          return citaFechaHora === fechaHoraSlot;
        });

        const cell = this.createCell(fecha, hora, cita);
        grid.appendChild(cell);
      });
    });
  }

  renderMobile(grid, diasLaborables) {
    const hoy = dayjs().format('YYYY-MM-DD');
    
    // Para cada día, crear un bloque vertical
    diasLaborables.forEach(day => {
      const fecha = day.format('YYYY-MM-DD');
      
      // Cabecera del día
      const dayHeader = document.createElement('div');
      dayHeader.className = 'cell day-header';
      if (fecha === hoy) {
        dayHeader.classList.add('today');
      }
      dayHeader.innerText = day.format('dddd D [de] MMMM');
      grid.appendChild(dayHeader);

      // Horarios de este día
      this.horarioService.generar().forEach(hora => {
        const fechaHoraSlot = `${fecha} ${hora}`;
        
        // Celda de hora
        const timeCell = document.createElement('div');
        timeCell.className = 'cell time';
        timeCell.innerText = hora;
        grid.appendChild(timeCell);

        // Celda de cita
        const cita = this.citas.find(c => {
          if (!c.start) return false;
          const citaFechaHora = dayjs(c.start).format('YYYY-MM-DD HH:mm');
          return citaFechaHora === fechaHoraSlot;
        });

        const cell = this.createCell(fecha, hora, cita);
        grid.appendChild(cell);
      });
    });
  }

  createCell(fecha, hora, cita) {
    const cell = document.createElement('div');
    const isLocal = cita?.isLocal || false;
    
    if (cita) {
      cell.className = 'cell ' + (isLocal ? 'busy-local' : 'busy');
    } else {
      cell.className = 'cell free';
    }
    
    cell.dataset.slot = `${fecha} ${hora}`;

    if (cita) {
      this.setupBusyCell(cell, cita, hora);
    } else {
      this.setupFreeCell(cell, fecha, hora);
    }

    return cell;
  }

  setupBusyCell(cell, cita, hora) {
    cell.draggable = true;
    cell.innerHTML = `
      <strong>${cita.name}</strong>
      <span>${cita.service}</span>
      ${cita.modelo ? `<span>${cita.modelo}</span>` : ''}
      ${cita.matricula ? `<span>${cita.matricula}</span>` : ''}
    `;
    
    cell.ondragstart = () => {
      this.draggedCita = cita;
      cell.classList.add('dragging');
    };
    
    cell.ondragend = () => {
      this.draggedCita = null;
      cell.classList.remove('dragging');
    };
    
    cell.onclick = () => this.mostrarDetalleCita(cita, hora);
  }

  setupFreeCell(cell, fecha, hora) {
    // Mostrar hora en la celda
    const timeLabel = document.createElement('span');
    timeLabel.className = 'time-label';
    timeLabel.textContent = hora;
    cell.appendChild(timeLabel);
    
    cell.ondragover = (e) => {
      e.preventDefault();
      cell.classList.add('drop-target');
    };
    
    cell.ondragleave = () => {
      cell.classList.remove('drop-target');
    };
    
    cell.ondrop = async () => {
      cell.classList.remove('drop-target');
      if (this.draggedCita) {
        const nuevaFechaHora = dayjs(cell.dataset.slot);
        const nuevaEndTime = nuevaFechaHora.add(CONFIG.DURACION_CITA, 'minute');
        
        try {
          // Actualizar en la API
          const response = await this.api.actualizarCita(this.draggedCita.id, {
            startTime: nuevaFechaHora.toISOString(),
            endTime: nuevaEndTime.toISOString()
          });
          
          if (response.ok) {
            // Actualizar localmente
            this.draggedCita.start = nuevaFechaHora.toISOString();
            this.draggedCita.end = nuevaEndTime.toISOString();
            this.render();
          } else {
            console.error('Error al actualizar la cita');
            alert('Error al mover la cita');
          }
        } catch (error) {
          console.error('Error moviendo cita:', error);
          alert('Error al mover la cita');
        }
      }
    };
    
    cell.onclick = () => this.abrirFormularioAgendamiento(fecha, hora);
  }

  mostrarDetalleCita(cita, hora) {
    const botonEliminar = `
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border-color);">
        <button class="btn-secondary" onclick="app.eliminarCita('${cita.id}')" style="background:#fce8e6;color:#c5221f;border-color:#c5221f;width:100%;">
          <svg viewBox="0 0 24 24" width="18" height="18" style="display:inline-block;vertical-align:middle;margin-right:4px;">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          Eliminar cita
        </button>
      </div>
    `;
    
    const html = `
      <h3>${hora} - ${dayjs.utc(cita.start).local().format('dddd')}</h3>
      <p><b>Nombre:</b> ${cita.name}</p>
      <p><b>Teléfono:</b> <a href="tel:${cita.phone}" style="color: var(--primary-color); text-decoration: none; font-weight: 500;">${cita.phone}</a></p>
      ${cita.email ? `<p><b>Email:</b> ${cita.email}</p>` : ''}
      <p><b>Servicio:</b> ${cita.service}</p>
      ${cita.modelo ? `<p><b>Modelo:</b> ${cita.modelo}</p>` : ''}
      ${cita.matricula ? `<p><b>Matrícula:</b> ${cita.matricula}</p>` : ''}
      ${cita.notes ? `<p><b>Notas:</b> ${cita.notes}</p>` : ''}
      ${botonEliminar}
    `;
    this.ui.showModal(html);
  }

  async eliminarCita(citaId) {
    if (confirm('¿Eliminar esta cita?')) {
      try {
        const response = await this.api.eliminarCita(citaId);
        if (response.ok) {
          this.closeModal();
          await this.cargarCitas();
        } else {
          alert('Error al eliminar la cita');
        }
      } catch (error) {
        console.error('Error eliminando cita:', error);
        alert('Error al eliminar la cita');
      }
    }
  }

  abrirFormularioAgendamiento(fecha, hora) {
    const fechaHora = dayjs(`${fecha} ${hora}`);
    const formulario = `
      <h3>Agendar Cita</h3>
      <p style="color:#5f6368; margin-bottom:20px;">
        ${fechaHora.format('dddd, D [de] MMMM YYYY - HH:mm')}
      </p>
      
      <div id="mensajes"></div>
      
      <form id="formAgendamiento" onsubmit="app.enviarAgendamiento(event, '${fecha}', '${hora}')">
        <div class="form-group">
          <label for="nombre">Nombre completo *</label>
          <input type="text" id="nombre" name="nombre" required autofocus>
        </div>
        
        <div class="form-group">
          <label for="telefono">Teléfono *</label>
          <div style="display:flex;gap:8px;">
            <select id="prefijo" name="prefijo" style="width:140px;padding:12px 8px;border:1px solid var(--border-color);border-radius:4px;font-size:14px;font-family:'Roboto',sans-serif;color:var(--text-primary);background:var(--surface);">
              <option value="+34" selected>🇪🇸 España +34</option>
              <option value="+33">🇫🇷 Francia +33</option>
              <option value="+49">🇩🇪 Alemania +49</option>
              <option value="+39">🇮🇹 Italia +39</option>
              <option value="+351">🇵🇹 Portugal +351</option>
              <option value="+44">🇬🇧 Reino Unido +44</option>
              <option value="+32">🇧🇪 Bélgica +32</option>
              <option value="+31">🇳🇱 Holanda +31</option>
              <option value="+41">🇨🇭 Suiza +41</option>
              <option value="+43">🇦🇹 Austria +43</option>
              <option value="+353">🇮🇪 Irlanda +353</option>
              <option value="+48">🇵🇱 Polonia +48</option>
              <option value="+420">🇨🇿 Chequia +420</option>
              <option value="+30">🇬🇷 Grecia +30</option>
              <option value="+46">🇸🇪 Suecia +46</option>
              <option value="+47">🇳🇴 Noruega +47</option>
              <option value="+45">🇩🇰 Dinamarca +45</option>
              <option value="+358">🇫🇮 Finlandia +358</option>
              <option value="+40">🇷🇴 Rumania +40</option>
              <option value="+359">🇧🇬 Bulgaria +359</option>
              <option value="+1">🇺🇸 USA/Canadá +1</option>
              <option value="+52">🇲🇽 México +52</option>
              <option value="+54">🇦🇷 Argentina +54</option>
              <option value="+55">🇧🇷 Brasil +55</option>
              <option value="+56">🇨🇱 Chile +56</option>
              <option value="+57">🇨🇴 Colombia +57</option>
              <option value="+58">🇻🇪 Venezuela +58</option>
              <option value="+51">🇵🇪 Perú +51</option>
              <option value="+593">🇪🇨 Ecuador +593</option>
              <option value="+598">🇺🇾 Uruguay +598</option>
              <option value="+212">🇲🇦 Marruecos +212</option>
              <option value="+213">🇩🇿 Argelia +213</option>
              <option value="+86">🇨🇳 China +86</option>
              <option value="+81">🇯🇵 Japón +81</option>
              <option value="+82">🇰🇷 Corea Sur +82</option>
              <option value="+91">🇮🇳 India +91</option>
            </select>
            <input type="tel" id="telefono" name="telefono" required placeholder="600 123 456" inputmode="tel" style="flex:1;">
          </div>
          <small style="color:var(--text-secondary);font-size:12px;margin-top:4px;display:block;">Introduce solo el número sin prefijo</small>
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" placeholder="cliente@ejemplo.com">
        </div>
        
        <div class="form-group">
          <label>Servicio *</label>
          <div class="checkbox-group">
            <div class="checkbox-item">
              <input type="checkbox" id="servicio-neumaticos" name="servicio" value="Neumáticos">
              <label for="servicio-neumaticos">Neumáticos</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="servicio-alineacion" name="servicio" value="Alineación">
              <label for="servicio-alineacion">Alineación</label>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="matricula">Matrícula</label>
          <input type="text" id="matricula" name="matricula" placeholder="1234ABC">
        </div>
        
        <div class="form-group">
          <label for="modelo">Modelo del vehículo</label>
          <input type="text" id="modelo" name="modelo" placeholder="Ej: Seat León">
        </div>
        
        <div class="form-group">
          <label for="notes">Notas adicionales</label>
          <textarea id="notes" name="notes" placeholder="Información adicional sobre la cita..."></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="app.closeModal()">Cancelar</button>
          <button type="submit" class="btn-primary" id="btnSubmit">Agendar Cita</button>
        </div>
      </form>
    `;
    
    this.ui.showModal(formulario);
  }

  async enviarAgendamiento(event, fecha, hora) {
    event.preventDefault();
    
    const btnSubmit = document.getElementById('btnSubmit');
    const mensajes = document.getElementById('mensajes');
    
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Agendando...';
    mensajes.innerHTML = '';
    
    try {
      // Obtener servicios
      const servicios = [];
      if (document.getElementById('servicio-neumaticos').checked) {
        servicios.push('Neumáticos');
      }
      if (document.getElementById('servicio-alineacion').checked) {
        servicios.push('Alineación');
      }
      
      if (servicios.length === 0) {
        mensajes.innerHTML = '<div class="error-message" style="display:block;">Por favor, selecciona al menos un servicio.</div>';
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Agendar Cita';
        return;
      }
      
      // Combinar prefijo + teléfono
      const prefijo = document.getElementById('prefijo').value;
      const numeroTelefono = document.getElementById('telefono').value.trim().replace(/\s/g, '');
      const telefonoCompleto = `${prefijo}${numeroTelefono}`;
      
      const fechaHora = dayjs(`${fecha} ${hora}`);
      const endTime = fechaHora.add(CONFIG.DURACION_CITA, 'minute');
      
      const datos = {
        start: fechaHora.toISOString(),
        end: endTime.toISOString(),
        name: document.getElementById('nombre').value.trim(),
        phone: telefonoCompleto,
        email: document.getElementById('email')?.value.trim() || '',
        service: servicios.join(', '),
        matricula: document.getElementById('matricula').value.trim() || '',
        modelo: document.getElementById('modelo').value.trim() || '',
        notes: document.getElementById('notes').value.trim() || ''
      };
      
      console.log('Datos a enviar:', datos);
      
      // Enviar a la API unificada
      const response = await this.api.agendarCita(datos);
      
      if (response.ok) {
        mensajes.innerHTML = '<div class="success-message" style="display:block;">✓ Cita agendada correctamente</div>';
        setTimeout(async () => {
          this.closeModal();
          await this.cargarCitas();
        }, 1500);
      } else {
        const errorData = await response.text();
        console.error('Error del servidor:', errorData);
        throw new Error(errorData || 'Error al agendar la cita');
      }
    } catch (error) {
      console.error('Error completo:', error);
      const mensajeError = error.message || 'Error al agendar la cita. Por favor, intenta de nuevo.';
      mensajes.innerHTML = `<div class="error-message" style="display:block;">${mensajeError}</div>`;
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Agendar Cita';
    }
  }

  changeWeek(offset) {
    // Calcular nueva fecha
    let nuevaFecha = this.currentWeek.add(offset * CONFIG.DIAS_LABORABLES, 'day');
    // Ajustar a día laborable si cae en fin de semana
    this.currentWeek = this.diasLaborablesService.obtenerSiguienteDiaLaborable(nuevaFecha);
    this.render();
  }

  closeModal() {
    this.ui.closeModal();
  }
}

// Inicializar aplicación
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new CalendarioApp();
});

// Service Worker para PWA (solo en servidor, no en file://)
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✓ Service Worker registrado:', registration.scope);
      })
      .catch(error => {
        console.log('✗ Error al registrar Service Worker:', error);
      });
  });
}
