import React from 'react';

import { ErrorHeadingLevel, ErrorLayout } from './ErrorLayout';
import {
  DEFAULT_NO_DATA_VARIANT,
  getNoDataErrorHeading,
  type NoDataVariant,
} from './noDataVariant';

export const BadRequest = ({
  variant = DEFAULT_NO_DATA_VARIANT,
  level = 1,
}: {
  variant?: NoDataVariant;
  level?: ErrorHeadingLevel;
}): React.ReactNode => (
  <ErrorLayout title={getNoDataErrorHeading(variant)} level={level}>
    <p>
      Bitte gleichen Sie die Fallnummer mit der Zustandsanzeige im KIS ab. Prüfen Sie, ob zu dieser
      Fallnummer ein Patient geführt wird und ein AMPEL-Ergebnis (grün, gelb oder rot) vorliegt.
      Nehmen sie Kontakt mit uns auf, falls im KIS ein AMPEL-Ergebnis vorliegt.
    </p>
  </ErrorLayout>
);
