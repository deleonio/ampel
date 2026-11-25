import React from 'react';

import { StatusIcon } from './StatusIcon';

/**
 * Renders a legend for the status icons used in the application.
 * The legend displays three different statuses:
 * - Red (Rot) for Critical (Kritisch)
 * - Yellow (Gelb) for Warning (Warnung)
 * - Green (Grün) for Normal
 * Each status is accompanied by an icon generated using the StatusIcon component.
 * This component helps users understand the meaning of the status icons
 * that appear in charts and other visualizations.
 */

const LEGEND = [
  { status: 1, text: 'Quadrat, grün: Normal' },
  { status: 2, text: 'Dreieck, gelb: Warnung' },
  { status: 3, text: 'Kreis, rot: Kritisch' },
];

export function StatusLegend(): React.ReactNode {
  return (
    <ul aria-label='Legende' className='mt-2 flex flex-col items-start gap-2 text-sm'>
      {LEGEND.map(({ status, text }) => (
        <li key={status} className='flex items-center gap-2'>
          <svg width={14} height={14} aria-hidden='true' focusable='false'>
            <StatusIcon ampelStatus={status} cx={7} cy={7} index={0} />
          </svg>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}
