import React from 'react';

import { ErrorHeadingLevel, ErrorLayout } from './ErrorLayout';

export const Unauthorized = ({ level = 1 }: { level?: ErrorHeadingLevel }): React.ReactNode => (
  <ErrorLayout title='Fehlende Berechtigungen' level={level}>
    <p>Sie haben keine Berechtigung, diese Seite zu sehen.</p>
  </ErrorLayout>
);
