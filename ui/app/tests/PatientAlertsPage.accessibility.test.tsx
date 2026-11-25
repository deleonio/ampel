import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

  it('announces empty sections instead of rendering empty grids', () => {
    render(<PatientAlertsPage rulesetsByStatus={rulesetsByStatus} showHeader={false} />);

    expect(screen.getByText('Keine kritischen Zustände.')).toBeInTheDocument();
    expect(screen.getByText('Keine warnenden Zustände.')).toBeInTheDocument();
    expect(screen.queryAllByRole('list')).toHaveLength(0);
  });

  it('renders alert cards as list items', () => {
    const withCards = new Map<AmpelStatus, React.ReactNode[]>([
      [AmpelStatus.RED, [<span key='a'>Karte A</span>, <span key='b'>Karte B</span>]],
      [AmpelStatus.YELLOW, []],
      [AmpelStatus.GREEN, []],
    ]);
    render(<PatientAlertsPage rulesetsByStatus={withCards} showHeader={false} />);

    const [list] = screen.getAllByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });
});
