import { useState } from 'preact/hooks';
import { dailyAverages } from '../lib/stats';
import { deleteEntry } from '../lib/store';
import type { Entry, Settings } from '../lib/types';
import { EntryWizard } from './EntryWizard';
import { IntensityChart } from './IntensityChart';

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
      <IntensityChart data={dailyAverages(entries)} />
      {[...groups].map(([date, es]) => (
        <div key={date}>
          <h3>{formatDate(date)}</h3>
          {es.map((e) => (
            <article class="card entry" key={e.id}>
              <button type="button" class="row" aria-expanded={open === e.id} onClick={() => setOpen(open === e.id ? null : e.id)}>
                <span class="thought">{e.thought}</span>
                <span class="level">
                  {e.intensityBefore}
                  {e.intensityAfter !== undefined && ` → ${e.intensityAfter}`}
                </span>
              </button>
              {open === e.id && (
                <dl>
                  {e.emotion && <Item label="Emoción" value={e.emotion} />}
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

function Item({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}
