# 📅 Embed - Sistema de Reservas Arvera

## Código para Copiar y Pegar

### ✨ Opción Recomendada (Iframe Simple)

```html
<!-- Reservas Arvera -->
<div style="width:100%;height:800px;overflow:hidden;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
  <iframe 
    src="https://citas.arvera.es/reservas.html?embed=true"
    style="width:100%;height:100%;border:none;"
    title="Reservar Cita - Arvera Neumáticos"
    loading="lazy"
  ></iframe>
</div>
```

---

### 📱 Versión Responsive

```html
<!-- Reservas Arvera - Responsive -->
<div id="arvera-reservas-embed"></div>
<script>
  (function() {
    var container = document.getElementById('arvera-reservas-embed');
    var iframe = document.createElement('iframe');
    
    iframe.src = 'https://citas.arvera.es/reservas.html?embed=true';
    iframe.style.width = '100%';
    iframe.style.height = window.innerWidth < 768 ? '100vh' : '800px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    iframe.title = 'Reservar Cita - Arvera Neumáticos';
    iframe.loading = 'lazy';
    
    container.appendChild(iframe);
    
    window.addEventListener('resize', function() {
      iframe.style.height = window.innerWidth < 768 ? '100vh' : '800px';
    });
  })();
</script>
```

---

### ⚡ Versión con Lazy Loading

```html
<!-- Reservas Arvera - Lazy Load -->
<div id="arvera-booking" style="width:100%;min-height:800px;background:#f9fafb;border-radius:8px;position:relative;">
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
    <div style="width:50px;height:50px;border:4px solid #054496;border-top-color:transparent;border-radius:50%;margin:0 auto 15px;animation:spin 1s linear infinite;"></div>
    <p style="color:#6b7280;font-family:Arial,sans-serif;">Cargando calendario...</p>
  </div>
</div>
<style>
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
<script>
  (function() {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var container = document.getElementById('arvera-booking');
          container.innerHTML = '<iframe src="https://citas.arvera.es/reservas.html?embed=true" style="width:100%;height:800px;border:none;border-radius:8px;" title="Reservar Cita"></iframe>';;
          observer.disconnect();
        }
      });
    });
    observer.observe(document.getElementById('arvera-booking'));
  })();
</script>
```

---

## 🎨 Personalización

Puedes modificar estos valores según tus necesidades:

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `width` | Ancho del contenedor | `100%`, `800px` |
| `height` | Altura del iframe | `800px`, `100vh`, `1000px` |
| `border-radius` | Bordes redondeados | `0px`, `8px`, `16px` |
| `box-shadow` | Sombra del contenedor | `none`, `0 2px 8px rgba(0,0,0,0.1)` |

---

## 📋 WordPress

### Método 1: Bloque HTML Personalizado

1. Edita la página donde quieres insertar el calendario
2. Agrega un bloque "HTML Personalizado"
3. Pega el código del iframe
4. Publica la página

### Método 2: Editor Clásico

1. Cambia al modo "Texto" (no Visual)
2. Pega el código completo
3. Guarda la página

---

## 🌐 Wix / Squarespace / Shopify

### Wix:
1. Añade elemento → Más → HTML iframe
2. Ingresa la URL: `https://citas.arvera.es/reservas.html`

### Squarespace:
1. Añade bloque → Código
2. Pega el código del iframe

### Shopify:
1. Páginas → Editar página
2. Inserta HTML personalizado
3. Pega el código

---

## 🔧 Solución de Problemas

### El iframe no se muestra
- Verifica que la URL sea correcta: `https://citas.arvera.es/reservas.html?embed=true`
- Comprueba que tu sitio permita iframes (algunos bloqueadores lo impiden)

### No se ve en móvil
- Usa la versión responsive
- Cambia `height` a `100vh` para móviles

### Carga lenta
- Usa la versión con lazy loading
- Añade `loading="lazy"` al iframe

---

## 📞 Soporte

Para dudas o personalización adicional, contacta con el equipo técnico.

---

## 📄 Archivo de Ejemplo

Abre `embed-example.html` en tu navegador para ver ejemplos completos con código listo para copiar.
