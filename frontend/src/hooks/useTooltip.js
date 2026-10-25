import { useCallback, useState } from 'react';

/** Estado de um tooltip que segue o cursor/foco. */
export function useTooltip() {
  const [tooltip, setTooltip] = useState(null);

  const show = useCallback((event, content) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX ?? rect.left + rect.width / 2;
    const y = event.clientY ?? rect.top;
    setTooltip({ x, y, content });
  }, []);

  const hide = useCallback(() => setTooltip(null), []);

  return { tooltip, show, hide };
}
