import { KolHeading } from '@public-ui/react-v19';
import React from 'react';

export const Unauthorized = (): React.ReactNode => (
  <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
    <title>AMPEL-CDSS</title>
    <meta charSet='utf-8' />
    <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <KolHeading _label='Fehlende Berechtigungen' _level={1} />
      <p style={{ maxWidth: '600px', width: 'fit-content', margin: 'auto' }}>
        Sie haben keine Berechtigung, diese Seite zu sehen.
      </p>
      <br />
    </div>
  </div>
);
