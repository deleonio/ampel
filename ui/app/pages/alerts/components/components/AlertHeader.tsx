import { KolBadge } from '@public-ui/react-v19';
import type { ReactElement } from 'react';

import { AlertType } from '../../types/types';
import { badgeForAlertType } from '../utils/status';
import { formatDeBerlin } from './formatDate';

interface AlertHeaderProps {
  type: AlertType;
  severity?: string | null | undefined;
  resultTime?: Date;
}

export function AlertHeader({ type, severity, resultTime }: AlertHeaderProps): ReactElement {
  const badge = badgeForAlertType(type);
  const hasTime = resultTime instanceof Date && !Number.isNaN(resultTime.getTime());

  return (
    <dl className='flex flex-row flex-wrap items-center gap-x-8 gap-y-2'>
      <div className='flex items-center gap-2'>
        <dt>Status</dt>
        <dd>
          <KolBadge _label={badge.label} _color={badge.color} />
        </dd>
      </div>
      {severity && (
        <div className='flex items-center gap-2'>
          <dt>Schweregrad</dt>
          <dd className='font-bold'>{severity}</dd>
        </div>
      )}
      {hasTime && (
        <div className='flex items-center gap-2'>
          <dt>Berechnet am</dt>
          <dd className='font-bold'>
            <time dateTime={resultTime.toISOString()}>{formatDeBerlin(resultTime)}</time>
          </dd>
        </div>
      )}
    </dl>
  );
}
