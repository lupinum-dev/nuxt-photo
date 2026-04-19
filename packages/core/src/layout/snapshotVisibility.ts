export interface SnapshotVisibilityInput {
  spanKey: string
  condition: string
}

/**
 * Emits `@container` hide/show CSS for per-breakpoint SSR snapshots.
 *
 * Strategy:
 *   - A base rule inside `@container <name> (min-width: 0)` hides every snapshot in the container.
 *   - One rule per span inside the span's own `@container <name> <condition>` shows the matching
 *     snapshot via attribute selector, which has higher specificity than the base class rule.
 *
 * Scoping is handled entirely by `@container <name>` — no root-class selector is needed.
 * Single-span input returns an empty string; the caller should just render the snapshot with
 * no `display:none` and skip the stylesheet.
 */
export function computeBreakpointVisibilityCSS(
  snapshots: readonly SnapshotVisibilityInput[],
  containerName: string,
  snapshotClass: string,
): string {
  if (snapshots.length <= 1) return ''

  const selector = `.${snapshotClass}`
  const rules: string[] = [
    `@container ${containerName} (min-width: 0){${selector}{display:none}}`,
  ]
  for (const snap of snapshots) {
    if (!snap.condition) continue
    rules.push(
      `@container ${containerName} ${snap.condition}{${selector}[data-bp=${snap.spanKey}]{display:flex}}`,
    )
  }
  return rules.join('\n')
}
