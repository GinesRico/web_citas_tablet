/****************************************
 * APLICACIÓN DE RESERVAS PÚBLICAS
 * Diseño estilo Cal.com con calendario mensual
 ****************************************/
class ReservasPublicas {
  constructor() {
    // Configuración inicial
    this.currentMonth = dayjs().startOf('month');
    this.selectedDate = null;
    this.slotSeleccionado = null;
    this.slotsCache = {}; // Cache de slots por mes
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.renderCalendar();
    
    // Buscar el primer día con slots disponibles
    await this.seleccionarPrimerDiaDisponible();
  }

  /**
   * Busca y selecciona el primer día con slots disponibles
   */
  async seleccionarPrimerDiaDisponible() {
    // Asegurarse de que los slots del mes actual estén cargados
    await this.loadMonthSlots();
    
    const monthKey = this.currentMonth.format('YYYY-MM');
    const monthSlots = this.slotsCache[monthKey] || [];
    
    // Obtener el primer slot disponible desde mañana en adelante
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    const slotsDisponibles = monthSlots
      .filter(slot => dayjs(slot.fecha).isSameOrAfter(tomorrow, 'day'))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    
    if (slotsDisponibles.length > 0) {
      // Seleccionar el primer día con slots
      const primerDiaConSlots = dayjs(slotsDisponibles[0].fecha);
      
      // Si el primer día disponible está en otro mes, cambiar al mes correcto
      if (primerDiaConSlots.month() !== this.currentMonth.month()) {
        this.currentMonth = primerDiaConSlots.startOf('month');
        await this.renderCalendar();
      }
      
      this.selectDate(primerDiaConSlots);
    } else {
      // No hay slots en este mes, intentar con el siguiente
      this.currentMonth = this.currentMonth.add(1, 'month');
      await this.renderCalendar();
      await this.seleccionarPrimerDiaDisponible();
    }
  }

  setupEventListeners() {
    // Navegación del calendario
    document.getElementById('btnMesAnterior').addEventListener('click', () => {
      this.changeMonth(-1);
    });

    document.getElementById('btnMesSiguiente').addEventListener('click', () => {
      this.changeMonth(1);
    });

    // Cerrar modal
    document.getElementById('modalReserva').addEventListener('click', (e) => {
      if (e.target.id === 'modalReserva') {
        this.cerrarModal();
      }
    });
  }

  isWeekday(date) {
    const day = date.day();
    return day >= 1 && day <= 5; // Lunes a Viernes
  }

  changeMonth(direction) {
    const newMonth = this.currentMonth.add(direction, 'month');
    const today = dayjs().startOf('month');
    
    // No retroceder antes del mes actual
    if (direction < 0 && newMonth.isBefore(today, 'month')) {
      return;
    }
    
    this.currentMonth = newMonth;
    this.renderCalendar();
    this.updateMonthNavButtons();
  }

  updateMonthNavButtons() {
    const btnAnterior = document.getElementById('btnMesAnterior');
    const today = dayjs().startOf('month');
    
    if (this.currentMonth.isSame(today, 'month')) {
      btnAnterior.disabled = true;
    } else {
      btnAnterior.disabled = false;
    }
  }

  async renderCalendar() {
    // Actualizar título del mes
    document.getElementById('mesActual').textContent = this.currentMonth.format('MMMM YYYY');
    
    // Cargar slots del mes (si no están en cache)
    await this.loadMonthSlots();
    
    // Generar días del calendario
    const container = document.getElementById('calendarDays');
    container.innerHTML = '';
    
    // Primer día del mes y último
    const firstDay = this.currentMonth.startOf('month');
    const lastDay = this.currentMonth.endOf('month');
    
    // Calcular días a mostrar antes del 1 (del mes anterior)
    const startWeekday = firstDay.day(); // 0=domingo, 1=lunes, etc
    const daysBeforeStart = startWeekday === 0 ? 6 : startWeekday - 1; // Ajustar para que lunes sea el primero
    
    // Calcular días del mes anterior a mostrar
    const prevMonthStart = firstDay.subtract(daysBeforeStart, 'day');
    
    // Generar 42 días (6 semanas completas para consistencia visual)
    const today = dayjs().startOf('day');
    const tomorrow = today.add(1, 'day');
    
    for (let i = 0; i < 42; i++) {
      const date = prevMonthStart.add(i, 'day');
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = date.format('D');
      
      // Estilos condicionales
      const isCurrentMonth = date.month() === this.currentMonth.month();
      const isToday = date.isSame(today, 'day');
      const isSelected = this.selectedDate && date.isSame(this.selectedDate, 'day');
      const isPast = date.isBefore(tomorrow, 'day');
      const isWeekend = !this.isWeekday(date);
      const hasSlots = this.hasAvailableSlots(date);
      
      if (!isCurrentMonth) {
        dayElement.classList.add('other-month');
      }
      
      if (isToday) {
        dayElement.classList.add('today');
      }
      
      if (isSelected) {
        dayElement.classList.add('selected');
      }
      
      if (isPast || isWeekend || !isCurrentMonth) {
        dayElement.classList.add('disabled');
      }
      
      if (hasSlots && isCurrentMonth && !isPast && !isWeekend) {
        dayElement.classList.add('has-slots');
      }
      
      // Click handler
      if (!isPast && !isWeekend && isCurrentMonth) {
        dayElement.style.cursor = 'pointer';
        dayElement.addEventListener('click', () => {
          this.selectDate(date);
        });
      }
      
      container.appendChild(dayElement);
    }
    
    this.updateMonthNavButtons();
  }

