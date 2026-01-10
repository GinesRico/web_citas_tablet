/****************************************
 * CONFIGURACIÓN
 * La configuración ahora se carga desde js/config.js
 * que lee variables de entorno de Vercel
 ****************************************/

/****************************************
 * APLICACIÓN DE RESERVAS PÚBLICAS
 ****************************************/
class ReservasPublicas {
  constructor() {
    // Iniciar desde mañana (no permitir reservar hoy ni días anteriores)
    const hoy = dayjs().startOf('day');
    const maniana = hoy.add(1, 'day');
    
    // Calcular el lunes de la semana de mañana (puede ser antes de hoy)
    const diaSemana = maniana.day(); // 0=domingo, 1=lunes, etc
    
    if (diaSemana === 0) {
      // Si mañana es domingo, ir al lunes siguiente
      this.fechaInicio = maniana.add(1, 'day');
    } else if (diaSemana === 6) {
      // Si mañana es sábado, ir al lunes siguiente (2 días)
      this.fechaInicio = maniana.add(2, 'day');
    } else if (diaSemana === 1) {
      // Si mañana es lunes, empezar desde ese lunes
      this.fechaInicio = maniana;
    } else {
      // Si mañana es martes-viernes, retroceder al lunes de esa misma semana
      this.fechaInicio = maniana.subtract(diaSemana - 1, 'day');
    }
    
    this.slotSeleccionado = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.actualizarRangoSemana();
    await this.cargarSlotsDisponibles();
  }

  setupEventListeners() {
    document.getElementById('btnSemanaAnterior').addEventListener('click', () => {
      this.cambiarSemana(-1);
    });

    document.getElementById('btnSemanaSiguiente').addEventListener('click', () => {
      this.cambiarSemana(1);
    });

    // Cerrar modal al hacer clic fuera
    document.getElementById('modalReserva').addEventListener('click', (e) => {
      if (e.target.id === 'modalReserva') {
        this.cerrarModal();
      }
    });
  }

  cambiarSemana(direccion) {
    const nuevaFecha = this.fechaInicio.add(direccion, 'week');
    const hoy = dayjs().startOf('day');
    const maniana = hoy.add(1, 'day');
    const primerLunesValido = this.calcularPrimerLunesValido(maniana);
    
    // No permitir retroceder antes del primer lunes válido
    if (direccion < 0 && nuevaFecha.isBefore(primerLunesValido, 'day')) {
      return; // Bloquear navegación hacia atrás
    }
    
    this.fechaInicio = nuevaFecha;
    this.actualizarRangoSemana();
    this.actualizarBotones();
    this.cargarSlotsDisponibles();
  }

  actualizarRangoSemana() {
    const fechaFin = this.fechaInicio.add(6, 'day');
    const rangoTexto = `${this.fechaInicio.format('D MMM')} - ${fechaFin.format('D MMM YYYY')}`;
    document.getElementById('rangoSemana').textContent = rangoTexto;
    this.actualizarBotones();
  }

  actualizarBotones() {
    const hoy = dayjs().startOf('day');
    const maniana = hoy.add(1, 'day');
    const btnAnterior = document.getElementById('btnSemanaAnterior');
    
    // Calcular la primera semana válida (que contiene mañana o es posterior)
    const primerLunesValido = this.calcularPrimerLunesValido(maniana);
    
    // Deshabilitar botón anterior si estamos en la primera semana válida
    if (this.fechaInicio.isSame(primerLunesValido, 'day') || this.fechaInicio.isBefore(primerLunesValido, 'day')) {
      btnAnterior.disabled = true;
      btnAnterior.style.opacity = '0.4';
      btnAnterior.style.cursor = 'not-allowed';
    } else {
      btnAnterior.disabled = false;
      btnAnterior.style.opacity = '1';
      btnAnterior.style.cursor = 'pointer';
    }
  }
  
  calcularPrimerLunesValido(maniana) {
    const diaSemana = maniana.day();
    
    if (diaSemana === 0) {
      return maniana.add(1, 'day');
    } else if (diaSemana === 6) {
      return maniana.add(2, 'day');
    } else if (diaSemana === 1) {
      return maniana;
    } else {
      // Retroceder al lunes de la misma semana de mañana
      return maniana.subtract(diaSemana - 1, 'day');
    }
  }

