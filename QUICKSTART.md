# 🚀 Quick Start - Migración de Citas

Guía rápida de 5 minutos para migrar tus citas de Cal.com a la nueva API.

## ⚡ Inicio Rápido

### 1️⃣ Instalación (1 minuto)

```powershell
pip install requests
```

### 2️⃣ Prueba de Conectividad (30 segundos)

```powershell
python test_conexion.py
```

¿Todo en verde? ✅ Continúa al paso 3.

### 3️⃣ Migración (2 minutos)

```powershell
python migrate_citas.py
```

- Revisa el preview
- Escribe `SI` para confirmar
- Espera a que termine

### 4️⃣ Verificación (1 minuto)

```powershell
python verificar_migracion.py
```

## 🎯 Resultado Esperado

```
✓ Migradas exitosamente: 15/15
ℹ Tiempo total: 5.43 segundos

✓ ¡MIGRACIÓN COMPLETADA CON ÉXITO!
```

## 🆘 ¿Problemas?

### Error: "No module named 'requests'"
```powershell
pip install requests
```

### Error de conexión
- Verifica tu internet
- Comprueba que las URLs sean correctas

### Citas duplicadas
- Ejecutar el script varias veces crea duplicados
- Elimínalos desde la app web o Supabase

## 📚 Más Información

Para instrucciones detalladas, consulta [MIGRACION.md](MIGRACION.md)

## 💡 Consejos

- ✅ Haz primero una prueba de conectividad
- ✅ Revisa el preview antes de confirmar
- ✅ Verifica la migración después de completarla
- ❌ No ejecutes el script múltiples veces (crea duplicados)
- ✅ Las citas antiguas NO se eliminan (seguro)

## 🎉 ¡Listo!

Una vez migradas las citas, tu aplicación web mostrará todas las citas en el calendario.
