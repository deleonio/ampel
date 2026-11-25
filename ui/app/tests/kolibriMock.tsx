/**
 * Light-DOM-Stubs für @public-ui/react-v19 in jsdom-Tests.
 * KoliBri rendert in Shadow-DOM und setzt Labels als Properties; Testing-Library sieht davon nichts.
 * Die Stubs bilden die Semantik der genutzten Props nach, damit Text- und Rollenabfragen greifen.
 */
import React from 'react';

type AnyProps = Record<string, unknown> & { children?: React.ReactNode };
type Handler = (event: unknown, value?: unknown) => void;

function passthrough(props: AnyProps): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(props).filter(([k]) => !k.startsWith('_') && k !== 'children'),
  );
}

function handler(props: AnyProps, name: string): Handler | undefined {
  const on = props._on as Record<string, Handler> | undefined;
  return on?.[name];
}

function Heading({
  level,
  children,
}: {
  level?: unknown;
  children: React.ReactNode;
}): React.ReactNode {
  const lvl = Number(level ?? 0);
  if (lvl < 1 || lvl > 6) return <strong>{children}</strong>;
  return React.createElement(`h${lvl}`, null, children);
}

export const KolHeading = (p: AnyProps): React.ReactNode => (
  <div {...passthrough(p)}>
    {/* Leeres _label: der Expert-Slot ersetzt den Überschriftentext. */}
    <Heading level={p._level}>{(p._label as string) || p.children}</Heading>
    {p._label ? p.children : null}
  </div>
);

export const KolButton = (p: AnyProps): React.ReactNode => (
  <button
    type={(p._type as 'button' | 'submit' | 'reset') ?? 'button'}
    disabled={Boolean(p._disabled)}
    aria-expanded={p._ariaExpanded as boolean | undefined}
    onClick={(e) => handler(p, 'onClick')?.(e, p._value)}
    {...passthrough(p)}
  >
    {p._label as string}
  </button>
);

export const KolLink = (p: AnyProps): React.ReactNode => {
  const left = (p._icons as { left?: { icon: string; label?: string } } | undefined)?.left;
  return (
    <a href={p._href as string} target={p._target as string | undefined} {...passthrough(p)}>
      {left ? <i className={left.icon} aria-label={left.label || undefined} /> : null}
      {(p._label as string) ?? (p._href as string)}
    </a>
  );
};

export const KolCard = (p: AnyProps): React.ReactNode => (
  <section {...passthrough(p)}>
    <Heading level={p._level}>{p._label as string}</Heading>
    {p.children}
  </section>
);

export const KolBadge = (p: AnyProps): React.ReactNode => (
  <span {...passthrough(p)}>{p._label as string}</span>
);

export const KolAlert = (p: AnyProps): React.ReactNode => (
  <div role={p._alert ? 'alert' : undefined} {...passthrough(p)}>
    {p._label ? <Heading level={p._level}>{p._label as string}</Heading> : null}
    {p.children}
  </div>
);

export const KolSpin = (p: AnyProps): React.ReactNode =>
  p._show ? (
    <span role='status' {...passthrough(p)}>
      {p._label as string}
    </span>
  ) : null;

export const KolDetails = (p: AnyProps): React.ReactNode => {
  const [open, setOpen] = React.useState(Boolean(p._open));
  return (
    <div {...passthrough(p)}>
      <Heading level={p._level}>
        <button type='button' aria-expanded={open} onClick={() => setOpen(!open)}>
          {p._label as string}
        </button>
      </Heading>
      <div hidden={!open}>{p.children}</div>
    </div>
  );
};

export const KolDrawer = (p: AnyProps): React.ReactNode =>
  p._open ? (
    <div role='dialog' aria-label={p._label as string} {...passthrough(p)}>
      <Heading level={p._level}>{p._label as string}</Heading>
      {p._hasCloser ? (
        <button type='button' onClick={() => (p._on as { onClose?: () => void })?.onClose?.()}>
          Schließen
        </button>
      ) : null}
      {p.children}
    </div>
  ) : null;

export const KolInputCheckbox = (p: AnyProps): React.ReactNode => (
  <label {...passthrough(p)}>
    <input
      type='checkbox'
      role={p._variant === 'switch' ? 'switch' : undefined}
      checked={Boolean(p._checked)}
      onChange={(e) => handler(p, 'onChange')?.(e, e.target.checked ? (p._value ?? true) : null)}
    />
    {p._label as string}
  </label>
);

export const KolImage = (p: AnyProps): React.ReactNode => (
  <img
    src={p._src as string}
    alt={p._alt as string}
    onError={(e) => handler(p, 'onError')?.(e)}
    {...passthrough(p)}
  />
);

interface HeaderCell {
  label: string;
  key?: string;
  type?: string;
}

export const KolTableStateless = (p: AnyProps): React.ReactNode => {
  const headers = ((p._headers as { horizontal?: HeaderCell[][] })?.horizontal?.[0] ??
    []) as HeaderCell[];
  const data = (p._data as Record<string, unknown>[]) ?? [];
  return (
    <table {...passthrough(p)}>
      <caption>{p._label as string}</caption>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h.label}>{h.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {headers.map((h) => {
              const value = h.key ? row[h.key] : undefined;
              const text =
                h.type === 'state'
                  ? ((value as { _label: string }[]) ?? []).map((s) => s._label).join(', ')
                  : String(value ?? '');
              return <td key={h.label}>{text}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const KolIcon = (p: AnyProps): React.ReactNode => (
  <i
    className={p._icons as string}
    aria-hidden={p._label ? undefined : true}
    aria-label={(p._label as string) || undefined}
  />
);
