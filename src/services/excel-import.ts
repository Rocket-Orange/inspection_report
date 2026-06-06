import { File } from 'expo-file-system';
import * as XLSX from 'xlsx';

import type { ColumnMeta, ParsedColumnSetting, ParsedExcelData, Product, ProductInspectionPoint, Severity, ToleranceType } from '@/types';

function generateColumnKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function isNumericColumn(values: (string | number | undefined)[]): boolean {
  const nonEmpty = values.filter((v) => v !== undefined && v !== null && v !== '');
  if (nonEmpty.length === 0) return false;
  const numericCount = nonEmpty.filter((v) => !isNaN(Number(v))).length;
  return numericCount / nonEmpty.length > 0.7;
}

export function parseExcel(base64: string): ParsedExcelData {
  const workbook = XLSX.read(base64, { type: 'base64' });

  const productSheetName = workbook.SheetNames[0];
  const inspectionSheetName = workbook.SheetNames[2];

  const productSheet = workbook.Sheets[productSheetName];
  const inspectionSheet = workbook.Sheets[inspectionSheetName];

  const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(productSheet, {
    header: 1,
    defval: '',
  }) as (string | number)[][];

  if (rawRows.length < 2) {
    return { products: [], columnMeta: [], inspectionPoints: [] };
  }

  const headers = rawRows[0].map((h) => String(h).trim());
  const dataRows = rawRows.slice(1);

  const columnMeta: ColumnMeta[] = [];
  for (let colIdx = 1; colIdx < headers.length; colIdx++) {
    const label = headers[colIdx];
    if (!label) continue;
    const key = generateColumnKey(label) || `col_${colIdx}`;
    const sampleValues = dataRows.slice(0, 20).map((row) => row[colIdx]);
    columnMeta.push({ key, label, isNumeric: isNumericColumn(sampleValues), sortOrder: colIdx - 1 });
  }

  const products: Product[] = [];
  for (const row of dataRows) {
    const id = String(row[0] || '').trim();
    if (!id) continue;
    const name = String(row[2] || row[1] || id).trim();
    const attributes: Record<string, string | number> = {};
    for (let colIdx = 1; colIdx < headers.length; colIdx++) {
      const meta = columnMeta[colIdx - 1];
      if (!meta) continue;
      const raw = row[colIdx];
      attributes[meta.key] =
        meta.isNumeric && raw !== '' && raw !== undefined ? Number(raw) : String(raw ?? '');
    }
    products.push({ id, name, attributes });
  }

  const inspectionPoints: ProductInspectionPoint[] = [];
  if (inspectionSheet) {
    const ipRows = XLSX.utils.sheet_to_json<(string | number)[]>(inspectionSheet, {
      header: 1,
      defval: '',
    }) as (string | number)[][];

    // Track next index per product across all rows (a product may span multiple rows)
    const productPointIndices = new Map<string, number>();

    for (let rowIdx = 1; rowIdx < ipRows.length; rowIdx++) {
      const row = ipRows[rowIdx];
      const productId = String(row[0] || '').trim();
      if (!productId) continue;
      for (let colIdx = 2; colIdx < row.length; colIdx++) {
        const text = String(row[colIdx] || '').trim();
        if (text) {
          const pointIndex = productPointIndices.get(productId) ?? 0;
          inspectionPoints.push({ productId, pointIndex, pointText: text });
          productPointIndices.set(productId, pointIndex + 1);
        }
      }
    }
  }

  const gipSheetName = workbook.SheetNames.find(
    (n) => n.toLowerCase() === 'global inspection points',
  );
  let globalInspectionPoints: ParsedColumnSetting[] | undefined;
  if (gipSheetName !== undefined) {
    const gipSheet = workbook.Sheets[gipSheetName];
    const gipRows = XLSX.utils.sheet_to_json<Record<string, string | number>>(gipSheet, { defval: '' });
    globalInspectionPoints = [];
    for (const row of gipRows) {
      const label = String(row['Label'] ?? '').trim();
      if (!label) continue;
      const rawKey = String(row['Key'] ?? '').trim();
      const key = rawKey || generateColumnKey(label);
      if (!key) continue;
      const isNumeric = String(row['Type']).trim().toLowerCase() === 'numeric';
      const sevRaw = String(row['Criticality']).trim().toLowerCase();
      const severity: Severity = (['high', 'medium', 'low'] as const).includes(sevRaw as Severity)
        ? (sevRaw as Severity)
        : 'medium';
      let toleranceType: ToleranceType | null = null;
      let toleranceValue: number | null = null;
      if (isNumeric) {
        const tolTypeRaw = String(row['Tolerance Type']).trim().toLowerCase();
        if (tolTypeRaw === 'absolute') toleranceType = 'absolute';
        else if (tolTypeRaw === 'percent') toleranceType = 'percent';
        else if (tolTypeRaw === 'min') toleranceType = 'min';
        else if (tolTypeRaw === 'max') toleranceType = 'max';
        const tv = Number(row['Tolerance Value']);
        if (isFinite(tv)) toleranceValue = tv;
      }
      globalInspectionPoints.push({
        key,
        label,
        visible: String(row['Enabled']).trim().toLowerCase() === 'yes',
        isNumeric,
        severity,
        group: String(row['Group'] ?? '').trim() || null,
        toleranceType,
        toleranceValue,
        instructions: String(row['Instructions'] ?? '').trim() || null,
      });
    }
  }

  return { products, columnMeta, inspectionPoints, globalInspectionPoints };
}

export async function importSpreadsheet(fileUri: string): Promise<ParsedExcelData> {
  const base64 = await new File(fileUri).base64();
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(parseExcel(base64));
      } catch (err) {
        reject(err);
      }
    }, 0);
  });
}
