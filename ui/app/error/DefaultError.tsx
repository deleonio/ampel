import React from 'react';

import { ErrorHeadingLevel, ErrorLayout } from './ErrorLayout';

export const DefaultError = ({ level = 1 }: { level?: ErrorHeadingLevel }): React.ReactNode => (
  <ErrorLayout title='Unerwartete Ansicht' level={level}>
    <p>
      Diese Seite sollte im regulearen Ablauf nicht erscheinen. Falls Sie diesen Hinweis sehen, ist
      möglicherweise ein Fehler im Aufruf oder in den Anzeigedaten aufgetreten.
    </p>
  </ErrorLayout>
);
