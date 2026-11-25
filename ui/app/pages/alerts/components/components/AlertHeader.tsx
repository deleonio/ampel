import { KolBadge } from '@public-ui/react-v19';
import type { ReactElement } from 'react';

import { AlertType } from '../../types/types';
import { badgeForAlertType } from '../utils/status';

interface AlertHeaderProps {
  type: AlertType;
  severity?: string | null | undefined;
}

export function AlertHeader({ type, severity }: AlertHeaderProps): ReactElement {
  const badge = badgeForAlertType(type);

  return (
    <div className='flex flex-row flex-wrap items-center gap-x-4 gap-y-2'>
      <KolBadge _label={badge.label} _color={badge.color} />
      {severity && <span className='text-lg font-medium'>{severity}</span>}
    </div>
  );
}
