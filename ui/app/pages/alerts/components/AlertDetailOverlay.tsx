import React from 'react';

import { AlertDetails } from '../types/types';
import { AlertHeader } from './components/AlertHeader';
import { AlertHistory } from './components/AlertHistory';
import { HintMessage } from './components/HintMessage';
import { getLatestSeverity } from './utils/history';

interface OverlayProps {
  data: AlertDetails;
}

/**
 * Inhalt der Detailansicht eines Alerts: Status, Hinweistext und Verlauf.
 * Öffnen, Schließen und Überschrift übernimmt der umgebende KolDrawer.
 */
export function AlertDetailOverlay({ data }: OverlayProps): React.ReactNode {
  const severity = React.useMemo(
    () => getLatestSeverity(data.rulesetHistory),
    [data.rulesetHistory],
  );

  return (
    <div className='flex max-w-[1000px] flex-col gap-y-8'>
      <AlertHeader type={data.ampelStatus} severity={severity} resultTime={data.resultTime} />
      <HintMessage message={data.message} />
      <AlertHistory history={data.rulesetHistory} />
    </div>
  );
}
