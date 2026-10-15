/** Trim and collapse internal whitespace for display storage. */
export function formatCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** Case-insensitive key used to detect duplicates. */
export function normalizeCategoryKey(name: string): string {
  return formatCategoryName(name).toLowerCase();
}

/** True when two labels refer to the same logical category. */
export function categoriesMatch(a: string, b: string): boolean {
  return normalizeCategoryKey(a) === normalizeCategoryKey(b);
}

/**
 * Merge candidate names into an existing list without case/whitespace duplicates.
 * Existing list casing wins when keys collide.
 */
export function mergeCategoryNames(existing: string[], candidates: string[]): string[] {
  const merged = [...existing];
  const seen = new Set(merged.map((name) => normalizeCategoryKey(name)));

  for (const candidate of candidates) {
    const formatted = formatCategoryName(candidate);

    if (formatted.length === 0) {
      continue;
    }

    const key = normalizeCategoryKey(formatted);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(formatted);
  }

  return merged;
}
