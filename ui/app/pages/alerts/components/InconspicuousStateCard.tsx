import { KolButton, KolCard } from '@public-ui/react-v19';
import type { ReactElement } from 'react';

import { AlertDetails, AlertType } from '../types/types';
import { formatDeBerlin } from './components/formatDate';

interface InconspicuousStateProps {
  title: string;
  type: AlertType;
  creationTime: Date;
  onClick: () => void;
  alertDetails?: AlertDetails;
  disabled?: boolean;
}

export function InconspicuousStateCard({
  title,
  creationTime,
  onClick,
  disabled = false,
}: InconspicuousStateProps): ReactElement {
  return (
    <div data-testid='inconspicuous-state-card'>
      <KolCard _label={title} _level={3}>
        <div className='flex flex-col gap-3'>
          <span className='text-sm'>
            festgestellt am:{' '}
            <time className='font-mono' dateTime={creationTime.toISOString()}>
              {formatDeBerlin(creationTime)}
            </time>
          </span>
          {!disabled && (
            <KolButton
              _label={`Details zu ${title} anzeigen`}
              _variant='tertiary'
              _on={{ onClick: () => onClick() }}
            />
          )}
        </div>
      </KolCard>
    </div>
  );
}
