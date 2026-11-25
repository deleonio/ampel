import { KolHeading } from '@public-ui/react-v19';
import React from 'react';

import { ErrorLayout } from './ErrorLayout';

export const Forbidden = (): React.ReactNode => (
  <ErrorLayout>
    <title>AMPEL-CDSS</title>
    <meta charSet='utf-8' />
    <KolHeading _label='Verboten' _level={1} />
    <p style={{ maxWidth: '600px', width: 'fit-content', margin: 'auto' }}>
      Sie dürfen diese Seite nicht sehen.
    </p>
    <br />
  </ErrorLayout>
);
