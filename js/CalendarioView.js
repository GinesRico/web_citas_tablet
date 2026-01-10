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
      CONFIG.DIAS_LABORABLES.length
    );
    
    const primerDia = diasLaborables[0];
    const ultimoDia = diasLaborables[diasLaborables.length - 1];
    
    this.app.ui.setTitle(`${primerDia.format('D MMM YYYY')} - ${ultimoDia.format('D MMM YYYY')}`);
    
    // Detectar si es móvil y usar renderizado apropiado
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      this.renderMobile(diasLaborables);
    } else {
      this.renderDesktop(diasLaborables);
    }
    
    // Actualizar mini calendario
    this.app.miniCalendar.render(this.app.currentWeek);
  }

  /**
   * Renderiza vista desktop (grid horizontal)
   */
  renderDesktop(diasLaborables) {
    const grid = this.container;
    const hoy = dayjs().format('YYYY-MM-DD');
    const horarios = this.app.horarioService.generar();
    
    // Celda vacía para la columna de horas
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
    horarios.forEach(hora => {
      const timeCell = document.createElement('div');
      timeCell.className = 'cell time';
      timeCell.innerText = hora;
      grid.appendChild(timeCell);

      diasLaborables.forEach(day => {
        const fecha = day.format('YYYY-MM-DD');
        const cita = this.buscarCitaEnSlot(fecha, hora);
        const cell = this.createCell(fecha, hora, cita);
        grid.appendChild(cell);
      });
    });
  }

  /**
   * Renderiza vista móvil (vertical por día)
   */
  renderMobile(diasLaborables) {
    const grid = this.container;
    const hoy = dayjs().format('YYYY-MM-DD');
    const horarios = this.app.horarioService.generar();
    
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
      horarios.forEach(hora => {
        // Celda de hora
        const timeCell = document.createElement('div');
        timeCell.className = 'cell time';
        timeCell.innerText = hora;
        grid.appendChild(timeCell);

        // Celda de cita
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
        <strong>${cita.name}</strong>
        <span>${cita.service}</span>
        ${cita.phone ? `<span>${cita.phone}</span>` : ''}
      `;
      
      // Drag events (mouse)
      cell.ondragstart = () => {
        this.draggedCita = cita;
        cell.classList.add('dragging');
      };
      
      cell.ondragend = () => {
        this.draggedCita = null;
        cell.classList.remove('dragging');
      };
      
      // Touch events (móvil/tablet)
      this.setupTouchDragForCell(cell, cita, fechaHora);
      
      // Click para ver detalles
      cell.onclick = () => {
        this.app.mostrarDetalleCita(cita, hora);
      };
      
    } else {
      cell.className = 'cell free';
      
      // Mostrar hora en la celda vacía
      const timeLabel = document.createElement('span');
      timeLabel.className = 'time-label';
      timeLabel.textContent = hora;
      cell.appendChild(timeLabel);
      
      // Click para agendar nueva cita
      cell.onclick = () => {
        this.app.abrirFormularioAgendamiento(fecha, hora);
      };
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
        // Notificar al webhook que hubo cambios
        this.app.notificarCambio();
        // Recargar citas desde API para tener datos frescos
        await this.app.cargarCitas();
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
   * Configura drag and drop táctil para móviles/tablets
   */
  setupTouchDragForCell(cell, cita, fechaHora) {
    let longPressTimer;
    let isDragging = false;
    let dragElement;
    let startX, startY;
    let currentX, currentY;

    const startDrag = (e) => {
      isDragging = true;
      this.draggedCita = cita;
      
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      
      // Crear elemento visual de arrastre
      dragElement = cell.cloneNode(true);
      dragElement.style.position = 'fixed';
      dragElement.style.pointerEvents = 'none';
      dragElement.style.opacity = '0.8';
      dragElement.style.zIndex = '10000';
      dragElement.style.width = cell.offsetWidth + 'px';
      dragElement.style.left = startX + 'px';
      dragElement.style.top = startY + 'px';
      dragElement.classList.add('dragging');
      document.body.appendChild(dragElement);
      
      cell.classList.add('dragging');
    };

    const moveDrag = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      currentX = touch.clientX;
      currentY = touch.clientY;
      
      dragElement.style.left = currentX + 'px';
      dragElement.style.top = currentY + 'px';
      
      // Detectar sobre qué celda está
      const targetElement = document.elementFromPoint(currentX, currentY);
      document.querySelectorAll('.cell.drop-target').forEach(el => {
        el.classList.remove('drop-target');
      });
      
      if (targetElement && targetElement.classList.contains('cell')) {
        targetElement.classList.add('drop-target');
      }
    };

    const endDrag = (e) => {
      if (!isDragging) return;
      
      isDragging = false;
      cell.classList.remove('dragging');
      
      if (dragElement) {
        document.body.removeChild(dragElement);
        dragElement = null;
      }
      
      // Detectar dónde se soltó
      const targetElement = document.elementFromPoint(currentX || startX, currentY || startY);
      
      document.querySelectorAll('.cell.drop-target').forEach(el => {
        el.classList.remove('drop-target');
      });
      
      if (targetElement && targetElement.classList.contains('cell')) {
        const targetFechaHora = targetElement.dataset.fechahora;
        if (targetFechaHora && this.draggedCita) {
          this.moverCita(this.draggedCita, targetFechaHora);
        }
      }
      
      this.draggedCita = null;
    };

    // Long press para iniciar drag en móviles
    cell.addEventListener('touchstart', (e) => {
      longPressTimer = setTimeout(() => {
        startDrag(e);
      }, 500); // 500ms para detectar long press
    }, { passive: false });

    cell.addEventListener('touchmove', (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      moveDrag(e);
    }, { passive: false });

    cell.addEventListener('touchend', (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      endDrag(e);
    }, { passive: true });

    cell.addEventListener('touchcancel', (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      endDrag(e);
    }, { passive: true });
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
      } else {
        alert('Error al eliminar la cita');
      }
    } catch (error) {
      console.error('Error eliminando cita:', error);
      alert('Error al eliminar la cita');
    }
  }
}
