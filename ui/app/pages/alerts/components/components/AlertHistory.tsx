import { type ReactElement, useEffect, useMemo, useState } from 'react';

import { RulesetHistory } from '../../types/types';
import { getAmpelStatusFillColor } from '../utils/history';
import { AlertChart } from './AlertChart';
import { AlertTable } from './AlertTable';
import { formatDeBerlin } from './formatDate';
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

  const first = transformedData[0];
  const last = transformedData[transformedData.length - 1];
  const chartDescription = first
    ? `Verlauf ${first.analyteName} in ${first.unit}, ${transformedData.length} Messwerte vom ${formatDeBerlin(first.date)} bis ${formatDeBerlin(last.date)}. Die Tabelle enthält dieselben Werte.`
    : '';

  return (
    <div className='flex flex-col gap-4'>
      {hasMoreThanOneDataPoint && (
        <Switcher label='Als Diagramm anzeigen' checked={enabledChart} onChange={setEnabledChart} />
      )}
      {enabledChart ? (
        <figure className='grid grid-cols-1 items-start gap-6 lg:grid-cols-4 lg:gap-x-12'>
          <div className='lg:col-span-3'>
            <AlertChart
              transformedData={transformedData}
              height={hasMoreThanOneDataPoint ? historyHeight : 100}
              title={first ? `Verlauf ${first.analyteName}` : 'Verlauf'}
              description={chartDescription}
            />
          </div>
          <figcaption>
            <StatusLegend />
          </figcaption>
        </figure>
      ) : (
        <AlertTable
          transformedData={transformedData}
          height={hasMoreThanOneDataPoint ? historyHeight : 100}
        />
      )}
    </div>
  );
}
