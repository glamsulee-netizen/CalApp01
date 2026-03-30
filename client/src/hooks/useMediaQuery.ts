// ============================================
// CalApp01 — useMediaQuery Hook
// ============================================
// Отслеживает медиа-запрос для адаптивного поведения (показ 3 или 7 дней)

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** Определяет мобильный экран (< 768px) */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
