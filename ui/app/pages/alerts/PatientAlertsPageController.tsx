/* eslint-disable import/no-default-export */
import { KolBadge } from '@public-ui/react-v19';
import React, { ReactNode, Suspense, useMemo } from 'react';
import {
  Await,
  LoaderFunctionArgs,
  ShouldRevalidateFunctionArgs,
  useLoaderData,
  useNavigation,
} from 'react-router';

import { NotFound } from '../../error/NotFound';
import { normalizeError } from '../../error/patientAlertsData';
import { ErrorBoundary, PageSkeleton, SectionErrorPanel } from '../../error/patientAlertsErrors';
import { getPatientHeaderConfig, type PatientHeaderConfig } from '../../patientHeaderConfig';
import { FakeDemoAmpelResultRepository } from '../../tests/DemoFakeAmpelResultRepository';
import { FakeAmpelResultRepository } from '../../tests/FakeAmpelResultRepository';
import { AmpelResultRepository } from './AmpelResultRepository';
import { AlertCard } from './components/AlertCard';
import { InconspicuousStateCard } from './components/InconspicuousStateCard';
import { PatientMetaDataHeader } from './components/PatientDataHeader';
import { MedicalCaseMetadataRepository } from './MedicalCaseMetadataRepository';
import { PatientAlertsPage } from './PatientAlertsPage';
import { apiToRulesets, medicalCaseMetadataApiToUI } from './types/api-to-ui';
import { AlertType, AmpelStatus } from './types/types';
import type { ApiResultCollection, MedicalCaseMetadataApiResult } from './types/types-api';

const isTest = import.meta.env?.VITE_TEST_DATA_VIEW === 'test';
const isDemo = import.meta.env?.VITE_TEST_DATA_VIEW === 'demo';
const isDev = import.meta.env?.MODE === 'development';
const ENV_BADGE_COLOR = { backgroundColor: '#fde047', foregroundColor: '#422006' };

type AlertsResultValue = ApiResultCollection | SerializableStatusError;
type MetadataResultValue = MedicalCaseMetadataApiResult | SerializableStatusError;

interface LoaderData {
  case_id: string;
  headerConfig: PatientHeaderConfig;
  alertsResult: AlertsResultValue | Promise<AlertsResultValue>;
  metadataResult: MetadataResultValue | Promise<MetadataResultValue>;
}

export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData> {
  const case_id = params.case_id;
  if (!case_id) throw new Response('case_id fehlt', { status: 404 });
  return loadAlertsForCase(case_id);
}

interface SerializableStatusError {
  message: string;
  status?: number;
  headers?: Record<string, string>;
}

function toSerializableError(err: unknown): SerializableStatusError {
  const normalized = normalizeError(err);
  const headers =
    normalized.headers instanceof Headers
      ? Object.fromEntries(normalized.headers.entries())
      : normalized.headers;

  return {
    message: normalized.message || 'Error',
    status: normalized.status,
    headers,
  };
}

function isSerializableError(value: unknown): value is SerializableStatusError {
  return Boolean(value && typeof value === 'object' && 'message' in value);
}

type NonError<T> = T extends Error ? never : T;

const toResultPromise = <T,>(promise: Promise<T>): Promise<NonError<T> | SerializableStatusError> =>
  promise
    .then((value) => (value instanceof Error ? toSerializableError(value) : (value as NonError<T>)))
    .catch((err) => toSerializableError(err));

function loadAlertsForCase(case_id: string): LoaderData {
  let alertsResult: AlertsResultValue | Promise<AlertsResultValue>;
  let metadataResult: MetadataResultValue | Promise<MetadataResultValue>;

  if (isTest) {
    alertsResult = toResultPromise(FakeAmpelResultRepository.uiFakesToApi(case_id));
    metadataResult = toResultPromise(FakeAmpelResultRepository.generateFakePatientMetaData());
  } else if (isDemo) {
    alertsResult = toResultPromise(FakeDemoAmpelResultRepository.uiDemoFakesToApi(case_id));
    metadataResult = toResultPromise(
      FakeDemoAmpelResultRepository.generateDemoFakePatientMetaData(),
    );
  } else {
    alertsResult = toResultPromise(AmpelResultRepository.getByMedicalCaseId(case_id));
    metadataResult = toResultPromise(MedicalCaseMetadataRepository.getByMedicalCaseId(case_id));
  }

  return {
    case_id,
    headerConfig: getPatientHeaderConfig(),
    alertsResult,
    metadataResult,
  };
}

