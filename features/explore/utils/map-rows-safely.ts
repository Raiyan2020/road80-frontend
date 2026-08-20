export interface SkippedRow {
  index: number;
  reason: string;
}

export interface SafeMapResult<TOut> {
  items: TOut[];
  skipped: SkippedRow[];
}

/**
 * Map API rows to view models, dropping any row that fails instead of failing
 * the whole page.
 *
 * `mapRawExploreToListing` ends in `ListingSchema.parse()`, which throws on a
 * single malformed row — a null `title` is enough, since `ads.title` is
 * nullable server-side and `localizedTitle()` returns `?string`. Run inside a
 * TanStack Query `queryFn`, a bare `rows.map(...)` turned that one bad ad into
 * a rejected query, so the entire explore grid rendered empty. One unusable
 * listing must cost one listing, not the page.
 */
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
