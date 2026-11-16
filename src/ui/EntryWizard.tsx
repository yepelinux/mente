import { useEffect, useRef, useState } from 'preact/hooks';
import { EMOTIONS } from '../content/defaults';
import { toLocalDate } from '../lib/dates';
import { mergeEmotions, saveEntry, validateEntry } from '../lib/store';
import type { Entry, Settings, StepKey } from '../lib/types';

const DURATION_PRESETS = [5, 15, 30, 60];

const currentTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const STEPS: StepKey[] = ['medir', 'exponer', 'neutralizar', 'transformar'];

interface Props {
  settings: Settings;
  onDone: () => void;
  /** Leave without saving; defaults to onDone. */
  onCancel?: () => void;
  /** Existing entry to edit; omitted for a new one. */
  initial?: Entry;
}

export function EntryWizard({ settings, onDone, onCancel, initial }: Props) {
  // The id is fixed at mount: repeated saves upsert the same entry.
  const [draft, setDraft] = useState<Entry>(
    () =>
      initial ?? {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        date: toLocalDate(new Date()),
        emotions: [],
        intensityBefore: 5,
        startTime: currentTime(),
        thought: '',
      },
  );
  // Presets are toggled as chips; anything else lives in a comma-separated text field.
  const [picked, setPicked] = useState(() => draft.emotions.filter((e) => EMOTIONS.includes(e)));
  const [typed, setTyped] = useState(() => draft.emotions.filter((e) => !EMOTIONS.includes(e)).join(', '));
  const [step, setStep] = useState(0);
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<Entry>) => setDraft((d) => ({ ...d, ...patch }));
  const error = validateEntry(draft);
  const key = STEPS[step];
  const text = settings.stepTexts[key];

  async function save() {
    if (saving.current || error) return;
    saving.current = true;
    setBusy(true);
    try {
      await saveEntry(clean({ ...draft, emotions: mergeEmotions(picked, typed) }));
      onDone();
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return (
    <section class="wizard">
      <ol class="steps" aria-label="Pasos">
        {STEPS.map((k, i) => (
          <li class={i === step ? 'current' : i < step ? 'done' : ''} key={k}>
            {settings.stepTexts[k].title[0]}
          </li>
        ))}
      </ol>
      <h2>{text.title}</h2>
      <p class="help">{text.help}</p>

      {key === 'medir' && (
        <>
          <fieldset class="chips">
            <legend>Emociones (podés elegir varias)</legend>
            {EMOTIONS.map((e) => (
              <button
                type="button"
                key={e}
                class={picked.includes(e) ? 'chip on' : 'chip'}
                aria-pressed={picked.includes(e)}
                onClick={() => setPicked(picked.includes(e) ? picked.filter((x) => x !== e) : [...picked, e])}
              >
                {e}
              </button>
            ))}
          </fieldset>
          <label>
            Otras emociones
            <input value={typed} placeholder="Separadas por coma" onInput={(ev) => setTyped(ev.currentTarget.value)} />
          </label>
          <Intensity label="Intensidad inicial" value={draft.intensityBefore} onChange={(n) => update({ intensityBefore: n })} />
          <label>
            ¿A qué hora empezó?
            <input type="time" value={draft.startTime ?? ''} onInput={(ev) => update({ startTime: ev.currentTarget.value || undefined })} />
          </label>
          <fieldset class="duration">
            <legend>¿Cuánto duró? (opcional)</legend>
            <div class="chips">
              {DURATION_PRESETS.map((m) => (
                <button
                  type="button"
                  key={m}
                  class={draft.durationMinutes === m ? 'chip on' : 'chip'}
                  aria-pressed={draft.durationMinutes === m}
                  onClick={() => update({ durationMinutes: draft.durationMinutes === m ? undefined : m })}
                >
                  {m} min
                </button>
              ))}
            </div>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={1440}
              step={1}
              aria-label="Duración en minutos"
              placeholder="Otro, en minutos"
              value={draft.durationMinutes ?? ''}
              onInput={(ev) => {
                const v = ev.currentTarget.value;
                update({ durationMinutes: v === '' ? undefined : Number(v) });
              }}
            />
          </fieldset>
          <label>
            ¿Qué lo disparó? (opcional)
            <textarea rows={2} value={draft.trigger ?? ''} onInput={(ev) => update({ trigger: ev.currentTarget.value })} />
          </label>
        </>
      )}

      {key === 'exponer' && (
        <label>
          Pensamiento
          <textarea rows={5} value={draft.thought} placeholder="¿Y si…?" onInput={(ev) => update({ thought: ev.currentTarget.value })} />
        </label>
      )}

      {key === 'neutralizar' && (
        <>
          <Breathing />
          <label>
            Pruebas a favor (opcional)
            <textarea rows={3} value={draft.evidenceFor ?? ''} onInput={(ev) => update({ evidenceFor: ev.currentTarget.value })} />
          </label>
          <label>
            Pruebas en contra (opcional)
            <textarea rows={3} value={draft.evidenceAgainst ?? ''} onInput={(ev) => update({ evidenceAgainst: ev.currentTarget.value })} />
          </label>
        </>
      )}

      {key === 'transformar' && (
        <>
          <label>
            Pensamiento alternativo
            <textarea rows={4} value={draft.reframe ?? ''} onInput={(ev) => update({ reframe: ev.currentTarget.value })} />
          </label>
          <Intensity
            label="Intensidad final"
            value={draft.intensityAfter ?? draft.intensityBefore}
            onChange={(n) => update({ intensityAfter: n })}
          />
        </>
      )}

      <div class="actions">
        <button type="button" class="danger" onClick={onCancel ?? onDone}>
          Cancelar
        </button>
        {step > 0 && (
          <button type="button" class="secondary" onClick={() => setStep(step - 1)}>
            Atrás
          </button>
        )}
        {step < STEPS.length - 1 && (
          <button type="button" class="secondary" onClick={() => setStep(step + 1)}>
            Siguiente
          </button>
        )}
        {step >= 1 && (
          <button type="button" disabled={!!error || busy} onClick={save}>
            Guardar
          </button>
        )}
      </div>
      {step >= 1 && error && <p class="hint">{error}</p>}
    </section>
  );
}

/** Drop empty optional fields so stored entries stay tidy. */
function clean(e: Entry): Entry {
  const out: Entry = { ...e, thought: e.thought.trim() };
  // The final slider starts at the initial intensity; keep what the user saw.
  if (out.reframe?.trim() && out.intensityAfter === undefined) out.intensityAfter = out.intensityBefore;
  for (const k of ['trigger', 'evidenceFor', 'evidenceAgainst', 'reframe'] as const) {
    const v = out[k]?.trim();
    if (v) out[k] = v;
    else delete out[k];
  }
  return out;
}

function Intensity({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label class="intensity">
      {label}
      <div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          aria-label={label}
          onInput={(ev) => onChange(Number(ev.currentTarget.value))}
        />
        <output>{value}</output>
      </div>
    </label>
  );
}

function Breathing() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  if (left === null)
    return (
      <button type="button" class="secondary" onClick={() => setLeft(60)}>
        Pausa de respiración (1 min)
      </button>
    );
  const phase = left === 0 ? 'Listo' : Math.floor((60 - left) / 4) % 2 === 0 ? 'Inhalá…' : 'Exhalá…';
  return (
    <div class="breathing" aria-live="polite">
      <div class={left > 0 ? 'circle pulse' : 'circle'} />
      <p>
        {phase} {left > 0 && <small>{left} s</small>}
      </p>
    </div>
  );
}
