import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PatientAlertsPage } from '../pages/alerts/PatientAlertsPage';
import { AmpelStatus } from '../pages/alerts/types/types';

describe('PatientAlertsPage accessibility', () => {
  afterEach(() => {
    cleanup();
  });

  const rulesetsByStatus = new Map<AmpelStatus, React.ReactNode[]>([
    [AmpelStatus.RED, []],
    [AmpelStatus.YELLOW, []],
    [AmpelStatus.GREEN, []],
  ]);

  it('exposes an accessible toggle for inconspicuous states', () => {
    const { container } = render(
      <PatientAlertsPage rulesetsByStatus={rulesetsByStatus} showHeader={false} />,
    );

    const toggle = screen.getByRole('button', { name: /Unauffällige Zustände \(0\)/i });

    const section = container.querySelector('#inconspicuous-states-section');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(section?.closest('[hidden]')).not.toBeNull();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(section?.closest('[hidden]')).toBeNull();
  });
});
