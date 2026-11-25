import { KolDetails, KolDrawer, KolHeading } from '@public-ui/react-v19';
import React, { ReactNode, useState } from 'react';

import { type PatientHeaderConfig } from '../../patientHeaderConfig';
import { AlertDetailOverlay } from './components/AlertDetailOverlay';
import { PatientMetaDataHeader } from './components/PatientDataHeader';
import { AlertDetails, AmpelStatus, MedicalCaseMetadata } from './types/types';

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

  const displayDetailOverlay = (details: AlertDetails): void => {
    setDetailOverlayData(details);
  };

  const hideDetailOverlay = (): void => {
    setDetailOverlayData(null);
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

  if (!rulesetsByStatus) return null;
  const hasMetadata = Boolean(medicalCaseMetadata);

  return (
    <div className='h-full pl-4'>
      <div className='flex h-full w-full flex-col gap-y-10 pt-4'>
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
          _label={detailOverlayData?.ruleset ?? 'Details'}
          _level={2}
          _align='right'
          _hasCloser
          _open={Boolean(detailOverlayData)}
          _on={{ onClose: hideDetailOverlay, onCancel: hideDetailOverlay }}
          data-testid='alert-detail-overlay-panel'
        >
          {detailOverlayData && (
            <AlertDetailOverlay data={detailOverlayData} key={detailOverlayData.ruleset} />
          )}
        </KolDrawer>

        <div className='ml-2 flex h-full w-full flex-col gap-y-20 pr-4'>
          <div className='grid grid-cols-1 gap-12 lg:auto-rows-min lg:grid-cols-2'>
            <section className='flex w-full flex-col items-start gap-y-4'>
              <KolHeading
                _label={`Kritische Zustände (${rulesetsByStatus.get(AmpelStatus.RED)?.length ?? 0})`}
                _level={2}
              />
              <div className='grid w-full grid-cols-1 gap-4 sm:grid-cols-2'>
                {renderAlertCards(AmpelStatus.RED)}
              </div>
            </section>
            <section className='flex w-full flex-col items-start gap-y-4'>
              <KolHeading
                _label={`Warnende Zustände (${rulesetsByStatus.get(AmpelStatus.YELLOW)?.length ?? 0})`}
                _level={2}
              />
              <div className='grid w-full grid-cols-1 gap-4 sm:grid-cols-2'>
                {renderAlertCards(AmpelStatus.YELLOW)}
              </div>
            </section>
          </div>

          <section className='flex w-full flex-col gap-y-4 pr-4'>
            <KolDetails
              _label={`Unauffällige Zustände (${rulesetsByStatus.get(AmpelStatus.GREEN)?.length ?? 0})`}
              _level={2}
            >
              <div
                id='inconspicuous-states-section'
                className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
              >
                {renderAlertCards(AmpelStatus.GREEN)}
              </div>
            </KolDetails>
          </section>
        </div>
      </div>
    </div>
  );
}
