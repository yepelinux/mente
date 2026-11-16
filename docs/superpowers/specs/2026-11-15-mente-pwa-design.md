# MENTE — PWA personal para el plan de 30 días (diseño corto)

Fecha: 2026-11-15 · Estado: borrador para aprobación

## Intención

App personal (un solo usuario, un teléfono) para seguir el plan de 30 días del
método M.E.N.T.E. (Medir, Exponer, Neutralizar, Transformar, Entrenar) del
audiolibro *Cómo dejar de pensar demasiado y controlar tus emociones*
(Lucía Ramírez). El contenido real del capítulo 16 no está disponible en texto,
así que la app arranca con una **interpretación propia** de cada paso
(registro de pensamientos estilo terapia cognitiva) y todos los textos son
editables para ajustarlos cuando se conozca el detalle del libro.

## Objetivos

- Registrar en menos de 2 minutos un episodio de sobrepensamiento siguiendo
  M → E → N → T.
- Marcar la práctica diaria (Entrenar) y ver en qué día del plan de 30 días se está.
- Ver si la intensidad emocional baja entre "Medir" y "Transformar", y cómo
  evoluciona en los 30 días.
- Funcionar sin internet, instalable en la pantalla de inicio.

## No-objetivos

- Cuentas, servidor, base de datos remota, sincronización entre dispositivos.
- Notificaciones push (posible más adelante).
- Ser una herramienta clínica; no reemplaza terapia.
- Reproducir texto del libro.

## Anti-objetivos (fracaso aunque "funcione")

- Que registrar dé fiaca: demasiados campos obligatorios.
- Perder datos sin aviso.

## Enfoques considerados (almacenamiento)

- **A. IndexedDB + exportar/importar respaldo JSON** — elegido. Local, privado,
  offline, sin límite práctico; riesgo de borrado mitigado con
  `navigator.storage.persist()` y recordatorio semanal de respaldo.
- B. localStorage — igual de local pero menos espacio y más fácil de perder; sin
  ventaja real.
- C. Sincronizar con Drive/GitHub — sobrevive a todo pero agrega login y
  conflictos; excesivo para un usuario y un dispositivo. Se puede sumar sobre A.

## Pantallas

1. **Hoy**: "Día N de 30", práctica del día (Entrenar) con check, racha, botón
   grande "Registrar un pensamiento", aviso si el último respaldo tiene > 7 días.
2. **Registro (asistente de 4 pasos)**:
   - Medir: emoción (chips + libre), intensidad 0–10, disparador (opcional).
   - Exponer: el pensamiento tal cual ("¿y si…?").
   - Neutralizar: pausa guiada opcional (respiración 1 min), pruebas a favor /
     en contra (opcionales).
   - Transformar: pensamiento alternativo, intensidad final 0–10.
   Solo intensidad inicial y pensamiento son obligatorios; se puede guardar en
   cualquier paso.
3. **Historial**: lista por día, detalle de cada registro, gráfico simple de
   intensidad inicial vs. final por día.
4. **Ajustes**: fecha de inicio del plan (reiniciar), editar textos/ayudas de
   cada paso y la práctica de cada uno de los 30 días, exportar / importar
   respaldo.

## Plan de 30 días (contenido inicial, propio y editable)

Cuatro bloques: días 1–7 foco en Medir/Exponer (registrar sin juzgar), 8–14
Neutralizar, 15–21 Transformar, 22–30 Entrenar e integrar. Cada día tiene una
consigna corta escrita por nosotros, no del libro.

## Datos

- `entries`: id, createdAt, emotion, intensityBefore, trigger?, thought,
  evidenceFor?, evidenceAgainst?, reframe?, intensityAfter?.
- `days`: dayNumber, date, practiceDone, note?.
- `settings`: planStartDate, stepTexts, dayPrompts[30], lastBackupAt.
- Respaldo = un JSON con todo, con `version` para futuras migraciones.

## Cómo se construye (decisiones de Claude)

- Vite + Preact + TypeScript, `vite-plugin-pwa` (service worker + manifest),
  `idb-keyval` para IndexedDB, gráfico en SVG propio (sin librería).
- Tests con Vitest para la lógica (día del plan, rachas, export/import).
- Hosting: GitHub Pages en un repo personal (se confirma antes de crearlo).
- Todo en español, mobile-first, modo oscuro según el sistema.

## Queda al criterio del builder

Estilos visuales, íconos, textos de ayuda iniciales, estructura de carpetas.
