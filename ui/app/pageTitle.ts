export const APP_NAME = 'AMPEL-CDSS';

/** Browsertitel: zuerst die Seite, dann der Anwendungsname. */
export function pageTitle(page: string): string {
  return `${page} – ${APP_NAME}`;
}
