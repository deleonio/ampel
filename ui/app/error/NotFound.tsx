import { KolHeading } from '@public-ui/react-v19';
import React from 'react';

import { ErrorLayout } from './ErrorLayout';
import {
  DEFAULT_NO_DATA_VARIANT,
  getNoDataErrorHeading,
  type NoDataVariant,
} from './noDataVariant';

export const NotFound = ({
  variant = DEFAULT_NO_DATA_VARIANT,
}: {
  variant?: NoDataVariant;
}): React.ReactNode => (
  <ErrorLayout>
    <title>AMPEL-CDSS</title>
    <meta charSet='utf-8' />
    <KolHeading _label={getNoDataErrorHeading(variant)} _level={1} />
    <p style={{ maxWidth: '600px', width: 'fit-content', margin: 'auto' }}>
      Bitte gleichen Sie die Fallnummer mit der Zustandsanzeige im KIS ab. Prüfen Sie, ob zu dieser
      Fallnummer ein Patient geführt wird und ein AMPEL-Ergebnis (grün, gelb oder rot) vorliegt.
      Nehmen sie Kontakt mit uns auf, falls im KIS ein AMPEL-Ergebnis vorliegt.
    </p>
    <br />
  </ErrorLayout>
);
