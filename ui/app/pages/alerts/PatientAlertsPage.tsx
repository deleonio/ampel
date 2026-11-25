import { KolDetails, KolDrawer, KolHeading } from '@public-ui/react-v19';
import React, { ReactNode, useRef, useState } from 'react';

import { type PatientHeaderConfig } from '../../patientHeaderConfig';
import { AlertDetailOverlay } from './components/AlertDetailOverlay';
import { PatientMetaDataHeader } from './components/PatientDataHeader';
import { useEqualCardHeight } from './components/utils/useEqualCardHeight';
import { AlertDetails, AmpelStatus, MedicalCaseMetadata } from './types/types';

/**
 * Kartenraster mit einheitlichen Breakpoints. Die Karten teilen sich die Breite gleichmäßig (1fr).
 * Kritisch/Warnend stehen ab lg nebeneinander und haben dann je halb so viele Spalten wie
 * „Unauffällig“ (Abschnittsabstand = Kartenabstand). Die unauffälligen Karten sind je Zeile 1.75rem
 * schmaler, weil KolDetails seinen Inhalt fest einrückt.
 * Die Zeilenhöhe kommt aus useEqualCardHeight: so hoch wie die höchste Karte der Seite.
 */
const CARD_ROWS = 'grid w-full auto-rows-[minmax(var(--card-height,auto),auto)] gap-4';
const HALF_WIDTH_CARD_GRID = `${CARD_ROWS} grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3`;
const FULL_WIDTH_CARD_GRID = `${CARD_ROWS} grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6`;

interface PatientAlertsPageProps {
  medicalCaseMetadata?: MedicalCaseMetadata;
  rulesetsByStatus: Map<AmpelStatus, ReactNode[]>;
  showHeader?: boolean;
  headerConfig?: PatientHeaderConfig;
}

export function PatientAlertsPage({
  medicalCaseMetadata,
  rulesetsByStatus,
  showHeader = true,
  headerConfig,
}: PatientAlertsPageProps): React.ReactNode {
  const [detailOverlayData, setDetailOverlayData] = useState<AlertDetails | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  useEqualCardHeight(cardsRef);

  const displayDetailOverlay = (details: AlertDetails): void => {
    setDetailOverlayData(details);
  };

  const hideDetailOverlay = (): void => {
    setDetailOverlayData(null);
  };

  const drawerContentRef = useRef<HTMLDivElement>(null);

  // Beim Öffnen auf den Diagramm-Schalter fokussieren statt auf „Schließen“.
  // Ohne Verlauf gibt es keinen Schalter; dann bleibt der Standardfokus des Drawers.
  const focusInitialDrawerControl = (open: boolean): void => {
    if (!open) return;
    globalThis.requestAnimationFrame?.(() => {
      const target = drawerContentRef.current?.querySelector<HTMLElement & { focus(): unknown }>(
        '[data-drawer-autofocus] kol-input-checkbox',
      );
      void target?.focus();
    });
  };

  function renderAlertCards(status: AmpelStatus): ReactNode[] {
    const nodes = rulesetsByStatus.get(status) || [];

    return nodes.map((child) => {
      interface AlertCardChildProps {
        onClick?: () => void;
        alertDetails?: AlertDetails;
        disabled?: boolean;
      }
      if (!React.isValidElement<AlertCardChildProps>(child)) return child;

      const childProps = child.props;
      if (childProps.disabled) return child;

      const handleClick = (): void => {
        childProps.onClick?.();
        if (childProps.alertDetails) displayDetailOverlay(childProps.alertDetails);
      };

      return React.cloneElement(child, {
        onClick: handleClick,
      });
    });
  }

  function renderAlertList(status: AmpelStatus, emptyText: string, className: string): ReactNode {
    const cards = renderAlertCards(status);
    if (cards.length === 0) return <p>{emptyText}</p>;

    return (
      <ul role='list' className={className}>
        {cards.map((card, index) => (
          <li key={React.isValidElement(card) && card.key != null ? card.key : index} data-card>
            {card}
          </li>
        ))}
      </ul>
    );
  }

  if (!rulesetsByStatus) return null;
  const hasMetadata = Boolean(medicalCaseMetadata);

  return (
    <div>
      <div className='flex w-full flex-col gap-y-10 pt-4'>
        {showHeader && hasMetadata && medicalCaseMetadata && (
          <PatientMetaDataHeader
            medicalCaseId={medicalCaseMetadata.id}
            patientId={medicalCaseMetadata.patient ? medicalCaseMetadata.patient.id : undefined}
            firstname={
              medicalCaseMetadata.patient ? medicalCaseMetadata.patient.firstname : undefined
            }
            lastname={
              medicalCaseMetadata.patient ? medicalCaseMetadata.patient.lastname : undefined
            }
            dateOfBirth={
              medicalCaseMetadata.patient ? medicalCaseMetadata.patient.dateOfBirth : undefined
            }
            sex={medicalCaseMetadata.patient ? medicalCaseMetadata.patient.sex : 'unbekannt'}
            headerConfig={headerConfig}
          />
        )}

        <KolDrawer
          _label={detailOverlayData ? `Details zu ${detailOverlayData.ruleset}` : 'Details'}
          _level={2}
          _align='right'
          _hasCloser
          _open={Boolean(detailOverlayData)}
          _on={{
            onClose: hideDetailOverlay,
            onCancel: hideDetailOverlay,
            onToggle: focusInitialDrawerControl,
          }}
          data-testid='alert-detail-overlay-panel'
        >
          <div ref={drawerContentRef}>
            {detailOverlayData && (
              <AlertDetailOverlay data={detailOverlayData} key={detailOverlayData.ruleset} />
            )}
          </div>
        </KolDrawer>

        <div ref={cardsRef} className='flex w-full flex-col gap-y-12'>
          <div className='grid grid-cols-1 gap-x-4 gap-y-12 lg:auto-rows-min lg:grid-cols-2'>
            <section className='flex w-full flex-col items-start gap-y-4'>
              <KolHeading
                _label={`Kritische Zustände (${rulesetsByStatus.get(AmpelStatus.RED)?.length ?? 0})`}
                _level={2}
              />
              {renderAlertList(AmpelStatus.RED, 'Keine kritischen Zustände.', HALF_WIDTH_CARD_GRID)}
            </section>
            <section className='flex w-full flex-col items-start gap-y-4'>
              <KolHeading
                _label={`Warnende Zustände (${rulesetsByStatus.get(AmpelStatus.YELLOW)?.length ?? 0})`}
                _level={2}
              />
              {renderAlertList(
                AmpelStatus.YELLOW,
                'Keine warnenden Zustände.',
                HALF_WIDTH_CARD_GRID,
              )}
            </section>
          </div>

          <section className='flex w-full flex-col gap-y-4'>
            <KolDetails
              _label={`Unauffällige Zustände (${rulesetsByStatus.get(AmpelStatus.GREEN)?.length ?? 0})`}
              _level={2}
            >
              <div id='inconspicuous-states-section'>
                {renderAlertList(
                  AmpelStatus.GREEN,
                  'Keine unauffälligen Zustände.',
                  FULL_WIDTH_CARD_GRID,
                )}
              </div>
            </KolDetails>
          </section>
        </div>
      </div>
    </div>
  );
}
