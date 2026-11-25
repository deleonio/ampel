import { register } from '@public-ui/components';
import { defineCustomElement as defineKolSpin } from '@public-ui/components/dist/components/kol-spin.js';
import { DEFAULT } from '@public-ui/theme-default';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

// Der React-Adapter definiert die Custom Elements selbst, daher keine Loader übergeben.
register(DEFAULT, [])
  // Ladehinweise kommen per SSR, bevor React sie hydriert (siehe LoadingStatus).
  .then(() => defineKolSpin())
  .catch((error: unknown) =>
    globalThis.console?.error?.('KoliBri-Registrierung fehlgeschlagen', error),
  )
  .finally(() => {
    startTransition(() => {
      hydrateRoot(
        document,
        <StrictMode>
          <HydratedRouter />
        </StrictMode>,
      );
    });
  });
