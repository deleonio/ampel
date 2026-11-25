import React, { ReactNode, use, useMemo } from 'react';

import { NotFound } from '../../error/NotFound';
import { extractError, pickPrimaryError } from '../../error/patientAlertsData';
import { SectionErrorPanel } from '../../error/patientAlertsErrors';
import { StatusError } from '../../error/patientAlertsTypes';
import { AlertCard } from './components/AlertCard';
import { InconspicuousStateCard } from './components/InconspicuousStateCard';
import { PatientMetaDataHeader } from './components/PatientDataHeader';
import { PatientAlertsPage } from './PatientAlertsPage';
import { apiToRulesets, medicalCaseMetadataApiToUI } from './types/api-to-ui';
import { AlertType, AmpelStatus } from './types/types';
import { ApiResultCollection, MedicalCaseMetadataApiResult } from './types/types-api';

interface CombinedPromise {
  combinedPromise: Promise<
    [
      PromiseSettledResult<MedicalCaseMetadataApiResult | StatusError>,
      PromiseSettledResult<ApiResultCollection | StatusError>,
    ]
  >;
  caseId: string;
}

export function PageContent({ caseId, combinedPromise }: CombinedPromise): React.ReactNode {
  const [metadataResult, alertsResult] = use(combinedPromise);

  const metadataError = extractError(metadataResult);
  const alertsError = extractError(alertsResult);
  const primaryError = pickPrimaryError(alertsError, metadataError);
  const metadataNotFound = metadataError?.status === 404 || metadataError?.status === 410;

  const metadata =
    metadataError || metadataResult.status !== 'fulfilled' || metadataResult.value instanceof Error
      ? null
      : (metadataResult.value as MedicalCaseMetadataApiResult);
  const alerts =
    alertsError || alertsResult.status !== 'fulfilled' || alertsResult.value instanceof Error
      ? null
      : (alertsResult.value as ApiResultCollection);
  const alertsDataMissing = Boolean(alerts) && alerts.scoringSystems.length === 0;

  return (
    <>
      {metadata ? (
        <MetadataSection metadata={metadata} />
      ) : (
        <div data-testid='metadata-error'>
          <MetadataFallback caseId={caseId} />
          {metadataError && !alertsError ? (
            metadataNotFound ? (
              <div className='mt-4'>
                <NotFound variant='patient' level={2} />
              </div>
            ) : (
              <div className='mt-4'>
                <SectionErrorPanel error={metadataError} variant='patient' />
              </div>
            )
          ) : null}
        </div>
      )}
      {alertsDataMissing ? (
        <SectionErrorPanel
          error={{ status: 404, message: 'No CDSS data found for case' }}
          dataTestId='alerts-error'
        />
      ) : alerts ? (
        <AlertsSection alertsData={alerts} />
      ) : primaryError ? (
        <SectionErrorPanel error={primaryError} dataTestId='alerts-error' />
      ) : null}
    </>
  );
}

function MetadataFallback({ caseId }: { caseId: string }): React.ReactNode {
  return (
    <div className='mt-4'>
      <PatientMetaDataHeader
        firstname={undefined}
        lastname={undefined}
        patientId={undefined}
        medicalCaseId={caseId}
        sex={undefined}
        dateOfBirth={undefined}
      />
    </div>
  );
}

function MetadataSection({
  metadata,
}: {
  metadata: MedicalCaseMetadataApiResult;
}): React.ReactNode {
  const mapped = medicalCaseMetadataApiToUI(metadata);
  return (
    <PatientMetaDataHeader
      medicalCaseId={mapped.id}
      patientId={mapped.patient ? mapped.patient.id : undefined}
      firstname={mapped.patient ? mapped.patient.firstname : undefined}
      lastname={mapped.patient ? mapped.patient.lastname : undefined}
      dateOfBirth={mapped.patient ? mapped.patient.dateOfBirth : undefined}
      sex={mapped.patient ? mapped.patient.sex : 'unbekannt'}
    />
  );
}

function AlertsSection({ alertsData }: { alertsData: ApiResultCollection }): React.ReactNode {
  const rulesetsByStatus = useMemo(() => {
    const grouped = new Map<AmpelStatus, ReactNode[]>([
      [AmpelStatus.RED, []],
      [AmpelStatus.YELLOW, []],
      [AmpelStatus.GREEN, []],
    ]);

    const rulesets = apiToRulesets(alertsData);

    for (const rs of rulesets) {
      const latest = rs?.history?.data?.length
        ? rs.history.data.reduce((acc, cur) => {
            const a = acc?.date instanceof Date ? acc.date.getTime() : -Infinity;
            const c = cur?.date instanceof Date ? cur.date.getTime() : -Infinity;
            return c > a ? cur : acc;
          })
        : null;

      const creationTime =
        rs?.resultTime ?? (latest?.date instanceof Date ? latest.date : undefined);

      if (rs.ampelStatus === AmpelStatus.RED) {
        grouped.get(AmpelStatus.RED)!.push(
          <AlertCard
            key={rs.ruleset}
            type={AlertType.Critical}
            title={rs.ruleset}
            creationTime={creationTime}
            alertDetails={{
              ruleset: rs.ruleset,
              ampelStatus: AlertType.Critical,
              message: rs.message,
              resultTime: rs.resultTime,
              rulesetHistory: rs.history,
              links: rs.links || [],
            }}
            onClick={() => {}}
          />,
        );
      } else if (rs.ampelStatus === AmpelStatus.YELLOW) {
        grouped.get(AmpelStatus.YELLOW)!.push(
          <AlertCard
            key={rs.ruleset}
            type={AlertType.Warning}
            title={rs.ruleset}
            creationTime={creationTime}
            alertDetails={{
              ruleset: rs.ruleset,
              ampelStatus: AlertType.Warning,
              message: rs.message,
              resultTime: rs.resultTime,
              rulesetHistory: rs.history,
              links: rs.links || [],
            }}
            onClick={() => {}}
          />,
        );
      } else if (rs.ampelStatus === AmpelStatus.GREEN) {
        grouped.get(AmpelStatus.GREEN)!.push(
          <InconspicuousStateCard
            key={rs.ruleset}
            title={rs.ruleset}
            type={AlertType.Green}
            creationTime={creationTime}
            alertDetails={{
              ruleset: rs.ruleset,
              ampelStatus: AlertType.Green,
              message: rs.message,
              resultTime: rs.resultTime,
              rulesetHistory: rs.history,
              links: rs.links || [],
            }}
            onClick={() => {}}
          />,
        );
      }
    }

    return grouped;
  }, [alertsData]);

  return (
    <PatientAlertsPage
      showHeader={false}
      medicalCaseMetadata={undefined}
      rulesetsByStatus={rulesetsByStatus}
    />
  );
}
