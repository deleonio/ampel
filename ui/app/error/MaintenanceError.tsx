import { KolHeading } from '@public-ui/react-v19';
import { ReactNode } from 'react';

import { Countdown } from './Countdown';
import { ErrorLayout } from './ErrorLayout';

interface CountdownProps {
  retryAfterMs?: number | null;
  id?: string;
  updateMs?: number;
  log?: boolean;
}

/** Zeigt verbleibende Sekunden in ein <span> und aktualisiert per client-side timer. */
export function MaintenanceError({
  retryAfterMs = 30000,
  id = 'reload-countdown',
  updateMs = 250,
  log = false,
}: CountdownProps): ReactNode {
  return (
    <ErrorLayout>
      <title>AMPEL-CDSS</title>
      <meta charSet='utf-8' />
      <KolHeading _label='System nicht erreichbar' _level={1} />
      <p style={{ maxWidth: '600px', width: 'fit-content', margin: 'auto' }}>
        Die AMPEL ist aktuell nicht erreichbar. In{' '}
        <Countdown retryAfterMs={retryAfterMs} id={id} updateMs={updateMs} log={log} /> Sekunden
        wird eine erneute Verbindung aufgebaut.
      </p>
      <br />
    </ErrorLayout>
  );
}
