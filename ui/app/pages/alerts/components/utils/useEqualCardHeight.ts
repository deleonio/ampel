import { type RefObject, useLayoutEffect } from 'react';

export const CARD_HEIGHT_VAR = '--card-height';

/**
 * Setzt auf dem Container die Höhe der höchsten sichtbaren Karte (`[data-card]`) als CSS-Variable.
 * Die Kartenraster verwenden sie als Zeilenhöhe: alle Karten werden so hoch wie die höchste,
 * aber nicht höher. Gemessen wird beim Rendern und bei jeder Größenänderung des Containers
 * (Fensterbreite, Aufklappen, nachgeladene KoliBri-Inhalte).
 */
export function useEqualCardHeight(containerRef: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = (): void => {
      // Ohne Vorgabe nehmen die Zeilen ihre natürliche Höhe an; die höchste wird übernommen.
      container.style.removeProperty(CARD_HEIGHT_VAR);
      let max = 0;
      container.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
        max = Math.max(max, card.getBoundingClientRect().height);
      });
      if (max > 0) container.style.setProperty(CARD_HEIGHT_VAR, `${Math.ceil(max)}px`);
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      globalThis.cancelAnimationFrame(frame);
      frame = globalThis.requestAnimationFrame(measure);
    });
    observer.observe(container);
    container.querySelectorAll('[data-card]').forEach((card) => observer.observe(card));

    return (): void => {
      observer.disconnect();
      globalThis.cancelAnimationFrame(frame);
    };
  });
}
