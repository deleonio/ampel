import { KolHeading, KolIcon, KolImage, KolLink } from '@public-ui/react-v19';
import React from 'react';
import { preload } from 'react-dom';

import BrandLogo from '../../../../assets/brand-default-logo.svg';
import { getPatientHeaderConfig, type PatientHeaderConfig } from '../../../patientHeaderConfig';
import { SexUI } from '../types/types';

preload(BrandLogo, { as: 'image' });

const BUNDLED_LOGO_MODULES = import.meta.glob('../../../../assets/*.svg', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const BUNDLED_LOGO_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(BUNDLED_LOGO_MODULES).map(([path, url]) => [
    `assets/${path.split('/').pop()}`,
    url,
  ]),
);

interface PatientMetaDataHeaderProps {
  medicalCaseId: string;
  patientId?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  dateOfBirth?: Date | string | null;
  sex?: SexUI | null;
  headerConfig?: PatientHeaderConfig;
}

function formatDob(d: Date | string | null | undefined): string {
  if (!d) return 'kein Geburtsdatum';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return 'kein Geburtsdatum';
  return date.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });
}

function toIsoDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function toTelHref(value: string): string | null {
  const digits = value.replace(/[^\d+]/g, '');
  return digits.length >= 3 ? `tel:${digits}` : null;
}

function formatHeaderValue(value: string): string {
  return value.trim() ? value : '-';
}

function resolveLogoUrl(src: string): string {
  if (!src) return '';
  return BUNDLED_LOGO_URLS[src] ?? BUNDLED_LOGO_URLS[`${src}.svg`] ?? src;
}

interface HeaderLogoImageProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className: string;
  onHidden?: () => void;
}

function HeaderLogoImage({
  src,
  fallbackSrc,
  alt,
  className,
  onHidden,
}: HeaderLogoImageProps): React.ReactNode {
  const [resolvedSrc, setResolvedSrc] = React.useState(src || fallbackSrc || '');
  const [isHidden, setIsHidden] = React.useState(!resolvedSrc);

  React.useEffect(() => {
    const nextSrc = src || fallbackSrc || '';
    setResolvedSrc(nextSrc);
    setIsHidden(!nextSrc);
  }, [fallbackSrc, src]);

  const handleLoadError = React.useCallback((): void => {
    if (fallbackSrc && resolvedSrc !== fallbackSrc) {
      setResolvedSrc(fallbackSrc);
      setIsHidden(false);
      return;
    }

    setIsHidden(true);
    onHidden?.();
  }, [fallbackSrc, onHidden, resolvedSrc]);

  if (isHidden || !resolvedSrc) return null;

  return (
    <div className={className}>
      <KolImage _src={resolvedSrc} _alt={alt} _on={{ onError: handleLoadError }} />
    </div>
  );
}

interface LabeledIcon {
  icon: string;
  label: string;
}

const ICONS = {
  mail: { icon: 'fa-solid fa-envelope', label: 'E-Mail' },
  manual: { icon: 'fa-solid fa-book-open', label: 'Dokument' },
  phone: { icon: 'fa-solid fa-phone', label: 'Telefon' },
  deviceId: { icon: 'fa-solid fa-signature', label: 'Gerätekennung' },
} satisfies Record<string, LabeledIcon>;

function IconText({
  icon,
  children,
}: {
  icon: LabeledIcon;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <span className='inline-flex items-center gap-2'>
      <KolIcon _icons={icon.icon} _label={icon.label} />
      {children}
    </span>
  );
}

/**
 * A component to display patient metadata (firstname, lastname, patient ID, case ID, sex, birthdate)
 * in a consistent and visually appealing way.
 * @param {{ fistname: string; lastname: string; patientId: string; medicalCaseId: string; sex: "mänlich" | "weiblich" | "unbekannt"; dateOfBirth: Date }} props
 * @returns {React.ReactNode }
 */
