import type { Inspection } from '@/types';

export function buildInspectionTitle(item: Inspection): string {
  const supplier = item.supplier?.trim() || '—';
  const invoiceNo = item.invoiceNo?.trim() || '—';
  const ids = item.productIds.join(', ');
  const base = `${supplier}  ·  ${invoiceNo}  ·  ${ids}`;
  const depth = item.reinspectionDepth ?? 0;
  if (depth <= 0) return base;
  if (depth === 1) return `${base}  ·  Reinspection`;
  return `${base}  ·  Reinspection ${depth}`;
}