const isPromise = (value: unknown): value is Promise<unknown> => value instanceof Promise;
const isUnknownValue = (value: string | null | undefined): boolean => {
  if (!value) return true;
  const trimmed = value.trim();
  return trimmed.length === 0 || trimmed.toLowerCase() === 'unbekannt';
};
const NO_DATA_ERROR_STATUSES = new Set([400, 404, 410, 422]);

const toNumericStatus = (status: unknown): number | null => {
  if (typeof status === 'number' && Number.isFinite(status)) return status;
  if (typeof status === 'string') {
    const parsed = Number(status);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const isEmptyAlertsPayload = (value: ApiResultCollection | null): boolean =>
  Boolean(value) && value.scoringSystems.length === 0;

function ResolvedPatientAlertsView({
  caseId,
  headerConfig,
  alertsResult,
  metadataResult,
  isLoading,
}: {
  caseId: string;
  headerConfig: PatientHeaderConfig;
  alertsResult: AlertsResultValue;
  metadataResult: MetadataResultValue;
  isLoading: boolean;
}): React.ReactNode {
  const metadataError = isSerializableError(metadataResult) ? metadataResult : null;
  const alertsError = isSerializableError(alertsResult) ? alertsResult : null;
  const primaryError = alertsError ?? metadataError;
  const metadataNotFound = metadataError?.status === 404 || metadataError?.status === 410;
  const alertsStatus = toNumericStatus(alertsError?.status);
  const alertsNoDataError = alertsStatus !== null && NO_DATA_ERROR_STATUSES.has(alertsStatus);
  const metadata = metadataError ? null : (metadataResult as MedicalCaseMetadataApiResult);
  const alerts = alertsError ? null : (alertsResult as ApiResultCollection);
  const alertsDataMissing = isEmptyAlertsPayload(alerts);
  const mappedMetadata = metadata ? medicalCaseMetadataApiToUI(metadata) : null;
  const patientDataMissing =
    Boolean(mappedMetadata) &&
    (!mappedMetadata ||
      isUnknownValue(mappedMetadata.id) ||
      isUnknownValue(mappedMetadata.firstname) ||
      isUnknownValue(mappedMetadata.lastname));
  const showPatientNotFound = metadataNotFound || patientDataMissing;
  const suppressAlertsError = showPatientNotFound && alertsNoDataError;
  const showCdssNotFound = !showPatientNotFound && alertsDataMissing;

  const rulesetsByStatus = useMemo(() => {
    const grouped = new Map<AmpelStatus, ReactNode[]>([
      [AmpelStatus.RED, []],
      [AmpelStatus.YELLOW, []],
      [AmpelStatus.GREEN, []],
    ]);

    if (!alerts) return grouped;

    const rulesets = apiToRulesets(alerts);

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
            disabled={false}
            alertDetails={{
              ruleset: rs.ruleset,
              ampelStatus: AlertType.Critical,
              message: rs.message,
              resultTime: rs.resultTime,
              rulesetHistory: rs.history,
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
            disabled={isDemo}
            alertDetails={{
              ruleset: rs.ruleset,
              ampelStatus: AlertType.Warning,
              message: rs.message,
              resultTime: rs.resultTime,
              rulesetHistory: rs.history,
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
            disabled={isDemo}
            alertDetails={{
              ruleset: rs.ruleset,
              ampelStatus: AlertType.Green,
              message: rs.message,
              resultTime: rs.resultTime,
              rulesetHistory: rs.history,
            }}
            onClick={() => {}}
          />,
        );
      }
    }

    return grouped;
  }, [alerts]);

  return (
    <>
      {mappedMetadata ? (
        <PatientMetaDataHeader
          medicalCaseId={mappedMetadata.medicalCaseId}
          patientId={mappedMetadata.id}
          firstname={mappedMetadata.firstname ?? undefined}
          lastname={mappedMetadata.lastname ?? undefined}
          dateOfBirth={mappedMetadata.dateOfBirth ?? undefined}
          sex={mappedMetadata.sex ?? 'unbekannt'}
          headerConfig={headerConfig}
        />
      ) : (
        <PatientMetaDataHeader
          medicalCaseId={caseId}
          patientId={undefined}
          firstname={undefined}
          lastname={undefined}
          dateOfBirth={undefined}
          sex={undefined}
          headerConfig={headerConfig}
        />
      )}
      {showPatientNotFound ? (
        <div data-testid='metadata-error' className='mt-4'>
          <NotFound variant='patient' />
        </div>
      ) : metadataError && !alertsError ? (
        <SectionErrorPanel error={metadataError} dataTestId='metadata-error' variant='patient' />
      ) : null}
      {isLoading ? (
        <PageSkeleton />
      ) : showCdssNotFound ? (
        <SectionErrorPanel
          error={{ status: 404, message: 'No CDSS data found for case' }}
          dataTestId='alerts-error'
        />
      ) : alerts ? (
        <PatientAlertsPage
          medicalCaseMetadata={undefined}
          rulesetsByStatus={rulesetsByStatus}
          showHeader={false}
        />
      ) : primaryError && !suppressAlertsError ? (
        <SectionErrorPanel error={primaryError} dataTestId='alerts-error' />
      ) : null}
    </>
  );
}

export default function PatientAlertsPageController(): React.ReactNode {
  const { case_id, headerConfig, alertsResult, metadataResult } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isLoading = navigation.state !== 'idle';
  const hasAsyncData = isPromise(alertsResult) || isPromise(metadataResult);

  return (
    <div className='h-full'>
      {(isTest || isDemo || isDev) && (
        <div className='mb-2 flex flex-wrap items-start gap-2'>
          {isTest && <KolBadge _label='TEST' _color={ENV_BADGE_COLOR} />}
          {isDemo && <KolBadge _label='DEMO 03.11.2025' _color={ENV_BADGE_COLOR} />}
          {isDev && <KolBadge _label='DEV' _color={ENV_BADGE_COLOR} />}
        </div>
      )}
      {hasAsyncData ? (
        <Suspense fallback={<PageSkeleton />}>
          <Await resolve={alertsResult}>
            {(resolvedAlerts) => (
              <Await resolve={metadataResult}>
                {(resolvedMetadata) => (
                  <ResolvedPatientAlertsView
                    caseId={case_id}
                    headerConfig={headerConfig}
                    alertsResult={resolvedAlerts as AlertsResultValue}
                    metadataResult={resolvedMetadata as MetadataResultValue}
                    isLoading={isLoading}
                  />
                )}
              </Await>
            )}
          </Await>
        </Suspense>
      ) : (
        <ResolvedPatientAlertsView
          caseId={case_id}
          headerConfig={headerConfig}
          alertsResult={alertsResult as AlertsResultValue}
          metadataResult={metadataResult as MetadataResultValue}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

function sameParams(
  currentParams: ShouldRevalidateFunctionArgs['currentParams'],
  nextParams: ShouldRevalidateFunctionArgs['nextParams'],
): boolean {
  const currentKeys = Object.keys(currentParams);
  const nextKeys = Object.keys(nextParams);
  if (currentKeys.length !== nextKeys.length) return false;
  return currentKeys.every((key) => currentParams[key] === nextParams[key]);
}

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  currentParams,
  nextParams,
  formMethod,
  formAction,
  formData,
  json,
  text,
  actionStatus,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
  const sameUrl =
    currentUrl.pathname === nextUrl.pathname &&
    currentUrl.search === nextUrl.search &&
    currentUrl.hash === nextUrl.hash;
  const hasSubmission =
    Boolean(formMethod || formAction || formData || json || text) || actionStatus != null;

  if (!hasSubmission && sameUrl && sameParams(currentParams, nextParams)) {
    return false;
  }

  return defaultShouldRevalidate;
}

// Re-export for router usage
export { ErrorBoundary };
