import type { Filter, LightboxFiltersMap } from '../types/filters'

export function createFilters() {
  const filters: { [K in keyof LightboxFiltersMap]?: Filter<K>[] } = {}

  function addFilter<T extends keyof LightboxFiltersMap>(
    name: T,
    fn: LightboxFiltersMap[T],
    priority = 100,
  ): void {
    if (!filters[name]) {
      // Mapped-type write requires a cast; the runtime value is Filter<T>[]
      ;(filters as Record<string, Filter<T>[]>)[name] = []
    }
    filters[name]!.push({ fn, priority })
    filters[name]!.sort((a, b) => a.priority - b.priority)
  }

  function removeFilter<T extends keyof LightboxFiltersMap>(
    name: T,
    fn: LightboxFiltersMap[T],
  ): void {
    if (filters[name]) {
      // Mapped-type write requires a cast; filter preserves Filter<T>[] element type
      ;(filters as Record<string, Filter<T>[]>)[name] = filters[name]!.filter(f => f.fn !== fn)
    }
  }

  function applyFilters<T extends keyof LightboxFiltersMap>(
    name: T,
    ...args: Parameters<LightboxFiltersMap[T]>
  ): Parameters<LightboxFiltersMap[T]>[0] {
    filters[name]?.forEach((filter) => {
      // TypeScript cannot spread a generic tuple into a mapped-type function;
      // the cast is limited to the call site and preserves the return type contract.
      ;(args as unknown[])[0] = (filter.fn as (...a: unknown[]) => Parameters<LightboxFiltersMap[T]>[0])(
        ...(args as unknown[]),
      )
    })
    return args[0]
  }

  return { addFilter, removeFilter, applyFilters, filters }
}

export type Filters = ReturnType<typeof createFilters>
