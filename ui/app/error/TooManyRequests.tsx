import { KolHeading } from '@public-ui/react-v19';
import React from 'react';

import { Countdown } from './Countdown';
import { ErrorLayout } from './ErrorLayout';

interface CountdownProps {
  retryAfterMs?: number | null;
  id?: string;
  updateMs?: number;
  log?: boolean;
}

/** Zeigt verbleibende Sekunden in ein <span> und aktualisiert per client-side timer. */
export function TooManyRequests({
  retryAfterMs = 30000,
  id = 'reload-countdown',
  updateMs = 250,
  log = false,
}: CountdownProps): React.ReactNode {
  return (
    <ErrorLayout>
      <title>AMPEL-CDSS</title>
      <meta charSet='utf-8' />
      <KolHeading _label='Zu viele Anfragen in kurzer Zeit' _level={1} />
      <p style={{ maxWidth: '600px', width: 'fit-content', margin: 'auto' }}>
        Bitte warten sie{' '}
        <Countdown retryAfterMs={retryAfterMs} id={id} updateMs={updateMs} log={log} /> Sekunden bis
        sie weitere anfragen stellen.
      </p>
      <br />
    </ErrorLayout>
  );
}
