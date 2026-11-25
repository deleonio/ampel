import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import { Suspense } from 'react';

vi.stubEnv('VITE_TEST_DATA_VIEW', 'test');
vi.stubEnv('VITE_FAST_FAKE', '1');

beforeAll(() => {
  Object.defineProperty(window.HTMLElement.prototype, 'scrollTo', {
    value: () => {},
    writable: true,
  });
});
afterAll(() => {
  vi.useRealTimers();
});

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  const { FakeAmpelResultRepository } = await import('./FakeAmpelResultRepository');
  const [data, medicalCaseMetadata] = await Promise.all([
    FakeAmpelResultRepository.uiFakesToApi('CASEID'),
    FakeAmpelResultRepository.generateFakePatientMetaData(),
  ]);
  return {
    ...actual,
    useLoaderData: () => ({
      case_id: 'CASEID',
      alertsResult: data,
      metadataResult: medicalCaseMetadata,
    }),
    useNavigation: () => ({ state: 'idle' }),
  };
});

const { default: PatientAlertsPageController } =
  await import('../pages/alerts/PatientAlertsPageController');

async function openDetails(cardTestId: string): Promise<void> {
  const card = (await screen.findAllByTestId(cardTestId))[0];
  fireEvent.click(within(card).getByRole('button', { name: /Details zu .* anzeigen/ }));
}

describe('PatientAlertsPage Integration', () => {
  beforeEach(async () => {
    await act(async () => {
      render(
        <Suspense fallback={<div />}>
          <PatientAlertsPageController />
        </Suspense>,
      );
    });
  });

  it('displays all main sections & counts (snapshot stable)', async () => {
    await screen.findAllByTestId('critical-alert-card');
    await screen.findByText(/Kritische Zustände/);
    await screen.findByText(/Warnende Zustände/);
    await screen.findByText(/Unauffällige Zustände/);

    expect((await screen.findAllByTestId('critical-alert-card')).length).toBe(3);
    expect((await screen.findAllByTestId('warning-alert-card')).length).toBe(1);
    expect((await screen.findAllByTestId('inconspicuous-state-card')).length).toBe(9);

    expect(document.body).toMatchSnapshot('page-initial');
  });

  it('opens & closes the detail view of critical alerts (snapshots)', async () => {
    await openDetails('critical-alert-card');

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('data-testid', 'alert-detail-overlay-panel');

    expect(document.body).toMatchSnapshot('alert-overlay-open');

    fireEvent.click(await screen.findByRole('switch'));

    expect(document.body).toMatchSnapshot('alert-overlay-open-diagramm');

    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));

    expect(document.body).toMatchSnapshot('alert-overlay-closed');
  });

  it('opens & closes the detail view of warning alerts (snapshots)', async () => {
    await openDetails('warning-alert-card');

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('data-testid', 'alert-detail-overlay-panel');

    expect(document.body).toMatchSnapshot('warning-overlay-open');

    fireEvent.click(await screen.findByRole('switch'));

    expect(document.body).toMatchSnapshot('warning-overlay-open-diagramm');

    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));

    expect(document.body).toMatchSnapshot('warning-overlay-closed');
  });

  it('keeps the detail overlay hidden after closing it', async () => {
    await openDetails('critical-alert-card');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
