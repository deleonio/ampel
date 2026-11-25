import { KolBadge, KolButton, KolCard } from '@public-ui/react-v19';
import React from 'react';

import { AlertDetails, AlertType } from '../types/types';
import { badgeForAlertType } from './utils/status';

interface AlertCardProps {
  title: string;
  message?: string;
  creationTime: Date;
  type: AlertType;
  onClick: () => void;
  alertDetails?: AlertDetails;
  disabled?: boolean;
}

export function formatRelative(d: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const now = new Date();
  const startOfDay = (x: Date): Date => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diffDays = Math.floor((startOfDay(now).getTime() - startOfDay(d).getTime()) / 86400000);

  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());

  if (diffDays === 0) return `Heute, ${hh}:${mm} Uhr`;
  if (diffDays === 1) return `Gestern, ${hh}:${mm} Uhr`;
  if (diffDays === 2) return `Vorgestern, ${hh}:${mm} Uhr`;

  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${hh}:${mm} Uhr`;
}

export function AlertCard({
  title,
  creationTime,
  type,
  onClick,
  disabled = false,
}: AlertCardProps): React.ReactNode {
  const badge = badgeForAlertType(type);

  return (
    <div data-testid={type === AlertType.Warning ? 'warning-alert-card' : 'critical-alert-card'}>
      <KolCard _label={title} _level={3}>
        <div className='flex flex-col gap-3'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <KolBadge _label={badge.label} _color={badge.color} />
            <span className='font-mono text-sm'>{formatRelative(creationTime)}</span>
          </div>
          {!disabled && (
            <KolButton
              _label={`Details zu ${title} anzeigen`}
              _variant='secondary'
              _on={{ onClick: () => onClick() }}
            />
          )}
        </div>
      </KolCard>
    </div>
  );
}
