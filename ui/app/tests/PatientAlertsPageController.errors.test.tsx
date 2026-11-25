import {act, cleanup, render, screen} from '@testing-library/react';
import React, {Suspense} from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ApiResultCollection, MedicalCaseMetadataApiResult} from "../pages/alerts/types/types-api";

vi.stubEnv('VITE_TEST_DATA_VIEW', 'prod');
vi.stubEnv('VITE_FAST_FAKE', '1');

const useLoaderDataMock = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useLoaderData: useLoaderDataMock,
    useNavigation: () => ({state: 'idle'}),
  };
});

const {default: PatientAlertsPageController} =
  await import('../pages/alerts/PatientAlertsPageController');

type SerializableError = {
  message: string;
  status?: number;
  headers?: Record<string, string>;
};

const buildAlertsSample = (caseId: string): ApiResultCollection => ({
  medicalCaseId: caseId,
  scoringSystems: [
    {
      scoringSystemName: 'Probe',
      scoringSystemVersion: '1.0',
      scores: [
        {
          score: 'red' as const,
          severity: 'hoch',
          severityComment: 'Achtung',
          analyteName: 'Na',
          analyteValue: 1,
          analyteValueUnit: 'mmol/l',
          analyteMeasuringTime: new Date('2025-01-01T00:00:00Z').toISOString(),
          resultCreationTime: new Date('2025-01-01T00:05:00Z').toISOString(),
        },
      ],
    },
  ],
});

const buildMetadataSample = (caseId: string): MedicalCaseMetadataApiResult => ({
  medicalCaseId: caseId,
  id: 'P-1',
  firstname: 'Max',
  lastname: 'Mustermann',
  dateOfBirth: '1990-01-01T00:00:00Z',
  sex: 'female' as const,
});

type LoaderDataValue = {
  case_id: string;
  alertsResult: ReturnType<typeof buildAlertsSample> | SerializableError;
  metadataResult: ReturnType<typeof buildMetadataSample> | SerializableError;
};

const buildLoaderData = (): LoaderDataValue => ({
  case_id: 'CASE-123',
  alertsResult: buildAlertsSample('CASE-123'),
  metadataResult: buildMetadataSample('CASE-123'),
});

const setLoaderData = (overrides: Partial<LoaderDataValue> = {}): void => {
  useLoaderDataMock.mockReturnValue({...buildLoaderData(), ...overrides});
};

const renderController = async (): Promise<void> => {
  await act(async () => {
    render(
      <Suspense fallback={<div data-testid='loader'/>}>
        <PatientAlertsPageController/>
      </Suspense>,
    );
  });
};

describe('PatientAlertsPageController partial errors', () => {
  beforeEach(() => {
    useLoaderDataMock.mockReset();
    setLoaderData();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows server error page when alerts return 502', async () => {
    setLoaderData({
      alertsResult: {message: 'HTTP Error: 502 Bad Gateway', status: 502},
      metadataResult: buildMetadataSample('CASE-789'),
    });

    await renderController();

    expect(await screen.findByTestId('alerts-error')).toBeInTheDocument();
    expect(await screen.findByText(/System nicht erreichbar/i)).toBeInTheDocument();
  });

  it('shows inline metadata error while alerts still render', async () => {
    setLoaderData({
      alertsResult: buildAlertsSample('CASE-123'),
      metadataResult: {message: 'Not Found', status: 404},
    });

    await renderController();

    expect(await screen.findByTestId('metadata-error')).toBeInTheDocument();
    expect(
      await screen.findByText(/Keine Patientendaten zur Fallnummer vorhanden/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Unbekannt Unbekannt/i)).toBeInTheDocument();
    expect(await screen.findByText(/kein Geburtsdatum/i)).toBeInTheDocument();
    expect(await screen.findByText('CASE-123')).toBeInTheDocument();
    expect(screen.queryByTestId('alerts-error')).toBeNull();
    expect(await screen.findAllByTestId('critical-alert-card')).not.toHaveLength(0);
  });

  it('shows metadata server error inline for 502 responses', async () => {
    setLoaderData({
      alertsResult: buildAlertsSample('CASE-123'),
      metadataResult: {message: 'HTTP Error: 502 Bad Gateway', status: 502},
    });

    await renderController();

    expect(await screen.findByTestId('metadata-error')).toBeInTheDocument();
    expect(await screen.findByText(/System nicht erreichbar/i)).toBeInTheDocument();
    expect(screen.queryByTestId('alerts-error')).toBeNull();
    expect(await screen.findAllByTestId('critical-alert-card')).not.toHaveLength(0);
  });

  it('shows patient data heading for metadata bad request errors', async () => {
    setLoaderData({
      alertsResult: buildAlertsSample('CASE-123'),
      metadataResult: {message: 'Bad Request', status: 400},
    });

    await renderController();

    expect(await screen.findByTestId('metadata-error')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: /Keine Patientendaten zur Fallnummer vorhanden/i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('alerts-error')).toBeNull();
  });

  it('shows inline alerts error while metadata still renders', async () => {
    setLoaderData({
      case_id: 'CASE-456',
      alertsResult: {message: 'Service offline'},
      metadataResult: buildMetadataSample('CASE-456'),
    });

    await renderController();

    expect(await screen.findByTestId('alerts-error')).toBeInTheDocument();
    expect(await screen.findByText(/Unerwartete Ansicht/i)).toBeInTheDocument();
    expect(screen.queryByTestId('metadata-error')).toBeNull();
    expect(await screen.findByText(/Patientennummer/i)).toBeInTheDocument();
  });

  it('shows CDSS NotFound while patient metadata header remains populated', async () => {
    setLoaderData({
      case_id: 'CASE-999',
      alertsResult: {message: 'Not Found', status: 404},
      metadataResult: buildMetadataSample('CASE-999'),
    });

    await renderController();

    expect(await screen.findByTestId('alerts-error')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: /Keine CDSS-Daten zur Fallnummer vorhanden/i,
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Max Mustermann/i)).toBeInTheDocument();
    expect(await screen.findByText(/P-1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Unbekannt Unbekannt/i)).toBeNull();
    expect(screen.queryByTestId('metadata-error')).toBeNull();
  });

  it('prefers patient not found when patient metadata is unknown and alerts are no-data', async () => {
    setLoaderData({
      case_id: 'CASE-404',
      alertsResult: {message: 'Not Found', status: 404},
      metadataResult: {
        medicalCaseId: 'CASE-404',
        id: 'Unbekannt',
        firstname: 'Unbekannt',
        lastname: 'Unbekannt',
        dateOfBirth: '1990-01-01T00:00:00Z',
        sex: 'female',
      },
    });

    await renderController();

    expect(await screen.findByTestId('metadata-error')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: /Keine Patientendaten zur Fallnummer vorhanden/i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('alerts-error')).toBeNull();
    expect(
      screen.queryByRole('heading', {
        level: 2,
        name: /Keine CDSS-Daten zur Fallnummer vorhanden/i,
      }),
    ).toBeNull();
  });
});

describe('PatientAlertsPageController heading structure', () => {
  beforeEach(() => {
    useLoaderDataMock.mockReset();
    setLoaderData();
  });

  afterEach(() => {
    cleanup();
  });

  it('uses the page purpose as the only level-1 heading', async () => {
    await renderController();

    const h1 = await screen.findAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent('AMPEL-Ergebnisse');
  });
});
