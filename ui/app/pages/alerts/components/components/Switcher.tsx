import { KolInputCheckbox } from '@public-ui/react-v19';
import type { ReactElement } from 'react';

interface SwitcherProps {
  checked: boolean;
  onChange: (newState: boolean) => void;
  label: string;
}

export function Switcher({ checked, onChange, label }: SwitcherProps): ReactElement {
  return (
    <div data-testid='switcher' data-drawer-autofocus>
      <KolInputCheckbox
        _label={label}
        _variant='switch'
        _checked={checked}
        _on={{
          onChange: () => onChange(!checked),
        }}
      />
    </div>
  );
}
