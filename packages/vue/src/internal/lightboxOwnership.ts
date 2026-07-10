type LightboxOwner = {
  readonly id: symbol
  readonly close: () => Promise<void>
}

let activeOwner: LightboxOwner | null = null
let handoff: Promise<void> = Promise.resolve()

/** Ensure only one provider owns modal focus and page isolation at a time. */
export function acquireLightboxOwnership(owner: LightboxOwner): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  const acquisition = handoff.then(async () => {
    if (activeOwner?.id === owner.id) return
    const previous = activeOwner
    if (previous) await previous.close()
    activeOwner = owner
  })
  handoff = acquisition.catch(() => {})
  return acquisition
}

export function releaseLightboxOwnership(id: symbol): void {
  if (activeOwner?.id === id) activeOwner = null
}
