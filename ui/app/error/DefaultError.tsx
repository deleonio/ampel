import { KolHeading } from '@public-ui/react-v19';
import React from 'react';

import { ErrorLayout } from './ErrorLayout';

export const DefaultError = (): React.ReactNode => (
  <ErrorLayout>
    <title>AMPEL-CDSS</title>
    <meta charSet='utf-8' />
    <KolHeading _label='Unerwartete Ansicht' _level={1} />
    <p style={{ maxWidth: '600px', width: 'fit-content', margin: 'auto' }}>
      Diese Seite sollte im regulearen Ablauf nicht erscheinen. Falls Sie diesen Hinweis sehen, ist
      möglicherweise ein Fehler im Aufruf oder in den Anzeigedaten aufgetreten.
    </p>
  </ErrorLayout>
);
