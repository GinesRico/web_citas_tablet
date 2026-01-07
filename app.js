/****************************************
 * CONFIGURACIÓN
 ****************************************/
const CONFIG = {
  WEBHOOK_URL: 'https://webhook.arvera.es/webhook/citas',
  CHECK_UPDATE_URL: 'https://webhook.arvera.es/webhook/check-update',
  AGENDAR_URL: 'https://webhook.arvera.es/webhook/agendar',
  LOCALES_URL: 'https://webhook.arvera.es/webhook/locales',
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

  async getCitas() {
    const res = await this.fetch(CONFIG.WEBHOOK_URL);
    return await res.json();
  }

  async checkUpdate() {
    const res = await this.fetch(CONFIG.CHECK_UPDATE_URL);
    if (!res.ok) throw new Error('Error al verificar actualizaciones');
    return await res.json();
  }

  async agendarCita(datos) {
    const res = await this.fetch(CONFIG.AGENDAR_URL, {
      method: 'POST',
      body: JSON.stringify(datos)
    });
    return res;
  }

  async getCitasLocales() {
    try {
      const res = await this.fetch(CONFIG.LOCALES_URL);
      if (!res.ok) {
        console.log('Webhook locales no disponible (esperado si no está configurado)');
        return [];
      }
      const data = await res.json();
      
      // Si es un objeto único, convertirlo a array
      let citasArray = [];
      if (Array.isArray(data)) {
        citasArray = data;
        console.log(`Webhook devolvió array con ${data.length} cita(s)`);
      } else if (data && typeof data === 'object') {
        // Es un objeto único, envolverlo en array
        citasArray = [data];
        console.log('Webhook devolvió objeto único, convertido a array');
      } else {
        console.warn('Webhook locales devolvió formato inesperado:', data);
        return [];
      }
      
      // Normalizar campos (telefono → phone, servicio → service, etc.)
      const citasNormalizadas = citasArray.map(cita => ({
        id: cita.id,
        start: cita.start,
        end: cita.end,
        name: cita.name,
        phone: String(cita.phone || cita.telefono || ''),
        service: cita.service || cita.servicio || '',
        matricula: cita.matricula || '',
        modelo: cita.modelo || '',
        notes: cita.notes || ''
      }));
      
      console.log(`✓ Citas locales normalizadas: ${citasNormalizadas.length}`, citasNormalizadas.map(c => ({
        name: c.name,
        start: c.start,
        phone: c.phone
      })));
      
      return citasNormalizadas;
      
    } catch (error) {
      console.log('Error obteniendo citas locales (esperado si webhook no existe):', error.message);
      return [];
    }
  }

  async agendarCitaLocal(datos) {
    const res = await this.fetch(CONFIG.LOCALES_URL, {
      method: 'POST',
      body: JSON.stringify(datos)
    });
    return res;
  }

  async eliminarCitaLocal(citaId) {
    const res = await this.fetch(`${CONFIG.LOCALES_URL}/${citaId}`, {
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
    
    // Auto-refresh interval
    this.refreshInterval = null;
    
    this.init();
  }

  async init() {
    await this.verificarActualizaciones();
    this.startAutoRefresh();
  }

  startAutoRefresh() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      this.verificarActualizaciones();
    }, CONFIG.AUTO_REFRESH_INTERVAL);
  }

  async verificarActualizaciones() {
    try {
      const data = await this.api.checkUpdate();
      const updatedAt = data.updatedAt;
      const lastUpdate = this.storage.get('lastUpdate');
      const citasYaCargadas = this.citas.length > 0;
      
      console.log('Verificando actualizaciones:', { 
        nuevo: updatedAt, 
        anterior: lastUpdate,
        hayDiferencia: updatedAt !== lastUpdate,
        citasEnMemoria: this.citas.length
      });
      
      if (!lastUpdate || !citasYaCargadas) {
        console.log('Primera carga - cargando citas');
        this.storage.set('lastUpdate', updatedAt);
        await this.cargarCitas();
      } else if (updatedAt && updatedAt !== lastUpdate) {
        console.log('Cambios detectados - guardando y recargando');
        this.storage.set('lastUpdate', updatedAt);
        setTimeout(() => location.reload(true), 100);
      } else {
        console.log('No hay cambios');
        this.ui.setLastUpdate(`✓ Sincronizado - ${dayjs().format('HH:mm:ss')}`);
      }
    } catch(e) {
      console.error('Error verificando actualizaciones:', e);
      await this.cargarCitas();
    }
  }

  async cargarCitas() {
    try {
      console.log('Cargando citas desde API');
      const [citasAPI, citasLocalesRaw] = await Promise.all([
        this.api.getCitas(),
        this.api.getCitasLocales()
      ]);
      
      // Validar que citasAPI sea un array
      const citasAPIArray = Array.isArray(citasAPI) ? citasAPI : [];
      
      // Validar que citasLocales sea un array
      const citasLocalesArray = Array.isArray(citasLocalesRaw) ? citasLocalesRaw : [];
      
      console.log('Debug - Tipos recibidos:', {
        citasAPI: typeof citasAPI,
        isArrayAPI: Array.isArray(citasAPI),
        citasLocales: typeof citasLocalesRaw,
        isArrayLocales: Array.isArray(citasLocalesRaw)
      });
      
      // Marcar citas locales
      const citasLocalesMarked = citasLocalesArray.map(c => ({ ...c, isLocal: true }));
      
      // Mezclar citas del API con citas locales
      this.citas = [...citasAPIArray, ...citasLocalesMarked];
      
      console.log('Citas cargadas:', {
        api: citasAPIArray.length,
        locales: citasLocalesArray.length,
        total: this.citas.length
      });
      
      this.ui.setLastUpdate(`Última actualización: ${dayjs().format('HH:mm:ss')}`);
      this.render();
    } catch(e) {
      console.error('Error cargando citas:', e);
      // Intentar cargar solo citas locales en caso de error
      try {
        const citasLocalesRaw = await this.api.getCitasLocales();
        const citasLocalesArray = Array.isArray(citasLocalesRaw) ? citasLocalesRaw : [];
        this.citas = citasLocalesArray.map(c => ({ ...c, isLocal: true }));
        this.ui.setLastUpdate('⚠️ Modo local');
        this.render();
      } catch (err) {
        console.error('Error en fallback:', err);
        this.citas = [];
        this.ui.setLastUpdate('❌ Error al cargar');
        this.ui.showError('Error al cargar las citas');
        this.render();
      }
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

    // Cabecera vacía para columna de horas
    grid.appendChild(document.createElement('div'));
    
    // Cabeceras de días
    const hoy = dayjs().format('YYYY-MM-DD');
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
        
        // Buscar cita que coincida con esta fecha y hora
        const cita = this.citas.find(c => {
          if (!c.start) return false;
          // Convertir c.start (ISO) a formato comparable
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
    
    cell.ondrop = () => {
      cell.classList.remove('drop-target');
      if (this.draggedCita) {
        this.draggedCita.start = cell.dataset.slot;
        this.render();
      }
    };
    
    cell.onclick = () => this.abrirFormularioAgendamiento(fecha, hora);
  }

  mostrarDetalleCita(cita, hora) {
    const esLocal = cita.isLocal || false;
    const badgeLocal = esLocal ? '<span style="background:#f9ab00;color:white;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:500;margin-left:8px;">LOCAL</span>' : '';
    const botonEliminar = esLocal ? `
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border-color);">
        <button class="btn-secondary" onclick="app.eliminarCitaLocal('${cita.id}')" style="background:#fce8e6;color:#c5221f;border-color:#c5221f;width:100%;">
          <svg viewBox="0 0 24 24" width="18" height="18" style="display:inline-block;vertical-align:middle;margin-right:4px;">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          Eliminar cita local
        </button>
      </div>
    ` : '';
    
    const html = `
      <h3>${hora} - ${dayjs(cita.start).format('dddd')}${badgeLocal}</h3>
      <p><b>Nombre:</b> ${cita.name}</p>
      <p><b>Teléfono:</b> <a href="tel:${cita.phone}" style="color: var(--primary-color); text-decoration: none; font-weight: 500;">${cita.phone}</a></p>
      <p><b>Servicio:</b> ${cita.service}</p>
      ${cita.modelo ? `<p><b>Modelo:</b> ${cita.modelo}</p>` : ''}
      ${cita.matricula ? `<p><b>Matrícula:</b> ${cita.matricula}</p>` : ''}
      ${cita.notes ? `<p><b>Notas:</b> ${cita.notes}</p>` : ''}
      ${botonEliminar}
    `;
    this.ui.showModal(html);
  }

  async eliminarCitaLocal(citaId) {
    if (confirm('¿Eliminar esta cita local?')) {
      try {
        const response = await this.api.eliminarCitaLocal(citaId);
        if (response.ok) {
          this.closeModal();
          await this.cargarCitas();
        } else {
          alert('Error al eliminar la cita');
        }
      } catch (error) {
        console.error('Error eliminando cita local:', error);
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
            <select id="prefijo" name="prefijo" style="width:120px;padding:12px 8px;border:1px solid var(--border-color);border-radius:4px;font-size:14px;font-family:'Roboto',sans-serif;color:var(--text-primary);background:var(--surface);">
              <option value="+34" selected>🇪🇸 +34</option>
              <option value="+33">🇫🇷 +33</option>
              <option value="+49">🇩🇪 +49</option>
              <option value="+39">🇮🇹 +39</option>
              <option value="+351">🇵🇹 +351</option>
              <option value="+32">🇧🇪 +32</option>
              <option value="+31">🇳🇱 +31</option>
              <option value="+41">🇨🇭 +41</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+353">🇮🇪 +353</option>
              <option value="+48">🇵🇱 +48</option>
              <option value="+420">🇨🇿 +420</option>
            </select>
            <input type="tel" id="telefono" name="telefono" required placeholder="600 123 456" inputmode="tel" style="flex:1;">
          </div>
          <small style="color:var(--text-secondary);font-size:12px;margin-top:4px;display:block;">Introduce solo el número sin prefijo</small>
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
      const hoy = dayjs().format('YYYY-MM-DD');
      const fechaCita = fechaHora.format('YYYY-MM-DD');
      const esMismoDia = fechaCita === hoy;
      
      const datos = {
        start: fechaHora.toISOString(),
        end: endTime.toISOString(),
        name: document.getElementById('nombre').value.trim(),
        phone: telefonoCompleto,
        service: servicios.join(', '),
        matricula: document.getElementById('matricula').value.trim() || '',
        modelo: document.getElementById('modelo').value.trim() || '',
        notes: document.getElementById('notes').value.trim() || ''
      };
      
      console.log('Datos a enviar:', { ...datos, phone: telefonoCompleto });
      
      if (esMismoDia) {
        // Enviar al webhook de citas locales (sincronizado entre dispositivos)
        console.log('Guardando cita local en webhook (mismo día):', datos);
        const response = await this.api.agendarCitaLocal(datos);
        
        if (response.ok) {
          mensajes.innerHTML = '<div class="success-message" style="display:block;">✓ Cita agendada (mismo día - sincronizada)</div>';
          setTimeout(async () => {
            this.closeModal();
            await this.cargarCitas();
          }, 1500);
        } else {
          throw new Error('Error al guardar la cita local');
        }
      } else {
        // Enviar a Cal.com (fecha futura)
        console.log('Enviando a Cal.com (fecha futura):', datos);
        const datosAPI = {
          startTime: datos.start,
          endTime: datos.end,
          nombre: datos.name,
          telefono: datos.phone,
          servicio: datos.service,
          matricula: datos.matricula,
          modelo: datos.modelo,
          notes: datos.notes
        };
        
        const response = await this.api.agendarCita(datosAPI);
        
        if (response.ok) {
          mensajes.innerHTML = '<div class="success-message" style="display:block;">¡Cita agendada en Cal.com!</div>';
          setTimeout(async () => {
            this.closeModal();
            await this.verificarActualizaciones();
          }, 1500);
        } else {
          const errorData = await response.text();
          console.error('Error del servidor:', errorData);
          throw new Error(errorData || 'Error al agendar la cita');
        }
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

// Service Worker para PWA (opcional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // navigator.registerServiceWorker('/sw.js');
  });
}
