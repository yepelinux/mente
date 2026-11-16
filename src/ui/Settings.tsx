import { useState } from 'preact/hooks';
import { exportBackup, importBackup, parseBackup } from '../lib/backup';
import { toLocalDate } from '../lib/dates';
import type { Settings, StepKey } from '../lib/types';

interface Props {
  settings: Settings;
  onSave: (s: Settings) => Promise<void>;
  onImported: () => void;
}

const STEP_KEYS: StepKey[] = ['medir', 'exponer', 'neutralizar', 'transformar', 'entrenar'];

export function SettingsScreen({ settings, onSave, onImported }: Props) {
  const [draft, setDraft] = useState(settings);
  const [message, setMessage] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  async function doExport() {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mente-respaldo-${toLocalDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    await onSave({ ...settings, lastBackupAt: new Date().toISOString() });
    setMessage('Respaldo descargado. Guardalo en Drive o mandátelo por mail.');
  }

  async function doImport(file: File | undefined) {
    if (!file) return;
    try {
      const backup = parseBackup(await file.text());
      if (!confirm(`Esto reemplaza todo lo que hay ahora por el respaldo (${backup.entries.length} registros). ¿Seguir?`)) return;
      await importBackup(backup);
      setDraft(backup.settings);
      onImported();
      setMessage('Respaldo importado.');
    } catch (e) {
      setMessage((e as Error).message);
    }
  }

  async function restart() {
    if (!confirm('El plan vuelve a empezar hoy. Tus registros se mantienen. ¿Seguir?')) return;
    const next = { ...settings, planStartDate: toLocalDate(new Date()) };
    setDraft(next);
    await onSave(next);
  }

  return (
    <section class="settings">
      {message && (
        <p class="banner" role="status">
          {message}
        </p>
      )}

      <div class="card">
        <h2>Respaldo</h2>
        <p>Tus datos viven solo en este teléfono. Descargá un respaldo cada tanto.</p>
        <p class="hint">
          Último respaldo: {settings.lastBackupAt ? new Date(settings.lastBackupAt).toLocaleDateString('es') : 'nunca'}
        </p>
        <div class="actions">
          <button type="button" onClick={doExport}>
            Exportar respaldo
          </button>
          <label class="button secondary">
            Importar
            <input type="file" accept="application/json,.json" hidden onChange={(e) => doImport(e.currentTarget.files?.[0])} />
          </label>
        </div>
      </div>

      <div class="card">
        <h2>Plan</h2>
        <label>
          Fecha de inicio
          <input
            type="date"
            value={draft.planStartDate ?? ''}
            onInput={(e) => setDraft({ ...draft, planStartDate: e.currentTarget.value || null })}
          />
        </label>
        <button type="button" class="secondary" onClick={restart}>
          Reiniciar el plan hoy
        </button>
      </div>

      <details class="card">
        <summary>Textos de cada paso</summary>
        {STEP_KEYS.map((k) => (
          <fieldset key={k}>
            <legend>{draft.stepTexts[k].title}</legend>
            <label>
              Título
              <input
                value={draft.stepTexts[k].title}
                onInput={(e) => setDraft({ ...draft, stepTexts: { ...draft.stepTexts, [k]: { ...draft.stepTexts[k], title: e.currentTarget.value } } })}
              />
            </label>
            <label>
              Ayuda
              <textarea
                rows={3}
                value={draft.stepTexts[k].help}
                onInput={(e) => setDraft({ ...draft, stepTexts: { ...draft.stepTexts, [k]: { ...draft.stepTexts[k], help: e.currentTarget.value } } })}
              />
            </label>
          </fieldset>
        ))}
      </details>

      <details class="card">
        <summary>Prácticas de los 30 días</summary>
        {draft.dayPrompts.map((p, i) => (
          <label key={i}>
            Día {i + 1}
            <textarea
              rows={2}
              value={p}
              onInput={(e) => {
                const dayPrompts = [...draft.dayPrompts];
                dayPrompts[i] = e.currentTarget.value;
                setDraft({ ...draft, dayPrompts });
              }}
            />
          </label>
        ))}
      </details>

      {dirty && (
        <button type="button" class="big sticky" onClick={() => onSave({ ...draft, lastBackupAt: settings.lastBackupAt })}>
          Guardar cambios
        </button>
      )}
    </section>
  );
}
