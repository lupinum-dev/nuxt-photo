import { watch } from 'vue'
import { devWarn, isDev } from '../../core/env'

/** Warn once when a setup-time component option changes without a remount. */
export function warnOnSetupOptionChanges(
  component: string,
  options: Readonly<Record<string, () => unknown>>,
) {
  if (!isDev()) return

  for (const [name, read] of Object.entries(options)) {
    const initial = read()
    let warned = false
    watch(read, (value) => {
      if (warned || Object.is(value, initial)) return
      warned = true
      devWarn(
        `${component}: "${name}" is a setup-time option; remount the component with a new key to change it`,
      )
    })
  }
}
