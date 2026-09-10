import { Badge } from './Badge';

export function StatusBadge({ status }: { readonly status: 'confirmed' | 'reported' | 'estimated' | 'unknown' | 'local' }) {
  const config = ({
    confirmed: ['Confirmed', 'green'], reported: ['Reported', 'blue'], estimated: ['Estimated', 'purple'], unknown: ['Unknown', 'neutral'], local: ['On device', 'green']
  } as const)[status];
  return <Badge tone={config[1]}>{config[0]}</Badge>;
}
