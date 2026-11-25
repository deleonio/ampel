import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  SECTION_DEFAULT_RETRY_AFTER_MS,
  SectionErrorBoundary,
  renderSectionError,
} from '../error/patientAlertsErrors';

const tooManyRequestsSpy = vi.fn();
const serverErrorSpy = vi.fn();
const maintenanceSpy = vi.fn();

vi.mock('../error/TooManyRequests', () => ({
  TooManyRequests: (props: { retryAfterMs?: number | null }) => {
    tooManyRequestsSpy(props);
    return <div data-testid='too-many-requests'>retry: {props.retryAfterMs}</div>;
  },
}));

vi.mock('../error/ServerError', () => ({
  ServerError: (props: { retryAfterMs?: number | null }) => {
    serverErrorSpy(props);
    return <div data-testid='server-error'>retry: {props.retryAfterMs}</div>;
  },
}));

vi.mock('../error/MaintenanceError', () => ({
  MaintenanceError: (props: { retryAfterMs?: number | null }) => {
    maintenanceSpy(props);
    return <div data-testid='maintenance'>retry: {props.retryAfterMs}</div>;
  },
}));

describe('patientAlertsErrors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders TooManyRequests with parsed retry-after seconds', () => {
    const err = { status: '429', headers: { 'retry-after': '2' } };

    render(<>{renderSectionError(err)}</>);

    expect(screen.getByTestId('too-many-requests')).toHaveTextContent('2000');
    expect(tooManyRequestsSpy).toHaveBeenCalledWith({ retryAfterMs: 2000, level: 2 });
  });

  it('prefers statusCode and parses RFC date retry-after headers', () => {
    const retryDate = new Date(Date.now() + 5000).toUTCString();
    const err = { statusCode: '503', headers: new Headers({ 'Retry-After': retryDate }) };

    render(<>{renderSectionError(err)}</>);

    expect(maintenanceSpy).toHaveBeenCalled();
    const retryAfterMs = maintenanceSpy.mock.calls[0][0].retryAfterMs as number;
    expect(retryAfterMs).toBeGreaterThan(0);
  });

  it('falls back to default retry when retry-after header is invalid', () => {
    const err = { response: { status: '500', headers: { 'Retry-After': 'never' } } };

    render(<>{renderSectionError(err)}</>);

    expect(serverErrorSpy).toHaveBeenCalled();
    const retryAfterMs = serverErrorSpy.mock.calls[0][0].retryAfterMs as number;
    expect(retryAfterMs).toBe(SECTION_DEFAULT_RETRY_AFTER_MS);
  });

  it('renders patient specific no-data text when requested', () => {
    render(<>{renderSectionError({ status: 404 }, 'patient')}</>);
    expect(screen.getByText(/Keine Patientendaten zur Fallnummer vorhanden/i)).toBeInTheDocument();
  });

  it('extracts status codes from error messages and causes', () => {
    render(<>{renderSectionError(new Error('HTTP Error: 504 Gateway Timeout'))}</>);
    expect(serverErrorSpy).toHaveBeenCalled();

    const outer = new Error('wrapped');
    (outer as { cause?: unknown }).cause = new Error('HTTP Error: 401 Unauthorized');
    render(<>{renderSectionError(outer)}</>);
    expect(screen.getByText(/Fehlende Berechtigungen/i)).toBeInTheDocument();
  });

  it('SectionErrorBoundary renders fallback when children throw', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const Thrower = (): React.ReactNode => {
      throw new Error('explode');
    };

    render(
      <SectionErrorBoundary fallback={(error) => <div data-testid='boundary'>{String(error)}</div>}>
        <Thrower />
      </SectionErrorBoundary>,
    );

    expect(screen.getByTestId('boundary')).toHaveTextContent('explode');
    consoleSpy.mockRestore();
  });
});
