import { useState } from 'preact/hooks';
import { dailyAverages } from '../lib/stats';
import { deleteEntry } from '../lib/store';
import type { Entry, Settings } from '../lib/types';
import { EntryWizard } from './EntryWizard';
import { IntensityChart } from './IntensityChart';
import { WeekCalendar } from './WeekCalendar';

interface Props {
  settings: Settings;
  entries: Entry[];
  onChange: () => void;
}

const formatDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

export function History({ settings, entries, onChange }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);

  if (editing)
    return (
      <EntryWizard
        settings={settings}
        initial={editing}
        onDone={() => {
          setEditing(null);
          onChange();
        }}
      />
    );

  if (entries.length === 0)
    return (
      <section class="card">
        <p>Todavía no registraste nada. Cuando aparezca el ruido mental, tocá "Registrar un pensamiento" en Hoy.</p>
      </section>
    );

  const groups = new Map<string, Entry[]>();
  for (const e of entries) groups.set(e.date, [...(groups.get(e.date) ?? []), e]);

  async function remove(id: string) {
    if (!confirm('¿Borrar este registro?')) return;
    await deleteEntry(id);
    onChange();
  }

  return (
    <section class="history">
      <WeekCalendar
        entries={entries}
        onSelect={(id) => {
          setOpen(id);
          // Wait for the expanded card to render, then bring it into view.
          requestAnimationFrame(() => document.getElementById(`entry-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        }}
      />
      <details class="card evolution">
        <summary>Evolución de la intensidad</summary>
        <IntensityChart data={dailyAverages(entries)} />
      </details>
      {[...groups].map(([date, es]) => (
        <div key={date}>
          <h3>{formatDate(date)}</h3>
          {es.map((e) => (
            <article class={open === e.id ? 'card entry selected' : 'card entry'} key={e.id} id={`entry-${e.id}`}>
              <button type="button" class="row" aria-expanded={open === e.id} onClick={() => setOpen(open === e.id ? null : e.id)}>
                <span class="thought">
                  {when(e) && <small class="when">{when(e)}</small>}
                  {e.thought}
                </span>
                <span class="level">
                  {e.intensityBefore}
                  {e.intensityAfter !== undefined && ` → ${e.intensityAfter}`}
                </span>
              </button>
              {open === e.id && (
                <dl>
                  {e.emotions.length > 0 && <Item label={e.emotions.length > 1 ? 'Emociones' : 'Emoción'} value={e.emotions.join(', ')} />}
                  {e.trigger && <Item label="Disparador" value={e.trigger} />}
                  {e.evidenceFor && <Item label="A favor" value={e.evidenceFor} />}
                  {e.evidenceAgainst && <Item label="En contra" value={e.evidenceAgainst} />}
                  {e.reframe && <Item label="Pensamiento alternativo" value={e.reframe} />}
                  <div class="actions">
                    <button type="button" class="secondary" onClick={() => setEditing(e)}>
                      Editar
                    </button>
                    <button type="button" class="danger" onClick={() => remove(e.id)}>
                      Borrar
                    </button>
                  </div>
                </dl>
              )}
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}

/** "21:30 · 45 min", or whichever part is present. */
export function when(e: Entry): string {
  const parts = [e.startTime, e.durationMinutes !== undefined ? formatDuration(e.durationMinutes) : undefined];
  return parts.filter(Boolean).join(' · ');
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}
