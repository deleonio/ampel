import React from 'react';

/**
 * Ladehinweis als Statusmeldung mit KoliBri-Spinner.
 *
 * Der Hinweis ist meist ein Suspense-Fallback: Der Server liefert ihn aus, React hydriert ihn aber
 * erst, wenn die Daten da sind. Über den React-Adapter hätte <kol-spin> bis dahin keine Props.
 * Deshalb wird das Element direkt mit Attributen gerendert (entry.client.tsx definiert es vor der
 * Hydration) und der Text steht zusätzlich im Light DOM.
 */
export function LoadingStatus({
  label,
  testId,
}: {
  label: string;
  testId?: string;
}): React.ReactNode {
  return (
    <div role='status' className='mt-6 flex items-center gap-3' data-testid={testId}>
      {React.createElement('kol-spin', { _show: true, _variant: 'cycle', 'aria-hidden': 'true' })}
      <span>{label} …</span>
    </div>
  );
}
