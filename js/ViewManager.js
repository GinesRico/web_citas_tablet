/**
 * Gestor de Vistas
 * Maneja el cambio entre vista calendario y vista slots
 */

class ViewManager {
  constructor(app) {
    this.app = app;
    this.vistaActual = 'calendario';
    this.calendarioView = new CalendarioView(app);
    this.slotsView = new SlotsView(app);
  }

  /**
   * Cambia entre vistas
   */
  cambiarVista(vista) {
    if (this.vistaActual === vista) return;
    
    const prevVista = this.vistaActual;
    this.vistaActual = vista;
    
    // Actualizar tabs activos
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === vista);
    });
    
    // Mostrar/ocultar vistas
    const vistaCalendario = document.getElementById('vistaCalendario');
    const vistaSlots = document.getElementById('vistaSlots');
    
    vistaCalendario.classList.toggle('active', vista === 'calendario');
    vistaSlots.classList.toggle('active', vista === 'slots');
    
    // Solo renderizar la nueva vista si no se ha renderizado antes
    // o si cambiamos el rango de fechas
    if (vista === 'slots') {
      // Solo render si viene de calendario (primera vez o cambio de rango)
      if (prevVista === 'calendario') {
        this.slotsView.render();
      }
    }
    // Para calendario no es necesario re-render, ya está renderizado
  }

  /**
   * Renderiza la vista actual
   */
  renderVistaActual() {
    if (this.vistaActual === 'calendario') {
      this.calendarioView.render();
    } else if (this.vistaActual === 'slots') {
      this.slotsView.render();
    }
  }

  /**
   * Refresca la vista actual
   */
  refresh() {
    this.renderVistaActual();
  }
}
