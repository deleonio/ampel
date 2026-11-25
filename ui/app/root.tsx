import fontAwesome from '@fortawesome/fontawesome-free/css/all.min.css?url';
import kolIcons from '@public-ui/theme-default/assets/kolicons/style.css?url';
import React, { Suspense } from 'react';
import { LinksFunction, useLoaderData } from 'react-router';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import { LoadingStatus } from './error/LoadingStatus';
import {
  getPatientHeaderConfig,
  getPatientHeaderConfigScript,
  type PatientHeaderConfig,
} from './patientHeaderConfig';
import styles from './tailwind.css?url';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: kolIcons },
  { rel: 'stylesheet', href: fontAwesome },
  { rel: 'stylesheet', href: styles },
];

interface RootLoaderData {
  headerConfig: PatientHeaderConfig;
}

export function loader(): RootLoaderData {
  return {
    headerConfig: getPatientHeaderConfig(),
  };
}

// eslint-disable-next-line import/no-default-export
export default function App(): React.ReactNode {
  const { headerConfig } = useLoaderData<RootLoaderData>();

  return (
    <html lang='de'>
      <head>
        <title>AMPEL-CDSS</title>
        <Links />
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
      </head>
      <body className='w-screen overflow-x-hidden'>
        <div className='flex h-screen w-screen flex-row gap-x-20'>
          <div className='h-full w-full pl-4 pt-4'>
            <Suspense fallback={<LoadingStatus label='Inhalte werden geladen' />}>
              <Outlet />
              <ScrollRestoration />
            </Suspense>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: getPatientHeaderConfigScript(headerConfig),
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
