/**
 * Gestor de Vistas
 * Maneja el cambio entre vista calendario y vista slots
 */

class ViewManager {
  constructor(app) {
    this.app = app;
    // Cargar última vista guardada o usar 'slots' por defecto
    this.vistaActual = localStorage.getItem('arvera_ultima_vista') || 'slots';
    this.calendarioView = new CalendarioView(app);
    this.slotsView = new SlotsView(app);
    this.setupSwipeGestures();
  }

  /**
   * Cambia entre vistas
   */
  cambiarVista(vista) {
    if (this.vistaActual === vista) return;
    
    const prevVista = this.vistaActual;
    this.vistaActual = vista;
    
    // Guardar preferencia del usuario
    localStorage.setItem('arvera_ultima_vista', vista);
    
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
   * Configura gestos swipe para cambiar entre vistas en dispositivos táctiles
   */
  setupSwipeGestures() {
    const container = document.getElementById('app-container');
    if (!container) return;

    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });

    this.handleSwipe = () => {
      const swipeDistance = touchEndX - touchStartX;
      
      if (Math.abs(swipeDistance) < minSwipeDistance) return;

      if (swipeDistance > 0) {
        // Swipe derecha: ir a calendario
        if (this.vistaActual === 'slots') {
          this.cambiarVista('calendario');
        }
      } else {
        // Swipe izquierda: ir a slots
        if (this.vistaActual === 'calendario') {
          this.cambiarVista('slots');
        }
      }
    };
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
