/**
 * Gestor de Vistas
 * Maneja el cambio entre vista calendario y vista slots
 */

// Helper para localStorage con fallback si está bloqueado
const safeStorage = {
  setItem: function(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch(e) {
      this._memory = this._memory || {};
      this._memory[key] = value;
    }
  },
  getItem: function(key) {
    try {
      return localStorage.getItem(key);
    } catch(e) {
      this._memory = this._memory || {};
      return this._memory[key] || null;
    }
  },
  _memory: {}
};

class ViewManager {
  constructor(app) {
    this.app = app;
    // Cargar última vista guardada o usar 'slots' por defecto
    this.vistaActual = safeStorage.getItem('arvera_ultima_vista') || 'slots';
    this.calendarioView = new CalendarioView(app);
    this.slotsView = new SlotsView(app);
    this.setupSwipeGestures();
  }

  /**
   * Cambia entre vistas
   */
  cambiarVista(vista, forzarRender = false) {
    const esIgual = this.vistaActual === vista;
    
    if (esIgual && !forzarRender) return;
    
    const prevVista = this.vistaActual;
    this.vistaActual = vista;
    
    // Guardar preferencia del usuario
    safeStorage.setItem('arvera_ultima_vista', vista);
    
    // Actualizar tabs activos
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === vista);
    });
    
    // Mostrar/ocultar vistas
    const vistaCalendario = document.getElementById('vistaCalendario');
    const vistaSlots = document.getElementById('vistaSlots');
    
    vistaCalendario.classList.toggle('active', vista === 'calendario');
    vistaSlots.classList.toggle('active', vista === 'slots');
    
    // Renderizar la vista correspondiente
    if (vista === 'slots') {
      // Renderizar si es forzado (inicialización) o viene de calendario
      if (forzarRender || prevVista === 'calendario') {
        this.slotsView.render();
      }
    } else if (vista === 'calendario') {
      // El calendario se renderiza en verificarActualizaciones
      if (forzarRender) {
        this.calendarioView.render();
      }
    }
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
