import type { SQLiteDatabase } from 'expo-sqlite';

import type { ReinspectionScope } from '@/types';

export interface FailedItems extends ReinspectionScope {
  productIds: string[];
  totalFailures: number;
}

interface ResultRow {
  product_id: string;
  point_key: string;
  type: string;
  value: string | null;
  passed: number;
}

/**
 * Rules mirror pdf-generator.ts:
 * - Numeric attributes/GIPs with an empty value → N/A (not a failure).
 * - Otherwise passed === 0 → failure.
 */
export async function getFailedItems(db: SQLiteDatabase, inspectionId: string): Promise<FailedItems> {
  const rows = await db.getAllAsync<ResultRow>(
    'SELECT product_id, point_key, type, value, passed FROM inspection_results WHERE inspection_id = ?',
    [inspectionId],
  );

  const attrNumericRows = await db.getAllAsync<{ key: string; is_numeric: number }>(
    'SELECT key, is_numeric FROM column_configs',
  );
  const attrIsNumeric = new Map(attrNumericRows.map((r) => [r.key, r.is_numeric === 1]));

  const gipNumericRows = await db.getAllAsync<{ key: string; is_numeric: number }>(
    'SELECT key, is_numeric FROM global_inspection_points',
  );
  const gipIsNumeric = new Map(gipNumericRows.map((r) => [r.key, r.is_numeric === 1]));

  const attrKeys = new Set<string>();
  const gipKeys = new Set<string>();
  const ipsByProduct: Record<string, Set<number>> = {};
  const productIds = new Set<string>();
  let totalFailures = 0;

  for (const r of rows) {
    if (r.passed === 1) continue;
    const valueEmpty = r.value == null || r.value.trim() === '';

    if (r.type === 'attribute' && r.point_key.startsWith('attr:')) {
      const key = r.point_key.slice(5);
      if (attrIsNumeric.get(key) && valueEmpty) continue;
      attrKeys.add(key);
      productIds.add(r.product_id);
      totalFailures++;
    } else if (r.type === 'global_inspection_point' && r.point_key.startsWith('gip:')) {
      const key = r.point_key.slice(4);
      if (gipIsNumeric.get(key) && valueEmpty) continue;
      gipKeys.add(key);
      productIds.add(r.product_id);
      totalFailures++;
    } else if (r.type === 'inspection_point' && r.point_key.startsWith('ip:')) {
      const idx = Number(r.point_key.slice(3));
      if (!Number.isFinite(idx)) continue;
      if (!ipsByProduct[r.product_id]) ipsByProduct[r.product_id] = new Set();
      ipsByProduct[r.product_id].add(idx);
      productIds.add(r.product_id);
      totalFailures++;
    }
  }

  const ipsByProductArr: Record<string, number[]> = {};
  for (const [pid, set] of Object.entries(ipsByProduct)) {
    ipsByProductArr[pid] = Array.from(set).sort((a, b) => a - b);
  }

  return {
    productIds: Array.from(productIds),
    attrKeys: Array.from(attrKeys),
    gipKeys: Array.from(gipKeys),
    ipsByProduct: ipsByProductArr,
    totalFailures,
  };
}
