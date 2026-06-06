import type { Inspection } from '@/types';

export function buildInspectionTitle(item: Inspection): string {
  const supplier = item.supplier?.trim() || '—';
  const invoiceNo = item.invoiceNo?.trim() || '—';
  const ids = item.productIds.join(', ');
  return `${supplier}  ·  ${invoiceNo}  ·  ${ids}`;
}
