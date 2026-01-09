/**
 * Vista de Calendario Semanal
 * Renderiza la grilla de calendario con citas
 */

class CalendarioView {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('week');
    this.draggedCita = null;
  }

  /**
   * Renderiza el calendario semanal
   */
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = '';
    
    const diasLaborables = this.app.diasLaborablesService.generarDiasLaborables(
      this.app.currentWeek,
      CONFIG.DIAS_LABORABLES
    );
    const horarios = this.app.horarioService.generar();
    
    const primerDia = diasLaborables[0];
    const ultimoDia = diasLaborables[diasLaborables.length - 1];
    
    this.app.ui.setTitle(`${primerDia.format('D MMM YYYY')} - ${ultimoDia.format('D MMM YYYY')}`);
    
    // Renderizar headers de días
    this.renderDayHeaders(diasLaborables);
    
    // Renderizar grid de celdas
    this.renderGrid(diasLaborables, horarios);
    
    // Actualizar mini calendario
    this.app.miniCalendar.render(this.app.currentWeek);
  }

  /**
   * Renderiza los headers de los días
   */
  renderDayHeaders(diasLaborables) {
    const grid = this.container;
    
    // Celda vacía para la columna de horas
    const emptyCell = document.createElement('div');
    emptyCell.className = 'time';
    grid.appendChild(emptyCell);
    
    // Headers de días
    diasLaborables.forEach(day => {
      const header = document.createElement('div');
      header.className = 'day-header';
      header.innerHTML = `
        <div class="day-name">${day.format('ddd')}</div>
        <div class="day-number">${day.format('D')}</div>
      `;
      grid.appendChild(header);
    });
  }

  /**
   * Renderiza la grilla de celdas
   */
  renderGrid(diasLaborables, horarios) {
    const grid = this.container;
    
    horarios.forEach(hora => {
      // Celda de hora
      const timeCell = document.createElement('div');
      timeCell.className = 'time';
      timeCell.innerHTML = `<span class="time-label">${hora}</span>`;
      grid.appendChild(timeCell);
      
      // Celdas de cada día
      diasLaborables.forEach(day => {
        const fecha = day.format('YYYY-MM-DD');
        const fechaHoraSlot = `${fecha} ${hora}`;
        
        // Buscar cita en este slot
        const cita = this.buscarCitaEnSlot(fecha, hora);
        const cell = this.createCell(fecha, hora, cita);
        grid.appendChild(cell);
      });
    });
  }

  /**
   * Busca una cita que coincida con el slot
   */
  buscarCitaEnSlot(fecha, hora) {
    return this.app.citas.find(c => {
      if (!c.start) return false;
      const citaFechaHora = dayjs.utc(c.start).tz(CONFIG.TIMEZONE);
      const citaFecha = citaFechaHora.format('YYYY-MM-DD');
      
      if (citaFecha !== fecha) return false;
      
      const slotInicio = dayjs(`${fecha} ${hora}`);
      const slotFin = slotInicio.add(CONFIG.DURACION_CITA, 'minute');
      
      return !citaFechaHora.isBefore(slotInicio) && citaFechaHora.isBefore(slotFin);
    });
  }

  /**
   * Crea una celda del calendario
   */
  createCell(fecha, hora, cita) {
    const cell = document.createElement('div');
    const fechaHora = `${fecha} ${hora}`;
    
    cell.dataset.slot = fechaHora;
    
    if (cita) {
      cell.className = 'cell busy';
      cell.draggable = true;
      cell.innerHTML = `
        <div class="cita-info">
          <div class="cita-nombre">${cita.name}</div>
          <div class="cita-servicio">${cita.service}</div>
          ${cita.phone ? `<div class="cita-telefono">${cita.phone}</div>` : ''}
        </div>
        <button class="btn-eliminar" title="Eliminar cita">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      `;
      
      // Drag events
      cell.ondragstart = () => {
        this.draggedCita = cita;
        cell.classList.add('dragging');
      };
      
      cell.ondragend = () => {
        cell.classList.remove('dragging');
      };
      
      // Click en botón eliminar
      const btnEliminar = cell.querySelector('.btn-eliminar');
      btnEliminar.onclick = (e) => {
        e.stopPropagation();
        this.eliminarCita(cita);
      };
      
    } else {
      cell.className = 'cell free';
      cell.innerHTML = `<span class="time-label">${hora}</span>`;
    }
    
    // Drop events (todas las celdas pueden recibir drops)
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
        await this.moverCita(this.draggedCita, fechaHora);
      }
    };
    
    // Click para agendar
    cell.onclick = () => {
      if (!cita) {
        this.app.abrirFormularioAgendamiento(fecha, hora);
      }
    };
    
    return cell;
  }

  /**
   * Mueve una cita a un nuevo horario
   */
  async moverCita(cita, nuevoSlot) {
    const nuevaFechaHora = dayjs(nuevoSlot);
    const nuevaEndTime = nuevaFechaHora.add(CONFIG.DURACION_CITA, 'minute');
    
    try {
      const response = await this.app.api.actualizarCita(cita.id, {
        startTime: nuevaFechaHora.toISOString(),
        endTime: nuevaEndTime.toISOString()
      });
      
      if (response.ok) {
        cita.start = nuevaFechaHora.toISOString();
        cita.end = nuevaEndTime.toISOString();
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

  /**
   * Elimina una cita
   */
  async eliminarCita(cita) {
    if (!confirm(`¿Eliminar la cita de ${cita.name}?`)) return;
    
    try {
      const response = await this.app.api.eliminarCita(cita.id);
      
      if (response.ok) {
        await this.app.cargarCitas();
        this.render();
      } else {
        alert('Error al eliminar la cita');
      }
    } catch (error) {
      console.error('Error eliminando cita:', error);
      alert('Error al eliminar la cita');
    }
  }
}
