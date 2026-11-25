import { AlertType, AmpelStatus } from '../../types/types';

export interface StatusBadge {
  label: string;
  color: { backgroundColor: string; foregroundColor: string };
}

const CRITICAL: StatusBadge = {
  label: 'Kritisch',
  color: { backgroundColor: '#b91c1c', foregroundColor: '#ffffff' },
};
const WARNING: StatusBadge = {
  label: 'Warnung',
  color: { backgroundColor: '#fcd34d', foregroundColor: '#1f2937' },
};
const NORMAL: StatusBadge = {
  label: 'Normal',
  color: { backgroundColor: '#15803d', foregroundColor: '#ffffff' },
};

export function badgeForAmpelStatus(status: AmpelStatus): StatusBadge {
  if (status === AmpelStatus.RED) return CRITICAL;
  if (status === AmpelStatus.YELLOW) return WARNING;
  return NORMAL;
}

export function badgeForAlertType(type: AlertType): StatusBadge {
  if (type === AlertType.Critical) return CRITICAL;
  if (type === AlertType.Warning) return WARNING;
  return NORMAL;
}
