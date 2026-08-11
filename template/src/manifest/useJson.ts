import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

const cache = new Map<string, unknown>();

/**
 * Load a JSON file from public/ with render gating. Returns null until loaded.
 * Missing files resolve to `fallback` (default null) without failing the
 * render, so scenes can be previewed before audio artifacts exist.
 */
export function useJson<T>(path: string | null, fallback: T | null = null): T | null {
  const [data, setData] = useState<T | null>(() =>
    path && cache.has(path) ? (cache.get(path) as T) : null,
  );
  const [handle] = useState(() => delayRender(`load ${path ?? 'nothing'}`));

  useEffect(() => {
    let cancelled = false;
    if (!path) {
      continueRender(handle);
      return;
    }
    if (cache.has(path)) {
      setData(cache.get(path) as T);
      continueRender(handle);
      return;
    }
    fetch(staticFile(path))
      .then(async (r) => {
        if (r.status === 404) return fallback;
        if (!r.ok) throw new Error(`${r.status} loading ${path}`);
        return (await r.json()) as T;
      })
      .then((d) => {
        cache.set(path, d);
        if (!cancelled) setData(d);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return data;
}
