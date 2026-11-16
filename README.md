# MENTE

App personal (PWA) para seguir el plan de 30 días del método M.E.N.T.E.
(Medir, Exponer, Neutralizar, Transformar, Entrenar). Los pasos son una
interpretación propia y se pueden editar desde **Ajustes**.

- Los datos viven sólo en el dispositivo (IndexedDB). No hay servidor.
- **Ajustes → Exportar respaldo** descarga un JSON; **Importar** lo restaura.
- Se instala desde el navegador del celular con "Agregar a la pantalla de inicio".

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm test         # tests
npm run build    # genera dist/
```

Cada push a `main` se publica en GitHub Pages (`.github/workflows/deploy.yml`).

Diseño: `docs/superpowers/specs/2026-11-15-mente-pwa-design.md`.
