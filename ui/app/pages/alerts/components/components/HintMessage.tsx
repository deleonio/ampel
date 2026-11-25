import { KolAlert } from '@public-ui/react-v19';
import type { ReactElement } from 'react';

interface HintMessageProps {
  message?: string;
}

function sanitizeMessage(html?: string): string {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const disallowedTags = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'];
  doc.querySelectorAll(disallowedTags.join(',')).forEach((el) => el.remove());

  doc.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }
      if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

/**
 * A component to display a hint message with optional HTML content.
 * The hint message is rendered as a flex column with a font-medium label
 * and a gray-colored content. If no message is provided, nothing is rendered.
 *
 * @param {{ message?: string }} props
 * @prop {string} [message] - The hint message to be rendered as HTML.
 * @returns {React.ReactNode } The rendered hint message component.
 */
export function HintMessage({ message }: HintMessageProps): ReactElement | null {
  const sanitized = sanitizeMessage(message);
  if (!sanitized) return null;

  return (
    <KolAlert _type='info' _label='Hinweis' _level={3} _variant='card'>
      <div dangerouslySetInnerHTML={{ __html: sanitized }} />
    </KolAlert>
  );
}