  hasAvailableSlots(date) {
    const dateStr = date.format('YYYY-MM-DD');
    const monthKey = this.currentMonth.format('YYYY-MM');
    const monthSlots = this.slotsCache[monthKey] || [];
    
    return monthSlots.some(slot => slot.fecha === dateStr);
  }

  async loadMonthSlots() {
    const monthKey = this.currentMonth.format('YYYY-MM');
    
    // Si ya están en cache, no recargar
    if (this.slotsCache[monthKey]) {
      return;
    }
    
    try {
      const startDate = this.currentMonth.startOf('month').format('YYYY-MM-DD');
      const endDate = this.currentMonth.endOf('month').format('YYYY-MM-DD');
      
      const horarios = CONFIG.HORARIOS.map(h => h.join('-')).join(',');
      const url = `/api/proxy/disponibles?startDate=${startDate}&endDate=${endDate}&duracion=${CONFIG.DURACION_CITA}&horarios=${horarios}&timezone=${CONFIG.TIMEZONE}`;
      
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const slots = data.disponibles || data.slots_disponibles || [];
      
      // Filtrar solo slots desde mañana en adelante (no incluir hoy)
      const tomorrow = dayjs().add(1, 'day').startOf('day');
      this.slotsCache[monthKey] = slots.filter(slot => {
        const slotDate = dayjs(slot.fecha);
        return slotDate.isSameOrAfter(tomorrow, 'day');
      });
      
    } catch (error) {
      console.error('Error al cargar slots del mes:', error);
      this.slotsCache[monthKey] = [];
    }
  }

  selectDate(date) {
    this.selectedDate = date;
    
    // Actualizar visual del calendario
    document.querySelectorAll('.calendar-day').forEach(day => {
      day.classList.remove('selected');
    });
    
    // Actualizar título de slots
    document.getElementById('diaSeleccionado').textContent = date.format('ddd D');
    
    // Renderizar calendario completo para reflejar selección
    this.renderCalendar();
    
    // Cargar slots del día
    this.renderSlots();
  }

  renderSlots() {
    const container = document.getElementById('slotsContainer');
    
    if (!this.selectedDate) {
      container.innerHTML = '<div class="no-slots"><span class="material-icons">event</span><p>Selecciona un día en el calendario</p></div>';
      return;
    }
    
    const dateStr = this.selectedDate.format('YYYY-MM-DD');
    const monthKey = this.currentMonth.format('YYYY-MM');
    const monthSlots = this.slotsCache[monthKey] || [];
    const daySlots = monthSlots.filter(slot => slot.fecha === dateStr);
    
    if (daySlots.length === 0) {
      container.innerHTML = '<div class="no-slots"><span class="material-icons">event_busy</span><p>No hay horarios disponibles</p></div>';
      return;
    }
    
    // Ordenar por hora
    daySlots.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    
    container.innerHTML = '';
    
    daySlots.forEach(slot => {
      const horaLocal = dayjs.utc(slot.startTime).tz(CONFIG.TIMEZONE);
      const timeText = horaLocal.format('HH:mm');
      
      const btn = document.createElement('button');
      btn.className = 'slot-btn';
      btn.textContent = timeText;
      
      btn.addEventListener('click', () => {
        this.seleccionarSlot(slot);
      });
      
      container.appendChild(btn);
    });
  }

