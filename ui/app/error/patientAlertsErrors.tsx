import React, { ReactNode } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';

import { BadRequest } from './BadRequest';
import { DefaultError } from './DefaultError';
import type { ErrorHeadingLevel } from './ErrorLayout';
import { Forbidden } from './Forbidden';
import { LoadingStatus } from './LoadingStatus';
import { MaintenanceError } from './MaintenanceError';
import { DEFAULT_NO_DATA_VARIANT, type NoDataVariant } from './noDataVariant';
import { NotFound } from './NotFound';
import { toNumericStatus } from './patientAlertsData';
import { StatusError } from './patientAlertsTypes';
import { ServerError } from './ServerError';
import { Timeout } from './Timeout';
import { TooManyRequests } from './TooManyRequests';
import { Unauthorized } from './Unauthorized';

export const DEFAULT_RETRY_AFTER_MS = 1000 * 60 * 5; // 5min
export const SECTION_DEFAULT_RETRY_AFTER_MS = DEFAULT_RETRY_AFTER_MS;

function parseRetryAfterMs(retryAfter: string | null | undefined): number | null {
  if (!retryAfter) return null;

  const numeric = Number(retryAfter);
  if (!Number.isNaN(numeric)) return Math.max(0, numeric) * 1000;

  const dateMs = Date.parse(retryAfter);
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());

  return null;
}

function getHeadersFrom(err: unknown): Headers | Record<string, string> | undefined {
  if (!err || typeof err !== 'object' || !('headers' in err)) return undefined;

  const headers = (err as { headers?: unknown }).headers;
  if (headers instanceof Headers) return headers;
  if (headers && typeof headers === 'object') return headers as Record<string, string>;

  return undefined;
}

function extractRetryAfterMs(headers: Headers | Record<string, string> | undefined): number | null {
  if (!headers) return null;

  if (headers instanceof Headers) {
    return parseRetryAfterMs(headers.get('retry-after'));
  }

  return parseRetryAfterMs(headers['retry-after'] ?? headers['Retry-After']);
}

function parseHttpStatus(err: unknown): { status: number; retryAfterMs: number | null } | null {
  if (isRouteErrorResponse(err)) {
    return { status: err.status, retryAfterMs: extractRetryAfterMs(getHeadersFrom(err)) };
  }

  if (err instanceof Response) {
    return { status: err.status, retryAfterMs: extractRetryAfterMs(getHeadersFrom(err)) };
  }

  if (err && typeof err === 'object' && 'status' in err) {
    const status = toNumericStatus((err as StatusError).status);
    const retryAfterMs = extractRetryAfterMs(getHeadersFrom(err));
    if (status !== null) {
      return { status, retryAfterMs };
    }
  }

  if (err && typeof err === 'object' && 'statusCode' in err) {
    const statusCode = (err as { statusCode?: unknown }).statusCode;
    const status = toNumericStatus(statusCode);
    if (status !== null) return { status, retryAfterMs: extractRetryAfterMs(getHeadersFrom(err)) };
  }

  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: unknown }).response;
    if (response && typeof response === 'object' && 'status' in response) {
      const status = toNumericStatus((response as { status?: unknown }).status);
      if (status !== null) {
        return {
          status,
          retryAfterMs: extractRetryAfterMs(
            getHeadersFrom(response as { headers?: Headers | Record<string, string> }),
          ),
        };
      }
    }
  }

  if (err instanceof Error) {
    const match = /HTTP Error:\s*(\d{3})/i.exec(err.message);
    if (match) return { status: Number(match[1]), retryAfterMs: null };

    // Some environments hide details in cause; inspect it as a last resort
    if (err.cause) {
      const nested = parseHttpStatus(err.cause as unknown);
      if (nested) return nested;
    }
  }

  return null;
}

const sectionByStatus: Partial<
  Record<
    number,
    (ctx: {
      retryAfterMs: number | null;
      variant: NoDataVariant;
      level: ErrorHeadingLevel;
    }) => ReactNode
  >
> = {
  400: ({ variant, level }) => <BadRequest variant={variant} level={level} />,
  401: ({ level }) => <Unauthorized level={level} />,
  403: ({ level }) => <Forbidden level={level} />,
  404: ({ variant, level }) => <NotFound variant={variant} level={level} />,
  408: ({ level }) => <Timeout level={level} />,
  410: ({ variant, level }) => <NotFound variant={variant} level={level} />,
  422: ({ variant, level }) => <BadRequest variant={variant} level={level} />,
  429: ({ retryAfterMs, level }) => (
    <TooManyRequests retryAfterMs={retryAfterMs ?? SECTION_DEFAULT_RETRY_AFTER_MS} level={level} />
  ),
  500: ({ retryAfterMs, level }) => (
    <ServerError retryAfterMs={retryAfterMs ?? SECTION_DEFAULT_RETRY_AFTER_MS} level={level} />
  ),
  502: ({ retryAfterMs, level }) => (
    <ServerError retryAfterMs={retryAfterMs ?? SECTION_DEFAULT_RETRY_AFTER_MS} level={level} />
  ),
  503: ({ retryAfterMs, level }) => (
    <MaintenanceError retryAfterMs={retryAfterMs ?? SECTION_DEFAULT_RETRY_AFTER_MS} level={level} />
  ),
  504: ({ retryAfterMs, level }) => (
    <ServerError retryAfterMs={retryAfterMs ?? SECTION_DEFAULT_RETRY_AFTER_MS} level={level} />
  ),
};

function renderHttpError(
  error: unknown,
  defaultRetryAfterMs: number,
  variant: NoDataVariant = DEFAULT_NO_DATA_VARIANT,
  level: ErrorHeadingLevel = 1,
): React.ReactNode {
  const ctx = parseHttpStatus(error);
  if (ctx) {
    const view = sectionByStatus[ctx.status];
    if (view) {
      return view({ retryAfterMs: ctx.retryAfterMs ?? defaultRetryAfterMs, variant, level });
    }
  }

  return <DefaultError level={level} />;
}

export function renderSectionError(
  error: unknown,
  variant: NoDataVariant = DEFAULT_NO_DATA_VARIANT,
): React.ReactNode {
  return renderHttpError(error, SECTION_DEFAULT_RETRY_AFTER_MS, variant, 2);
}

export function ErrorBoundary(): React.ReactNode {
  const err = useRouteError();
  return renderHttpError(err, DEFAULT_RETRY_AFTER_MS);
}

export class SectionErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback: React.ReactNode | ((error: unknown) => React.ReactNode);
  },
  { error: unknown | null }
> {
  state: { error: unknown | null } = { error: null };

  static getDerivedStateFromError(error: unknown): { error: unknown } {
    return { error };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    globalThis.console?.error?.('Section error boundary caught', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      const { fallback } = this.props;
      return typeof fallback === 'function' ? fallback(this.state.error) : fallback;
    }

    return this.props.children;
  }
}

export function SectionErrorPanel({
  error,
  dataTestId,
  variant = DEFAULT_NO_DATA_VARIANT,
}: {
  error: unknown;
  dataTestId?: string;
  variant?: NoDataVariant;
}): React.ReactNode {
  return (
    <div data-testid={dataTestId} className='mt-4'>
      {renderSectionError(error, variant)}
    </div>
  );
}

export function PageSkeleton(): React.ReactNode {
  return <LoadingStatus label='AMPEL-Ergebnisse werden geladen' testId='alerts-skeleton' />;
}
