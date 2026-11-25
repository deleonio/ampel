import { ReactNode } from 'react';

import { Countdown } from './Countdown';
import { ErrorHeadingLevel, ErrorLayout } from './ErrorLayout';

interface CountdownProps {
  retryAfterMs?: number | null;
  id?: string;
  updateMs?: number;
  log?: boolean;
  level?: ErrorHeadingLevel;
}

/** Zeigt die verbleibenden Sekunden bis zum automatischen Neuladen. */
export function ServerError({
  retryAfterMs = 30000,
  id = 'reload-countdown',
  updateMs = 250,
  log = false,
  level = 1,
}: CountdownProps): ReactNode {
  return (
    <ErrorLayout title='System nicht erreichbar' level={level}>
      <p>
        Die AMPEL ist aktuell nicht erreichbar. In{' '}
        <Countdown retryAfterMs={retryAfterMs} id={id} updateMs={updateMs} log={log} /> Sekunden
        wird eine erneute Verbindung aufgebaut. Nehmen sie Kontakt mit uns auf, falls das Problem
        weiterhin besteht oder wiederholt auftritt.
      </p>
    </ErrorLayout>
  );
}
