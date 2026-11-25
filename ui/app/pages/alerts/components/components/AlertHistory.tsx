import { type ReactElement, useEffect, useMemo, useState } from 'react';

import { RulesetHistory } from '../../types/types';
import { getAmpelStatusFillColor } from '../utils/history';
import { AlertChart } from './AlertChart';
import { AlertTable } from './AlertTable';
import { StatusLegend } from './StatusLegend';
import { Switcher } from './Switcher';

interface AlertHistoryProps {
  history: RulesetHistory;
}

/**
 * A component to display a history of alerts for a given ruleset.
 *
 * @param {{ history: RulesetHistory }} props
 * @prop {RulesetHistory} history - The history object containing alert data for the ruleset.
 * @returns {React.ReactNode } The rendered alert history component.
 */
export function AlertHistory({ history }: AlertHistoryProps): ReactElement {
  const transformedData = useMemo(
    () =>
      [...history.data]
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((h) => ({
          date: h.date,
          analyteValue: h.analyteValue,
          ampelStatus: h.ampelStatus,
          ampelStatusFillColor: getAmpelStatusFillColor(h.ampelStatus),
          unit: h.unit,
          analyteName: h.analyteName,
        })),
    [history],
  );
  const [enabledChart, setEnabledChart] = useState(false);
  const historyHeight = 475;
  const hasMoreThanOneDataPoint = transformedData.length > 1;

  useEffect(() => {
    setEnabledChart(false);
  }, [history]);

  return (
    <>
      <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-4 lg:gap-x-12'>
        <div className='lg:col-span-3'>
          {enabledChart ? (
            <AlertChart
              transformedData={transformedData}
              height={hasMoreThanOneDataPoint ? historyHeight : 100}
            />
          ) : (
            <AlertTable
              transformedData={transformedData}
              height={hasMoreThanOneDataPoint ? historyHeight : 100}
            />
          )}
        </div>
        <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <StatusLegend />
        </div>
      </div>
      {hasMoreThanOneDataPoint && (
        <Switcher label='Als Diagramm anzeigen' checked={enabledChart} onChange={setEnabledChart} />
      )}
    </>
  );
}
