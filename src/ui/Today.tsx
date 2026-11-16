import { toLocalDate } from '../lib/dates';
import { blockForDay, dayOfPlan, needsBackupReminder, PLAN_DAYS, streak, type Block } from '../lib/plan';
import { setDay } from '../lib/store';
import type { DayLog, Settings } from '../lib/types';
import { navigate } from './router';

const BLOCK_NAMES: Record<Block, string> = {
  'medir-exponer': 'Semana 1 · Medir y Exponer',
  neutralizar: 'Semana 2 · Neutralizar',
  transformar: 'Semana 3 · Transformar',
  entrenar: 'Semana 4 · Entrenar',
};

interface Props {
  settings: Settings;
  days: DayLog[];
  onChange: () => void;
  onStart: () => void;
}

export function Today({ settings, days, onChange, onStart }: Props) {
  const today = toLocalDate(new Date());
  const doneDates = days.filter((d) => d.practiceDone).map((d) => d.date);
  const todayLog = days.find((d) => d.date === today);
  const status = settings.planStartDate ? dayOfPlan(settings.planStartDate, today) : null;

  async function toggle() {
    await setDay({ ...todayLog, date: today, practiceDone: !todayLog?.practiceDone });
    onChange();
  }

  return (
    <section class="today">
      {needsBackupReminder(settings.lastBackupAt, new Date()) && (
        <a class="banner" href="#/ajustes">
          Hace más de una semana que no guardás un respaldo. Tocá para hacerlo.
        </a>
      )}

      {!status && (
        <div class="card">
          <h2>Plan de 30 días</h2>
          <p>Cada día vas a tener una práctica corta. Empezá cuando quieras.</p>
          <button type="button" onClick={onStart}>
            Empezar el plan hoy
          </button>
        </div>
      )}

      {status?.kind === 'not-started' && (
        <div class="card">
          <h2>El plan empieza el {settings.planStartDate}</h2>
          <p>Mientras tanto, podés registrar pensamientos igual.</p>
        </div>
      )}

      {status?.kind === 'finished' && (
        <div class="card">
          <h2>¡Terminaste los 30 días!</h2>
          <p>Podés seguir registrando, o empezar otra vuelta desde Ajustes.</p>
        </div>
      )}

      {status?.kind === 'active' && (
        <div class="card">
          <p class="eyebrow">{BLOCK_NAMES[blockForDay(status.day)]}</p>
          <h2>
            Día {status.day} de {PLAN_DAYS}
          </h2>
          <p class="prompt">{settings.dayPrompts[status.day - 1]}</p>
          <label class="check">
            <input type="checkbox" checked={!!todayLog?.practiceDone} onChange={toggle} />
            Hice la práctica de hoy
          </label>
          <p class="streak">Racha: {streak(doneDates, today)} días</p>
        </div>
      )}

      <button type="button" class="big" onClick={() => navigate('nuevo')}>
        Registrar un pensamiento
      </button>
    </section>
  );
}
