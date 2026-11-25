import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import BrandLogo from '../../assets/brand-default-logo.svg';
import UklLogo from '../../assets/clinical-default-logo.svg';
import { PatientMetaDataHeader } from '../pages/alerts/components/PatientDataHeader';

afterEach(() => {
  cleanup();
});

describe('PatientMetaDataHeader', () => {
  it('renders the bundled product logo and no clinic logo when none are configured', () => {
    render(
      <PatientMetaDataHeader
        firstname='Max'
        lastname='Mustermann'
        patientId='P-1'
        medicalCaseId='CASE-1'
        sex='männlich'
        dateOfBirth='1990-01-01T00:00:00Z'
        headerConfig={{
          productLogoUrl: '',
          clinicLogoUrl: '',
          ticketLink: '',
          contactPhone: '',
          mtNumber: '',
          instructionsLink: '',
        }}
      />,
    );

    expect(screen.getByAltText('Header Logo')).toHaveAttribute('src', BrandLogo);
    expect(screen.queryByAltText('Clinical Logo')).toBeNull();
  });

  it('renders the configured primary logo', () => {
    render(
      <PatientMetaDataHeader
        firstname='Max'
        lastname='Mustermann'
        patientId='P-1'
        medicalCaseId='CASE-1'
        sex='männlich'
        dateOfBirth='1990-01-01T00:00:00Z'
        headerConfig={{
          productLogoUrl: '/runtime-assets/brand-default-logo.svg',
          clinicLogoUrl: '/runtime-assets/clinic-logo.svg',
          ticketLink: '',
          contactPhone: '',
          mtNumber: '',
          instructionsLink: '',
        }}
      />,
    );

    const logo = screen.getByAltText('Header Logo');
    expect(logo).toHaveAttribute('src', '/runtime-assets/brand-default-logo.svg');
    expect(screen.getByAltText('Clinical Logo')).toHaveAttribute(
      'src',
      '/runtime-assets/clinic-logo.svg',
    );
  });

  it('resolves source assets paths to bundled logos', () => {
    render(
      <PatientMetaDataHeader
        firstname='Max'
        lastname='Mustermann'
        patientId='P-1'
        medicalCaseId='CASE-1'
        sex='männlich'
        dateOfBirth='1990-01-01T00:00:00Z'
        headerConfig={{
          productLogoUrl: 'assets/brand-default-logo.svg',
          clinicLogoUrl: 'assets/clinical-default-logo.svg',
          ticketLink: '',
          contactPhone: '',
          mtNumber: '',
          instructionsLink: '',
        }}
      />,
    );

    expect(screen.getByAltText('Header Logo')).toHaveAttribute('src', BrandLogo);
    expect(screen.getByAltText('Clinical Logo')).toHaveAttribute('src', UklLogo);
  });

  it('falls back to the bundled product logo and hides a failed clinic logo', async () => {
    render(
      <PatientMetaDataHeader
        firstname='Max'
        lastname='Mustermann'
        patientId='P-1'
        medicalCaseId='CASE-1'
        sex='männlich'
        dateOfBirth='1990-01-01T00:00:00Z'
        headerConfig={{
          productLogoUrl: '/runtime-assets/missing-brand-default-logo.svg',
          clinicLogoUrl: '/runtime-assets/missing-clinic-logo.svg',
          ticketLink: '',
          contactPhone: '',
          mtNumber: '',
          instructionsLink: '',
        }}
      />,
    );

    const productLogo = screen.getByAltText('Header Logo');
    const clinicLogo = screen.getByAltText('Clinical Logo');
    const logoRow = productLogo.closest('.col-span-2');

    expect(productLogo).toHaveAttribute('src', '/runtime-assets/missing-brand-default-logo.svg');
    expect(clinicLogo).toHaveAttribute('src', '/runtime-assets/missing-clinic-logo.svg');
    expect(logoRow?.className).toContain('justify-start');

    fireEvent.error(productLogo);
    fireEvent.error(clinicLogo);

    expect(productLogo).toHaveAttribute('src', BrandLogo);
    await waitFor(() => expect(screen.queryByAltText('Clinical Logo')).toBeNull());
    expect(logoRow?.className).toContain('justify-end');
  });

  it('keeps the product logo at the end of the logo row when the clinic logo is missing', () => {
    const { container } = render(
      <PatientMetaDataHeader
        firstname='Max'
        lastname='Mustermann'
        patientId='P-1'
        medicalCaseId='CASE-1'
        sex='männlich'
        dateOfBirth='1990-01-01T00:00:00Z'
        headerConfig={{
          productLogoUrl: '',
          clinicLogoUrl: '',
          ticketLink: '',
          contactPhone: '',
          mtNumber: '',
          instructionsLink: '',
        }}
      />,
    );

    const productLogo = screen.getByAltText('Header Logo');

    expect(container.firstElementChild?.className).toContain('pr-4');
    expect(productLogo.closest('.col-span-2')?.className).toContain('justify-end');
  });

  it('gives every header icon an accessible label', () => {
    render(
      <PatientMetaDataHeader
        firstname='Max'
        lastname='Mustermann'
        patientId='P-1'
        medicalCaseId='CASE-1'
        sex='männlich'
        dateOfBirth='1990-01-01T00:00:00Z'
        headerConfig={{
          productLogoUrl: '',
          clinicLogoUrl: '',
          ticketLink: '',
          contactPhone: '0341 123',
          mtNumber: 'MT-42',
          instructionsLink: '',
        }}
      />,
    );

    for (const label of ['E-Mail', 'Dokument', 'Telefon', 'Gerätekennung']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });
});
