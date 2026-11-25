import { KolHeading } from '@public-ui/react-v19';
import React from 'react';

import { pageTitle } from '../pageTitle';

/** 1 = eigenständige Fehlerseite (setzt auch den Browsertitel), 2 = Fehler innerhalb einer Seite. */
export type ErrorHeadingLevel = 1 | 2;

interface ErrorLayoutProps {
  title: string;
  level?: ErrorHeadingLevel;
  children: React.ReactNode;
}

export function ErrorLayout({ title, level = 1, children }: ErrorLayoutProps): React.ReactNode {
  return (
    <div className='mt-16 flex items-start justify-center'>
      {level === 1 && <title>{pageTitle(title)}</title>}
      <div className='flex w-[90vw] max-w-[760px] flex-col items-center gap-4 text-center'>
        <KolHeading _label={title} _level={level} />
        <div className='max-w-[600px]'>{children}</div>
      </div>
    </div>
  );
}
