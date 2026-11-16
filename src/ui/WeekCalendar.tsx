import { useEffect, useRef, useState } from 'preact/hooks';
import { initialScrollMin, layoutWeek, weekStart, type CalendarBlock } from '../lib/calendar';
import { addDays, toLocalDate, type LocalDate } from '../lib/dates';
import type { Entry } from '../lib/types';
import { emotionColor, emotionFill } from '../content/emotionColors';

export const HOUR_PX = 44;
const PX_PER_MIN = HOUR_PX / 60;

const WEEKDAYS = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const dayNum = (d: LocalDate) => Number(d.slice(8));
const monthName = (d: LocalDate) => MONTHS[Number(d.slice(5, 7)) - 1];

/** "16 – 22 nov", or "30 nov – 6 dic" when the week spans two months. */
function weekLabel(start: LocalDate): string {
  const end = addDays(start, 6);
  return monthName(start) === monthName(end)
    ? `${dayNum(start)} – ${dayNum(end)} ${monthName(end)}`
    : `${dayNum(start)} ${monthName(start)} – ${dayNum(end)} ${monthName(end)}`;
}

const px = (n: number) => `${n.toFixed(1)}px`;

interface Props {
  entries: Entry[];
  /** Any day of the week to show first; defaults to today. */
  initialDate?: LocalDate;
  onSelect: (id: string) => void;
}

export function WeekCalendar({ entries, initialDate, onSelect }: Props) {
  const today = toLocalDate(new Date());
  const [start, setStart] = useState(() => weekStart(initialDate ?? today));
  const days = layoutWeek(entries, start);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = initialScrollMin(days) * PX_PER_MIN;
  }, [start]);

  const hasAllDay = days.some((d) => d.allDay.length > 0);

  return (
    <section class="calendar" aria-label="Calendario semanal">
      <div class="cal-nav">
        <button type="button" class="secondary icon" aria-label="Semana anterior" onClick={() => setStart(addDays(start, -7))}>
          ‹
        </button>
        <strong>{weekLabel(start)}</strong>
        <button type="button" class="secondary icon" aria-label="Semana siguiente" onClick={() => setStart(addDays(start, 7))}>
          ›
        </button>
        {start !== weekStart(today) && (
          <button type="button" class="secondary small" onClick={() => setStart(weekStart(today))}>
            Hoy
          </button>
        )}
      </div>

      <div class="cal-grid" role="grid">
        <div class="cal-head" role="row">
          <span class="gutter" />
          {days.map((d, i) => (
            <span role="columnheader" key={d.date} class={d.date === today ? 'today' : ''}>
              <small>{WEEKDAYS[i]}</small>
              <b>{dayNum(d.date)}</b>
            </span>
          ))}
        </div>

        {hasAllDay && (
          <div class="allday" role="row">
            <span class="gutter" title="Sin hora" />
            {days.map((d) => (
              <div key={d.date}>
                {d.allDay.map((e) => (
                  <button type="button" key={e.id} class="chip-event" style={paint(e)} onClick={() => onSelect(e.id)} aria-label={`Sin hora: ${e.thought}`}>
                    {e.intensityBefore}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <div class="cal-body" ref={scroller}>
          <div class="cal-hours" style={{ height: px(24 * HOUR_PX), '--hour': px(HOUR_PX) }}>
            <div class="gutter">
              {Array.from({ length: 24 }, (_, h) => (
                <span key={h} style={{ top: px(h * HOUR_PX) }}>
                  {h === 0 ? '' : `${h}`}
                </span>
              ))}
            </div>
            {days.map((d) => (
              <div class={d.date === today ? 'cal-day today' : 'cal-day'} key={d.date}>
                {d.blocks.map((b) => (
                  <Block key={`${b.entry.id}-${d.date}`} block={b} onSelect={onSelect} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {(() => {
        const inWeek = weekEmotions([...new Set(days.flatMap((d) => [...d.blocks.map((b) => b.entry), ...d.allDay]))]);
        return (
          inWeek.length > 0 && (
            <ul class="emotion-legend" aria-label="Emociones de la semana">
              {inWeek.map((name) => (
                <li key={name}>
                  <span class="swatch" style={{ background: emotionColor(name) }} />
                  {name}
                </li>
              ))}
            </ul>
          )
        );
      })()}
      <p class="cal-legend">
        Cada bloque es un pensamiento: el alto es cuánto duró, el color es la emoción (en franjas si fueron varias) y más fuerte es más intenso.
      </p>
    </section>
  );
}

function Block({ block: b, onSelect }: { block: CalendarBlock; onSelect: (id: string) => void }) {
  const width = 100 / b.lanes;
  const classes = ['event', b.noDuration && 'no-duration', b.continued && 'continued', b.continues && 'continues'].filter(Boolean).join(' ');
  const tall = (b.endMin - b.startMin) * PX_PER_MIN >= 28;
  return (
    <button
      type="button"
      class={classes}
      style={{
        top: px(b.startMin * PX_PER_MIN),
        height: px((b.endMin - b.startMin) * PX_PER_MIN),
        left: `${b.lane * width}%`,
        width: `${width}%`,
        ...paint(b.entry),
      }}
      aria-label={`${b.entry.startTime ?? ''} ${b.entry.thought}, intensidad ${b.entry.intensityBefore}`}
      onClick={() => onSelect(b.entry.id)}
    >
      {tall && <span>{b.entry.thought}</span>}
    </button>
  );
}

/** Emotion stripes, stronger the more intense the thought was (0–10). */
function paint(e: Entry) {
  return { '--tone': `${35 + e.intensityBefore * 6}%`, '--fill': emotionFill(e.emotions) } as Record<string, string>;
}

/** Emotions present in the week, most frequent first. */
function weekEmotions(entries: Entry[]): string[] {
  const counts = new Map<string, { name: string; n: number }>();
  for (const e of entries)
    for (const name of e.emotions) {
      const k = name.toLocaleLowerCase('es');
      const c = counts.get(k) ?? { name, n: 0 };
      c.n++;
      counts.set(k, c);
    }
  return [...counts.values()].sort((a, b) => b.n - a.n).map((c) => c.name);
}