  seleccionarSlot(slot) {
    this.slotSeleccionado = slot;
    this.mostrarFormularioReserva();
  }

  mostrarFormularioReserva() {
    const startLocal = dayjs.utc(this.slotSeleccionado.startTime).tz(CONFIG.TIMEZONE);
    const endLocal = startLocal.add(CONFIG.DURACION_CITA, 'minute');
    
    const formulario = `
      <div class="booking-summary">
        <h4>Detalles de la reserva</h4>
        <p>
          <span class="material-icons">event</span>
          ${this.selectedDate.format('dddd, D [de] MMMM YYYY')}
        </p>
        <p>
          <span class="material-icons">schedule</span>
          ${startLocal.format('HH:mm')} - ${endLocal.format('HH:mm')} (${CONFIG.DURACION_CITA} min)
        </p>
      </div>

      <div id="mensajes"></div>

      <form id="formReserva" onsubmit="window.reservas.enviarReserva(event); return false;">
        <div class="form-group">
          <label for="nombre">Nombre completo *</label>
          <input type="text" id="nombre" required placeholder="Tu nombre">
        </div>

        <div class="form-group">
          <label>Teléfono *</label>
          <div style="display:flex;gap:8px;">
            <select id="prefijo" style="width:90px;">
              <option value="+34" selected>🇪🇸 +34</option>
              <option value="+33">🇫🇷 +33</option>
              <option value="+351">🇵🇹 +351</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+1">🇺🇸 +1</option>
            </select>
            <input type="tel" id="telefono" required placeholder="600 123 456" style="flex:1;">
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="tu@email.com">
        </div>

        <div class="form-group">
          <label>Servicio *</label>
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px;align-items:flex-start;">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
              <input type="checkbox" id="servicio-neumaticos" value="Neumáticos">
              <span>Neumáticos</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
              <input type="checkbox" id="servicio-alineacion" value="Alineación">
              <span>Alineación</span>
            </label>
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
          <textarea id="notes" placeholder="Información adicional..."></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="cerrarModal()">
            Cancelar
          </button>
          <button type="submit" id="btnSubmit" class="btn btn-primary">
            <span class="material-icons">check</span>
            Confirmar Reserva
          </button>
        </div>
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
    
    const originalHTML = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="material-icons spinning">refresh</span> Enviando...';
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
        Nombre: document.getElementById('nombre').value.trim(),
        Telefono: telefonoCompleto,
        Email: document.getElementById('email').value.trim() || '',
        Servicio: servicios.join(', '),
        startTime: startLocal.toISOString(),
        endTime: endLocal.toISOString(),
        Matricula: document.getElementById('matricula').value.trim() || '',
        Modelo: document.getElementById('modelo').value.trim() || '',
        Notas: document.getElementById('notes').value.trim() || ''
      };

      const response = await fetch(`/api/proxy/citas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      if (response.ok) {
        mensajes.innerHTML = `
          <div style="background:#d4edda;border:1px solid #c3e6cb;color:#155724;padding:16px;border-radius:8px;margin-bottom:16px;display:flex;align-items:center;gap:12px;">
            <span class="material-icons">check_circle</span>
            <span>¡Reserva confirmada! Te enviaremos un recordatorio por SMS.</span>
          </div>
        `;
        
        // Notificar webhook
        try {
          await fetch(CONFIG.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              triggerEvent: 'CITA_CHANGED',
              createdAt: new Date().toISOString()
            })
          });
        } catch (error) {
          console.error('Error notificando cambio:', error);
        }
        
        // Limpiar cache y recargar
        const monthKey = this.currentMonth.format('YYYY-MM');
        delete this.slotsCache[monthKey];
        
        setTimeout(() => {
          this.cerrarModal();
          this.loadMonthSlots().then(() => {
            this.renderCalendar();
            this.renderSlots();
          });
        }, 2500);
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Error al realizar la reserva');
      }
    } catch (error) {
      console.error('Error:', error);
      mensajes.innerHTML = `
        <div style="background:#f8d7da;border:1px solid #f5c6cb;color:#721c24;padding:16px;border-radius:8px;margin-bottom:16px;display:flex;align-items:center;gap:12px;">
          <span class="material-icons">error</span>
          <span>${error.message}</span>
        </div>
      `;
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalHTML;
    }
  }
}

// Función global para cerrar modal
function cerrarModal() {
  if (window.reservas) {
    window.reservas.cerrarModal();
  }
}
