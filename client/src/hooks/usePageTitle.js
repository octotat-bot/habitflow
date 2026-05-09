/**
 * usePageTitle — sets document.title per page
 * Usage: usePageTitle('Dashboard')  →  "Dashboard · HabitFlow"
 */
import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} · HabitFlow` : 'HabitFlow';
    return () => { document.title = prev; };
  }, [title]);
}
