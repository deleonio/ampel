import React from 'react';

import { ErrorHeadingLevel, ErrorLayout } from './ErrorLayout';

export const Forbidden = ({ level = 1 }: { level?: ErrorHeadingLevel }): React.ReactNode => (
  <ErrorLayout title='Verboten' level={level}>
    <p>Sie dürfen diese Seite nicht sehen.</p>
  </ErrorLayout>
);
