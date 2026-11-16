import { addDays, daysBetween, type LocalDate } from './dates';
import type { Entry } from './types';

const DAY_MIN = 24 * 60;
/** Visual length for entries without a duration. */
export const PLACEHOLDER_MIN = 15;

export interface CalendarBlock {
  entry: Entry;
  /** Minutes from midnight of this column's day. */
  startMin: number;
  endMin: number;
  /** Side-by-side position among overlapping blocks. */
  lane: number;
  lanes: number;
  /** No duration recorded: drawn as a short placeholder. */
  noDuration: boolean;
  /** Started on a previous day. */
  continued: boolean;
  /** Goes on past midnight. */
  continues: boolean;
}

export interface CalendarDay {
  date: LocalDate;
  blocks: CalendarBlock[];
  /** Entries without a start time. */
  allDay: Entry[];
}

/** Monday of the week containing `date`. */
export function weekStart(date: LocalDate): LocalDate {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = (new Date(y, m - 1, d).getDay() + 6) % 7; // Monday = 0
  return addDays(date, -weekday);
}

export function weekDays(start: LocalDate): LocalDate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function layoutWeek(entries: Entry[], start: LocalDate): CalendarDay[] {
  const days: CalendarDay[] = weekDays(start).map((date) => ({ date, blocks: [], allDay: [] }));

  for (const entry of entries) {
    const offset = daysBetween(start, entry.date);
    if (!entry.startTime) {
      if (offset >= 0 && offset < 7) days[offset].allDay.push(entry);
      continue;
    }
    const noDuration = entry.durationMinutes === undefined;
    // Absolute minutes from the week's Monday 00:00; may start before the week (previous Sunday night).
    const from = offset * DAY_MIN + toMinutes(entry.startTime);
    const to = from + (entry.durationMinutes ?? PLACEHOLDER_MIN);
    for (let i = Math.max(0, Math.floor(from / DAY_MIN)); i < 7 && i * DAY_MIN < to; i++) {
      const dayFrom = i * DAY_MIN;
      const s = Math.max(from, dayFrom);
      const e = Math.min(to, dayFrom + DAY_MIN);
      if (e <= s) continue;
      days[i].blocks.push({
        entry,
        startMin: s - dayFrom,
        endMin: e - dayFrom,
        lane: 0,
        lanes: 1,
        noDuration,
        continued: from < dayFrom,
        continues: to > dayFrom + DAY_MIN,
      });
    }
  }

  for (const day of days) assignLanes(day.blocks);
  return days;
}

/** Google-Calendar-style lanes: each group of transitively overlapping blocks shares the column width. */
function assignLanes(blocks: CalendarBlock[]) {
  blocks.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  let group: CalendarBlock[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -1;
  const close = () => {
    for (const b of group) b.lanes = laneEnds.length;
    group = [];
    laneEnds = [];
  };
  for (const b of blocks) {
    if (b.startMin >= groupEnd) close();
    let lane = laneEnds.findIndex((end) => end <= b.startMin);
    if (lane === -1) lane = laneEnds.push(0) - 1;
    laneEnds[lane] = b.endMin;
    b.lane = lane;
    group.push(b);
    groupEnd = Math.max(groupEnd, b.endMin);
  }
  close();
}

const DEFAULT_SCROLL_MIN = 7 * 60;
const SCROLL_LEAD_MIN = 30;

/** Where the time grid should open: just before the week's earliest thought, ignoring after-midnight tails. */
export function initialScrollMin(days: CalendarDay[]): number {
  const starts = days.flatMap((d) => d.blocks.filter((b) => !b.continued).map((b) => b.startMin));
  if (starts.length === 0) return DEFAULT_SCROLL_MIN;
  return Math.max(0, Math.min(...starts) - SCROLL_LEAD_MIN);
}
