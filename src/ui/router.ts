import { useEffect, useState } from 'preact/hooks';

export type Route = 'hoy' | 'nuevo' | 'historial' | 'ajustes';

export function parseRoute(hash: string): Route {
  const r = hash.replace(/^#\/?/, '');
  return r === 'nuevo' || r === 'historial' || r === 'ajustes' ? r : 'hoy';
}

export function navigate(r: Route) {
  location.hash = r === 'hoy' ? '#/' : `#/${r}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(location.hash));
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return route;
}
