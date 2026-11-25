import React, { useLayoutEffect, useMemo, useRef } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AmpelStatus } from '../../types/types';
import { formatDeBerlin } from './formatDate';
import { StatusIcon } from './StatusIcon';

interface AlertChartDataPoint {
  date: Date;
  analyteValue: number;
  ampelStatus: AmpelStatus;
  ampelStatusFillColor: string;
  unit: string;
  analyteName: string;
}
interface AlertChartProps {
  transformedData: AlertChartDataPoint[];
  height?: number;
  title?: string;
  description?: string;
}

interface TickProps {
  x: number;
  y: number;
  payload: { value: string | number | Date };
}

export function AlertChart({
  transformedData: data,
  height,
  title,
  description,
}: AlertChartProps): React.ReactNode {
  const pxPerPoint = 80;
  const minWidth = 700;
  const length = data.length;
  const chartWidth = useMemo(() => Math.max(minWidth, length * pxPerPoint), [length]);

  const scrollerRef = useRef<HTMLDivElement>(null);

  // initial scroll to right (and when data length changes)
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // eslint-disable-next-line no-undef
    const id = requestAnimationFrame(() => {
      el.scrollTo({ left: el.scrollWidth, behavior: 'auto' });
    });
    // eslint-disable-next-line no-undef, @typescript-eslint/explicit-function-return-type
    return () => cancelAnimationFrame(id);
  }, [data.length]);

  const DateTimeTick: React.FC<TickProps> = ({ x, y, payload }) => {
    const v = payload.value instanceof Date ? payload.value : new Date(payload.value);
    const [d, t] = formatDeBerlin(v).split(', ');
    return (
      <g transform={`translate(${x},${y})`}>
        <text textAnchor='middle' fontSize={12}>
          <tspan x={0} dy={0}>
            {d}
          </tspan>
          <tspan x={0} dy={14}>
            {t}
          </tspan>
        </text>
      </g>
    );
  };

  const scroll = length > 9;

  if (length === 0) {
    return (
      <div
        style={{ height: height ?? 475 }}
        className='flex w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500'
      >
        Keine Messwerte vorhanden
      </div>
    );
  }

  const first = data[0];

  return (
    // if length of data is over 9 enable horizontal scroll
    <div
      ref={scrollerRef}
      style={{ height: height ?? 475 }}
      className={`w-full ${scroll ? 'overflow-x-auto' : 'overflow-x-hidden'} overflow-y-hidden`}
    >
      <div style={{ width: chartWidth }}>
        <div
          style={{ height: height ?? 475 }}
          className={`w-full ${scroll ? 'overflow-x-auto' : 'overflow-x-hidden'} overflow-y-hidde`}
        >
          <div style={{ width: chartWidth }}>
            <ResponsiveContainer
              width='100%'
              height={height ?? 475}
              className={'overflow-y-hidden'}
            >
              <ComposedChart
                data={data}
                margin={{ top: 30, right: 0, bottom: 0, left: 48 }}
                title={title}
                desc={description}
              >
                <CartesianGrid stroke='#f5f5f5' />
                <Tooltip
                  formatter={(v) => [`${v} ${first.unit}`, first.analyteName]}
                  labelFormatter={(label, payload) => {
                    const raw = payload?.[0]?.payload?.date ?? label; // robust
                    const d = raw instanceof Date ? raw : new Date(raw);
                    return formatDeBerlin(d); // e.g. "23.06.2023, 09:57"
                  }}
                />

                <Line
                  name='Leitanalyt'
                  isAnimationActive={false}
                  yAxisId='right'
                  dataKey='analyteValue'
                  stroke='rgba(91, 33, 182, 0.7)'
                  dot={(props) => {
                    const { index, cx, cy, points } = props;
                    const payload = points?.[index]?.payload as AlertChartDataPoint | undefined;
                    if (cx == null || cy == null || !payload) return null;

                    const isLast = index === data.length - 1;
                    const ampelStatus = payload.ampelStatus;

                    if (isLast) {
                      return (
                        <g key={`dot-${index}`}>
                          <circle
                            cx={cx}
                            cy={cy - 12}
                            r={5}
                            fill={ampelStatus === AmpelStatus.RED ? 'red' : 'white'}
                            stroke='black'
                            strokeWidth={1}
                          />
                          <polygon
                            points={`${cx},${cy - 5} ${cx - 6},${cy + 6} ${cx + 6},${cy + 6}`}
                            fill={ampelStatus === AmpelStatus.YELLOW ? 'yellow' : 'white'}
                            stroke='black'
                            strokeWidth={1}
                          />
                          <rect
                            x={cx - 5.5}
                            y={cy + 8}
                            width={11}
                            height={11}
                            fill={ampelStatus === AmpelStatus.GREEN ? 'limegreen' : 'white'}
                            stroke='black'
                            strokeWidth={1}
                          />
                        </g>
                      );
                    }
                    return (
                      <g key={`dot-${index}`}>
                        <StatusIcon ampelStatus={ampelStatus} cx={cx} cy={cy} index={index} />
                      </g>
                    );
                  }}
                />

                <XAxis
                  dataKey='date'
                  tick={(props) => <DateTimeTick {...props} />}
                  height={60}
                  tickMargin={8}
                  padding={{ left: 20, right: 40 }}
                  interval={0}
                />
                {data.length > 9 && (
                  <YAxis
                    yAxisId='left'
                    dataKey='analyteValue'
                    domain={['dataMin - 15', 'dataMax + 25']}
                    tickCount={7}
                    label={{ value: first.unit, angle: 0, position: 'top', offset: 15 }}
                  />
                )}

                <YAxis
                  yAxisId='right'
                  orientation='right'
                  domain={['dataMin - 15', 'dataMax + 25']}
                  tickCount={7}
                  label={{ value: first.unit, angle: 0, position: 'top', offset: 15 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
