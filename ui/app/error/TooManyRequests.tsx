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
export function TooManyRequests({
  retryAfterMs = 30000,
  id = 'reload-countdown',
  updateMs = 250,
  log = false,
  level = 1,
}: CountdownProps): ReactNode {
  return (
    <ErrorLayout title='Zu viele Anfragen in kurzer Zeit' level={level}>
      <p>
        Bitte warten sie{' '}
        <Countdown retryAfterMs={retryAfterMs} id={id} updateMs={updateMs} log={log} /> Sekunden bis
        sie weitere anfragen stellen.
      </p>
    </ErrorLayout>
  );
}
