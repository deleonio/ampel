import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Suspense } from 'react';

vi.stubEnv('VITE_TEST_DATA_VIEW', 'demo');
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
  const { FakeDemoAmpelResultRepository } = await import('./DemoFakeAmpelResultRepository');
  const [data, medicalCaseMetadata] = await Promise.all([
    FakeDemoAmpelResultRepository.uiDemoFakesToApi('CASEID'),
    FakeDemoAmpelResultRepository.generateDemoFakePatientMetaData(),
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

describe('PatientAlertsPage Demo Mode', () => {
  beforeEach(async () => {
    await act(async () => {
      render(
        <Suspense fallback={<div />}>
          <PatientAlertsPageController />
        </Suspense>,
      );
    });
  });

  it('shows the fictive yellow Testalarm ruleset', async () => {
    expect(await screen.findByText('Testalarm')).toBeInTheDocument();
  });

  it('shows the default product logo without a clinic logo', async () => {
    expect((await screen.findAllByAltText('Header Logo')).length).toBeGreaterThan(0);
    expect(screen.queryByAltText('Clinical Logo')).toBeNull();
  });

  it('keeps yellow/green cards non-clickable in demo while red stays clickable', async () => {
    const detailsButton = /Details zu .* anzeigen/;

    const warning = (await screen.findAllByTestId('warning-alert-card'))[0];
    expect(within(warning).queryByRole('button', { name: detailsButton })).toBeNull();

    const green = (await screen.findAllByTestId('inconspicuous-state-card'))[0];
    expect(within(green).queryByRole('button', { name: detailsButton })).toBeNull();

    const red = (await screen.findAllByTestId('critical-alert-card'))[0];
    fireEvent.click(within(red).getByRole('button', { name: detailsButton }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
