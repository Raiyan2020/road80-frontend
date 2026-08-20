export interface SkippedRow {
  index: number;
  reason: string;
}

export interface SafeMapResult<TOut> {
  items: TOut[];
  skipped: SkippedRow[];
}

export function mapRowsSafely<TIn, TOut>(
  rows: readonly TIn[] | null | undefined,
  mapRow: (row: TIn, index: number) => TOut,
): SafeMapResult<TOut> {
  if (!Array.isArray(rows)) return { items: [], skipped: [] };

  const items: TOut[] = [];
  const skipped: SkippedRow[] = [];

  rows.forEach((row, index) => {
    try {
      items.push(mapRow(row, index));
    } catch (error) {
      skipped.push({
        index,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return { items, skipped };
}