  async cargarSlotsDisponibles() {
    const container = document.getElementById('slotsContainer');
    container.innerHTML = '<div class="loading"><span class="material-icons spinning">refresh</span><p>Cargando horarios disponibles...</p></div>';

    try {
      const startDate = this.fechaInicio.format('YYYY-MM-DD');
      const endDate = this.fechaInicio.add(6, 'day').format('YYYY-MM-DD');
      
      // Construir parámetros igual que en SlotsView.js
      const horarios = CONFIG.HORARIOS.map(h => h.join('-')).join(',');
      const url = `${CONFIG.API_BASE_URL}/disponibles?startDate=${startDate}&endDate=${endDate}&duracion=${CONFIG.DURACION_CITA}&horarios=${horarios}&timezone=${CONFIG.TIMEZONE}`;
      
      const headers = { 'Content-Type': 'application/json' };
      if (CONFIG.API_KEY) {
        headers['X-API-Key'] = CONFIG.API_KEY;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Filtrar slots de días pasados (incluido hoy)
      const hoy = dayjs().startOf('day').format('YYYY-MM-DD');
      const todosLosSlots = data.disponibles || data.slots_disponibles || [];
      const slotsFuturos = todosLosSlots.filter(slot => {
        return slot.fecha > hoy; // Solo mostrar slots de mañana en adelante
      });
      
      this.mostrarSlots(slotsFuturos);
    } catch (error) {
      console.error('Error al cargar slots:', error);
      container.innerHTML = '<div class="error"><span class="material-icons">error</span><p>Error al cargar los horarios disponibles</p></div>';
    }
  }

  mostrarSlots(slots) {
    const container = document.getElementById('slotsContainer');
    
    if (!slots || slots.length === 0) {
      container.innerHTML = '<div class="no-slots"><span class="material-icons">event_busy</span><p>No hay horarios disponibles para esta semana</p></div>';
      return;
    }
    
    // Agrupar slots por fecha
    const slotsPorFecha = {};
    slots.forEach(slot => {
      const fecha = slot.fecha;
      if (!slotsPorFecha[fecha]) {
        slotsPorFecha[fecha] = [];
      }
      slotsPorFecha[fecha].push(slot);
    });

    // Generar días de la semana (Lunes a Viernes)
    const diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const dia = this.fechaInicio.add(i, 'day');
      // Solo días laborables (Lunes=1 a Viernes=5)
      if (dia.day() >= 1 && dia.day() <= 5) {
        diasSemana.push(dia);
      }
    }

    if (diasSemana.length === 0) {
      container.innerHTML = `
        <div class="sin-slots">
          <span class="material-icons">event_busy</span>
          <p>No hay horarios disponibles en esta semana</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    diasSemana.forEach(dia => {
      const fecha = dia.format('YYYY-MM-DD');
      const slotsDelDia = slotsPorFecha[fecha] || [];

      const diaDiv = document.createElement('div');
      diaDiv.className = 'dia-publico';

      // Header del día
      const header = document.createElement('div');
      header.className = 'dia-header-publico';
      header.textContent = dia.format('ddd D').toUpperCase();
      diaDiv.appendChild(header);

      // Lista de slots
      const slotsList = document.createElement('div');
      slotsList.className = 'slots-list-publico';

      if (slotsDelDia.length === 0) {
        slotsList.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:1rem;">Sin disponibilidad</p>';
      } else {
        // Ordenar por hora de inicio
        slotsDelDia.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
        
        slotsDelDia.forEach(slot => {
          // Convertir de UTC a hora local
          const horaLocal = dayjs.utc(slot.startTime).tz(CONFIG.TIMEZONE).format('HH:mm');
          
          const btn = document.createElement('button');
          btn.className = 'slot-btn-publico';
          btn.textContent = horaLocal;
          btn.onclick = () => this.seleccionarSlot(slot, dia);
          slotsList.appendChild(btn);
        });
      }

      diaDiv.appendChild(slotsList);
      container.appendChild(diaDiv);
    });
  }

  seleccionarSlot(slot, dia) {
    this.slotSeleccionado = slot;
    this.mostrarFormularioReserva(dia);
  }

  mostrarFormularioReserva(dia) {
    const startLocal = dayjs.utc(this.slotSeleccionado.startTime).tz(CONFIG.TIMEZONE);
    
    const formulario = `
      <p style="background:#e3f2fd;padding:0.75rem;border-radius:6px;margin-bottom:1.5rem;text-align:center;font-weight:500;font-size:0.9rem;line-height:1.8;">
        <span class="material-icons" style="vertical-align:middle;margin-right:4px;font-size:18px;">event</span>
        ${dia.format('dddd, D [de] MMMM YYYY')}
        <span style="margin:0 8px;">•</span>
        <span class="material-icons" style="vertical-align:middle;margin-right:4px;font-size:18px;">schedule</span>
        ${startLocal.format('HH:mm')}
      </p>

      <div id="mensajes"></div>

      <form id="formReserva" onsubmit="window.reservas.enviarReserva(event); return false;">
        <div class="form-group">
          <label for="nombre">Nombre completo *</label>
          <input type="text" id="nombre" required placeholder="Tu nombre">
        </div>

        <div class="form-group">
          <label>Teléfono *</label>
          <div class="phone-group">
            <select id="prefijo">
              <option value="+34" selected>ES +34</option>
              <option value="+33">FR +33</option>
              <option value="+351">PT +351</option>
              <option value="+44">UK +44</option>
              <option value="+1">US +1</option>
              <option value="+52">MX +52</option>
              <option value="+54">AR +54</option>
            </select>
            <input type="tel" id="telefono" required placeholder="600 123 456">
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="tu@email.com">
        </div>

        <div class="form-group">
          <label>Servicio *</label>
          <div class="checkbox-group">
            <div class="checkbox-item">
              <input type="checkbox" id="servicio-neumaticos" value="Neumáticos">
              <label for="servicio-neumaticos">Neumáticos</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="servicio-alineacion" value="Alineación">
              <label for="servicio-alineacion">Alineación</label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="matricula">Matrícula</label>
          <input type="text" id="matricula" placeholder="1234ABC">
        </div>

        <div class="form-group">
          <label for="modelo">Modelo del vehículo</label>
          <input type="text" id="modelo" placeholder="Ej: Seat León">
        </div>

        <div class="form-group">
          <label for="notes">Notas adicionales</label>
          <textarea id="notes" rows="3" placeholder="Información adicional..."></textarea>
        </div>

        <button type="submit" id="btnSubmit" class="btn-primary">
          Confirmar Reserva
        </button>
      </form>
    `;

    document.getElementById('modalBody').innerHTML = formulario;
    document.getElementById('modalReserva').classList.add('active');
  }

  cerrarModal() {
    document.getElementById('modalReserva').classList.remove('active');
    this.slotSeleccionado = null;
  }

  async enviarReserva(event) {
    event.preventDefault();

    const btnSubmit = document.getElementById('btnSubmit');
    const mensajes = document.getElementById('mensajes');
    
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviando...';
    mensajes.innerHTML = '';

    try {
      // Validar servicios
      const servicios = [];
      if (document.getElementById('servicio-neumaticos').checked) {
        servicios.push('Neumáticos');
      }
      if (document.getElementById('servicio-alineacion').checked) {
        servicios.push('Alineación');
      }

      if (servicios.length === 0) {
        throw new Error('Por favor, selecciona al menos un servicio');
      }

      // Construir teléfono completo
      const prefijo = document.getElementById('prefijo').value;
      const numeroTelefono = document.getElementById('telefono').value.trim().replace(/\s/g, '');
      const telefonoCompleto = `${prefijo}${numeroTelefono}`;

      const startLocal = dayjs.utc(this.slotSeleccionado.startTime).tz(CONFIG.TIMEZONE);
      const endLocal = startLocal.add(CONFIG.DURACION_CITA, 'minute');

      const datos = {
        start: startLocal.toISOString(),
        end: endLocal.toISOString(),
        name: document.getElementById('nombre').value.trim(),
        phone: telefonoCompleto,
        email: document.getElementById('email').value.trim() || '',
        service: servicios.join(', '),
        matricula: document.getElementById('matricula').value.trim() || '',
        modelo: document.getElementById('modelo').value.trim() || '',
        notes: document.getElementById('notes').value.trim() || ''
      };

      const headers = { 'Content-Type': 'application/json' };
      if (CONFIG.API_KEY) {
        headers['X-API-Key'] = CONFIG.API_KEY;
      }

      const response = await fetch(`${CONFIG.API_BASE_URL}/citas`, {
        method: 'POST',
        headers,
        body: JSON.stringify(datos)
      });

      if (response.ok) {
        mensajes.innerHTML = '<div class="mensaje mensaje-exito"><span class="material-icons" style="vertical-align:middle;margin-right:8px;">check_circle</span>¡Reserva confirmada! Te enviaremos un recordatorio por SMS.</div>';
        setTimeout(() => {
          this.cerrarModal();
          this.cargarSlotsDisponibles();
        }, 2500);
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Error al realizar la reserva');
      }
    } catch (error) {
      console.error('Error:', error);
      mensajes.innerHTML = `<div class="mensaje mensaje-error">${error.message}</div>`;
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Confirmar Reserva';
    }
  }
}

// Función global para cerrar modal
function cerrarModal() {
  if (window.reservas) {
    window.reservas.cerrarModal();
  }
}