export function PatientMetaDataHeader({
  firstname,
  lastname,
  patientId,
  medicalCaseId,
  sex,
  dateOfBirth,
  headerConfig,
}: PatientMetaDataHeaderProps): React.ReactNode {
  const resolvedHeaderConfig = headerConfig ?? getPatientHeaderConfig();
  const patientName =
    [firstname, lastname].filter((part) => part?.trim()).join(' ') || 'Name unbekannt';
  const safePatientId = patientId || 'Unbekannt';
  const safeMedicalCaseId = medicalCaseId || 'Unbekannt';
  const dobText = formatDob(dateOfBirth);
  const dobIso = toIsoDate(dateOfBirth);
  const sexText = sex ?? 'unbekannt';
  const { productLogoUrl, clinicLogoUrl, ticketLink, contactPhone, mtNumber, instructionsLink } =
    resolvedHeaderConfig;
  const contactPhoneText = formatHeaderValue(contactPhone);
  const mtNumberText = formatHeaderValue(mtNumber);
  const resolvedProductLogoUrl = resolveLogoUrl(productLogoUrl) || BrandLogo;
  const resolvedClinicLogoUrl = clinicLogoUrl ? resolveLogoUrl(clinicLogoUrl) : '';
  const [isClinicLogoVisible, setIsClinicLogoVisible] = React.useState(
    Boolean(resolvedClinicLogoUrl),
  );
  const logoRowJustifyClass = isClinicLogoVisible ? 'justify-start' : 'justify-end';

  React.useEffect(() => {
    setIsClinicLogoVisible(Boolean(resolvedClinicLogoUrl));
  }, [resolvedClinicLogoUrl]);

  const renderExternalLink = (href: string, label: string, icon: LabeledIcon): React.ReactNode => {
    if (!href) {
      return <IconText icon={icon}>{label}</IconText>;
    }

    return (
      <KolLink
        _href={href}
        _label={label}
        _target='_blank'
        _icons={{ left: { icon: icon.icon, label: icon.label } }}
      />
    );
  };

  const phoneHref = toTelHref(contactPhone);

  return (
    <header className='grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-[1fr_auto] md:items-end'>
      <div className='min-w-0'>
        <KolHeading _label={patientName} _level={2} />

        <dl className='mt-1 flex flex-wrap items-baseline gap-x-8 gap-y-1'>
          <div className='flex gap-x-2'>
            <dt>Geburtsdatum</dt>
            <dd className='font-bold'>
              {dobIso ? <time dateTime={dobIso}>{dobText}</time> : dobText}
            </dd>
          </div>
          <div className='flex gap-x-2'>
            <dt>Geschlecht</dt>
            <dd className='font-bold'>{sexText}</dd>
          </div>
          <div className='flex gap-x-2'>
            <dt>Patientennummer</dt>
            <dd className='font-bold'>{safePatientId}</dd>
          </div>
          <div className='flex gap-x-2'>
            <dt>Fallnummer</dt>
            <dd className='font-bold'>{safeMedicalCaseId}</dd>
          </div>
        </dl>
      </div>

      <div className='flex flex-col items-start gap-y-2 md:items-end'>
        <div
          data-testid='logo-row'
          className={`flex w-full items-start ${logoRowJustifyClass} gap-x-6`}
        >
          <HeaderLogoImage
            src={resolvedProductLogoUrl}
            fallbackSrc={BrandLogo}
            alt='AMPEL'
            className='h-8 sm:h-9 md:h-12 lg:h-14'
          />
          {resolvedClinicLogoUrl ? (
            <HeaderLogoImage
              src={resolvedClinicLogoUrl}
              alt='Logo der Klinik'
              className='h-8 sm:h-9 md:h-12 lg:h-14'
              onHidden={() => setIsClinicLogoVisible(false)}
            />
          ) : null}
        </div>

        <ul
          aria-label='Hilfe und Kontakt'
          className='grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2 sm:text-base'
        >
          <li>{renderExternalLink(ticketLink, 'Störmeldung Medizintechnik', ICONS.mail)}</li>
          <li>{renderExternalLink(instructionsLink, 'Gebrauchsanweisung', ICONS.manual)}</li>
          <li>
            {phoneHref ? (
              <KolLink
                _href={phoneHref}
                _label={`Allgemeine Fragen: ${contactPhoneText}`}
                _icons={{ left: { icon: ICONS.phone.icon, label: ICONS.phone.label } }}
              />
            ) : (
              <IconText icon={ICONS.phone}>Allgemeine Fragen: {contactPhoneText}</IconText>
            )}
          </li>
          <li>
            <IconText icon={ICONS.deviceId}>MT-Nummer: {mtNumberText}</IconText>
          </li>
        </ul>
      </div>
    </header>
  );
}
