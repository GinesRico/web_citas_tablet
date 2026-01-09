/**
 * Vista de Slots Disponibles
 * Muestra horarios disponibles usando el endpoint /api/disponibles
 */

class SlotsView {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('slotsGrid');
  }

  /**
   * Renderiza la vista de slots disponibles
   */
  async render() {
    if (!this.container) {
      console.error('❌ Container de slots no encontrado');
      return;
    }
    
    this.container.innerHTML = '<div class="loading-slots">Cargando horarios disponibles...</div>';
    
    try {
      const slotsDisponibles = await this.obtenerSlotsDisponibles();
      console.log('📦 Datos recibidos del API:', slotsDisponibles);
      this.renderSlots(slotsDisponibles);
    } catch (error) {
      console.error('❌ Error cargando slots:', error);
      this.container.innerHTML = `
        <div class="error-slots">
          <p>⚠️ Error al cargar horarios disponibles</p>
          <p style="color: var(--text-secondary); font-size: 12px;">${error.message}</p>
          <button onclick="app.viewManager.slotsView.render()">Reintentar</button>
        </div>
      `;
    }
  }

  /**
   * Obtiene los slots disponibles del API
   */
  async obtenerSlotsDisponibles() {
    // Obtener rango de fechas de la semana actual
    const diasLaborables = this.app.diasLaborablesService.generarDiasLaborables(
      this.app.currentWeek,
      CONFIG.DIAS_LABORABLES
    );
    
    // Usar formato simple YYYY-MM-DD (como en el ejemplo que funciona)
    const startDate = diasLaborables[0].format('YYYY-MM-DD');
    const endDate = diasLaborables[diasLaborables.length - 1].format('YYYY-MM-DD');
    
    // Construir parámetros usando CONFIG global
    const horarios = CONFIG.HORARIOS.map(h => h.join('-')).join(',');
    const url = `${CONFIG.API_BASE_URL}/disponibles?startDate=${startDate}&endDate=${endDate}&duracion=${CONFIG.DURACION_CITA}&horarios=${horarios}&timezone=${CONFIG.TIMEZONE}`;
    
    console.log('🔍 Consultando slots disponibles:', url);
    
    const response = await fetch(url);
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Slots disponibles obtenidos:', data.total, 'slots');
    console.log('📋 Detalles:', data);
    
    return data;
  }

  /**
   * Renderiza los slots agrupados por día (estilo Cal.com)
   */
  renderSlots(data) {
    if (!data.disponibles || data.disponibles.length === 0) {
      this.container.innerHTML = `
        <div class="no-disponibles">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <h3>No hay horarios disponibles</h3>
          <p>Todos los slots de esta semana están ocupados</p>
        </div>
      `;
      return;
    }

    // Agrupar slots por día
    const slotsPorDia = this.agruparPorDia(data.disponibles);
    
    // Filtrar solo días laborables (lunes a viernes)
    const diasOrdenados = Object.keys(slotsPorDia)
      .sort()
      .filter(fecha => {
        const dia = dayjs(fecha);
        const diaSemana = dia.day(); // 0=domingo, 6=sábado
        return diaSemana >= 1 && diaSemana <= 5; // Solo lunes(1) a viernes(5)
      });
    
    if (diasOrdenados.length === 0) {
      this.container.innerHTML = `
        <div class="no-disponibles">
          <h3>No hay horarios disponibles</h3>
          <p>No hay slots laborables en esta semana</p>
        </div>
      `;
      return;
    }
    
    this.container.innerHTML = '';
    
    // Crear columna por cada día laborable
    diasOrdenados.forEach(fecha => {
      const diaColumna = this.crearDiaColumna(fecha, slotsPorDia[fecha]);
      this.container.appendChild(diaColumna);
    });
  }

  /**
   * Agrupa los slots por fecha
   */
  agruparPorDia(slots) {
    const grupos = {};
    
    slots.forEach(slot => {
      if (!grupos[slot.fecha]) {
        grupos[slot.fecha] = [];
      }
      grupos[slot.fecha].push(slot);
    });
    
    return grupos;
  }

  /**
   * Crea una columna de día con sus slots (estilo Cal.com)
   */
  crearDiaColumna(fecha, slots) {
    const dia = dayjs(fecha);
    const diaDiv = document.createElement('div');
    diaDiv.className = 'dia-slots-columna';
    
    // Header compacto del día (como Cal.com)
    const header = document.createElement('div');
    header.className = 'dia-slots-header';
    
    const diaNombre = document.createElement('div');
    diaNombre.className = 'dia-nombre-corto';
    diaNombre.textContent = dia.format('ddd D').toUpperCase(); // LUN 12
    
    header.appendChild(diaNombre);
    diaDiv.appendChild(header);
    
    // Lista vertical de slots
    const slotsList = document.createElement('div');
    slotsList.className = 'slots-list-vertical';
    
    // Ordenar slots por hora y convertir a timezone local
    const slotsOrdenados = slots.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    
    slotsOrdenados.forEach(slot => {
      // Convertir de UTC a timezone local
      const horaLocal = dayjs.utc(slot.startTime).tz(CONFIG.TIMEZONE).format('HH:mm');
      
      const btn = document.createElement('button');
      btn.className = 'slot-btn-columna';
      btn.textContent = horaLocal;
      btn.dataset.startTime = slot.startTime;
      btn.dataset.endTime = slot.endTime;
      btn.dataset.fecha = slot.fecha;
      btn.onclick = () => this.seleccionarSlot(slot);
      slotsList.appendChild(btn);
    });
    
    diaDiv.appendChild(slotsList);
    
    return diaDiv;
  }

  /**
   * Maneja la selección de un slot
   */
  seleccionarSlot(slot) {
    console.log('Slot seleccionado:', slot);
    // Convertir de UTC a hora local para el formulario
    const startLocal = dayjs.utc(slot.startTime).tz(CONFIG.TIMEZONE);
    const fecha = startLocal.format('YYYY-MM-DD');
    const hora = startLocal.format('HH:mm');
    
    this.app.abrirFormularioAgendamiento(fecha, hora);
  }
}
