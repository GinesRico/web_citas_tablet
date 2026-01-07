/****************************************
 * CONFIGURACIÓN
 ****************************************/
const CONFIG = {
  WEBHOOK_URL: 'https://webhook.arvera.es/webhook/citas',
  CHECK_UPDATE_URL: 'https://webhook.arvera.es/webhook/check-update',
  AGENDAR_URL: 'https://webhook.arvera.es/webhook/agendar',
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
}

// Servicio de almacenamiento
class StorageService {
  get(key) {
    return sessionStorage.getItem(key);
  }

  set(key, value) {
    sessionStorage.setItem(key, value);
  }

  remove(key) {
    sessionStorage.removeItem(key);
  }

  clear() {
    sessionStorage.clear();
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
      this.citas = await this.api.getCitas();
      console.log('Citas cargadas:', this.citas.length);
      this.ui.setLastUpdate(`Última actualización: ${dayjs().format('HH:mm:ss')}`);
      this.render();
    } catch(e) {
      console.error('Error cargando citas:', e);
      this.ui.setLastUpdate('❌ Error al cargar');
      this.ui.showError('Error al cargar las citas');
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
        const cita = this.citas.find(c => c.start === `${fecha} ${hora}`);

        const cell = this.createCell(fecha, hora, cita);
        grid.appendChild(cell);
      });
    });
  }

  createCell(fecha, hora, cita) {
    const cell = document.createElement('div');
    cell.className = 'cell ' + (cita ? 'busy' : 'free');
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
    const html = `
      <h3>${hora} - ${dayjs(cita.start).format('dddd')}</h3>
      <p><b>Nombre:</b> ${cita.name}</p>
      <p><b>Teléfono:</b> <a href="tel:${cita.phone}" style="color: var(--primary-color); text-decoration: none; font-weight: 500;">${cita.phone}</a></p>
      <p><b>Servicio:</b> ${cita.service}</p>
      ${cita.modelo ? `<p><b>Modelo:</b> ${cita.modelo}</p>` : ''}
      ${cita.matricula ? `<p><b>Matrícula:</b> ${cita.matricula}</p>` : ''}
      ${cita.notes ? `<p><b>Notas:</b> ${cita.notes}</p>` : ''}
    `;
    this.ui.showModal(html);
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
          <input type="tel" id="telefono" name="telefono" required placeholder="+34 600 000 000" inputmode="tel">
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
      
      const fechaHora = dayjs(`${fecha} ${hora}`);
      const endTime = fechaHora.add(CONFIG.DURACION_CITA, 'minute');
      
      const datos = {
        startTime: fechaHora.toISOString(),
        endTime: endTime.toISOString(),
        nombre: document.getElementById('nombre').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        servicio: servicios.join(', '),
        matricula: document.getElementById('matricula').value.trim() || '',
        modelo: document.getElementById('modelo').value.trim() || '',
        notes: document.getElementById('notes').value.trim() || ''
      };
      
      console.log('Enviando datos:', datos);
      
      const response = await this.api.agendarCita(datos);
      
      if (response.ok) {
        mensajes.innerHTML = '<div class="success-message" style="display:block;">¡Cita agendada exitosamente!</div>';
        setTimeout(async () => {
          this.closeModal();
          await this.verificarActualizaciones();
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

// Service Worker para PWA (opcional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // navigator.registerServiceWorker('/sw.js');
  });
}
