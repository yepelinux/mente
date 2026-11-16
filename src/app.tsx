import { useCallback, useEffect, useState } from 'preact/hooks';
import { toLocalDate } from './lib/dates';
import { getSettings, listDays, listEntries, requestPersistence, saveSettings } from './lib/store';
import type { DayLog, Entry, Settings } from './lib/types';
import { EntryWizard } from './ui/EntryWizard';
import { History } from './ui/History';
import { navigate, useRoute, type Route } from './ui/router';
import { SettingsScreen } from './ui/Settings';
import { Today } from './ui/Today';

const NAV: [Route, string][] = [
  ['hoy', 'Hoy'],
  ['historial', 'Historial'],
  ['ajustes', 'Ajustes'],
];

export function App() {
  const route = useRoute();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [days, setDays] = useState<DayLog[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);

  const reload = useCallback(async () => {
    const [s, d, e] = await Promise.all([getSettings(), listDays(), listEntries()]);
    setSettings(s);
    setDays(d);
    setEntries(e);
  }, []);

  useEffect(() => {
    reload();
    requestPersistence();
  }, [reload]);

  if (!settings) return null;

  async function updateSettings(s: Settings) {
    await saveSettings(s);
    await reload();
  }

  return (
    <>
      <header>
        <h1>MENTE</h1>
      </header>
      <main>
        {route === 'hoy' && (
          <Today
            settings={settings}
            days={days}
            hasData={entries.length > 0 || days.length > 0}
            onChange={reload}
            onStart={() => updateSettings({ ...settings, planStartDate: toLocalDate(new Date()) })}
          />
        )}
        {route === 'nuevo' && (
          <EntryWizard
            settings={settings}
            onDone={async () => {
              await reload();
              navigate('historial');
            }}
          />
        )}
        {route === 'historial' && <History settings={settings} entries={entries} onChange={reload} />}
        {route === 'ajustes' && <SettingsScreen settings={settings} onSave={updateSettings} onImported={reload} />}
      </main>
      <nav>
        {NAV.map(([r, label]) => (
          <a key={r} href={r === 'hoy' ? '#/' : `#/${r}`} class={route === r ? 'active' : ''}>
            {label}
          </a>
        ))}
      </nav>
    </>
  );
}
