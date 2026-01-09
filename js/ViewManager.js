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
    
    // Renderizar vista activa para sincronizar rangos de fecha
    if (vista === 'slots') {
      this.slotsView.render();
    } else if (vista === 'calendario') {
      this.calendarioView.render();
    }
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
