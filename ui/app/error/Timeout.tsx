import React from 'react';

import { ErrorHeadingLevel, ErrorLayout } from './ErrorLayout';

export const Timeout = ({ level = 1 }: { level?: ErrorHeadingLevel }): React.ReactNode => (
  <ErrorLayout title='Das hat zu lange gedauert...' level={level}>
    <p>Versuchen sie es ein anderes Mal erneut.</p>
  </ErrorLayout>
);
