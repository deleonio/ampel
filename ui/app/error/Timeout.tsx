import { KolHeading } from '@public-ui/react-v19';
import React from 'react';

import { ErrorLayout } from './ErrorLayout';

export const Timeout = (): React.ReactNode => (
  <ErrorLayout>
    <title>AMPEL-CDSS</title>
    <meta charSet='utf-8' />
    <KolHeading _label='Das hat zu lange gedauert...' _level={1} />
    <p style={{ maxWidth: '600px', width: 'fit-content', margin: 'auto' }}>
      Versuchen sie es ein anderes Mal erneut.
    </p>
    <br />
  </ErrorLayout>
);
