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
  const safeFirstname = firstname || 'Unbekannt';
  const safeLastname = lastname || 'Unbekannt';
  const safePatientId = patientId || 'Unbekannt';
  const safeMedicalCaseId = medicalCaseId || 'Unbekannt';
  const dobText = formatDob(dateOfBirth);
  const sexLetter = ((sex ?? 'unbekannt') as string).charAt(0).toUpperCase();
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

  return (
    <div className='grid grid-cols-1 gap-x-6 gap-y-3 pr-4 md:grid-cols-[1fr_auto] md:items-end md:pr-6'>
      <div className='min-w-0'>
        <KolHeading
          _label={`${safeFirstname} ${safeLastname} (*${dobText} | ${sexLetter})`}
          _level={1}
        />

        <div className='mt-1 flex flex-wrap items-baseline gap-x-10 gap-y-1'>
          <span className='whitespace-nowrap'>
            <span className='mr-2'>Patientennummer</span>
            <strong>{safePatientId}</strong>
          </span>
          <span>
            <span className='mr-2'>Fallnummer</span>
            <strong>{safeMedicalCaseId}</strong>
          </span>
        </div>
      </div>

      <div className='grid grid-cols-2 grid-rows-[auto_auto] items-start justify-start gap-x-6 gap-y-1 md:grid-cols-[auto_auto] md:justify-end'>
        <div className={`col-span-2 row-[1] flex items-start ${logoRowJustifyClass} gap-x-6 pl-4`}>
          <HeaderLogoImage
            src={resolvedProductLogoUrl}
            fallbackSrc={BrandLogo}
            alt='Header Logo'
            className='h-8 sm:h-9 md:h-12 lg:h-14'
          />
          {resolvedClinicLogoUrl ? (
            <HeaderLogoImage
              src={resolvedClinicLogoUrl}
              alt='Clinical Logo'
              className='h-8 sm:h-9 md:h-12 lg:h-14'
              onHidden={() => setIsClinicLogoVisible(false)}
            />
          ) : null}
        </div>

        <span className='col-[1] row-[2] text-sm sm:text-base'>
          {renderExternalLink(ticketLink, 'Störmeldung Medizintechnik', ICONS.mail)}
        </span>
        <span className='col-[1] row-[3] text-sm sm:text-base'>
          <IconText icon={ICONS.phone}>allg. Fragen: {contactPhoneText}</IconText>
        </span>
        <span className='col-[2] row-[2] text-sm sm:text-base'>
          {renderExternalLink(instructionsLink, 'Gebrauchsanweisung', ICONS.manual)}
        </span>
        <span className='col-[2] row-[3] text-sm sm:text-base'>
          <IconText icon={ICONS.deviceId}>MT-Nummer: {mtNumberText}</IconText>
        </span>
      </div>
    </div>
  );
}
