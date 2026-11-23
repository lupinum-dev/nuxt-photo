/**
 * The ambient glow behind the photo follows the photo's motion instead of starting after it.
 * The glow is a primitive a custom lightbox may leave out, so the lightbox does not own it: a
 * mounted `LightboxAmbient` connects here, and the track, the fade modes and the open tell it
 * what they show. Photos are named by their index in the collection.
 */
export type GlowFollower = {
  /**
   * The track shows photo `to` beside photo `from`, `share` (0 to 1) of the way to it. With
   * `to` null only `from` shows. Called on every pointer move of a swipe.
   */
  show(from: number, to: number | null, share: number): void
  /**
   * A settle from photo `from` toward photo `to`: `shares` are `to`'s share of the way on the
   * settle's samples, played linearly over `duration`. Returns the opacity animation, paused,
   * for the track to start with its own; null when there is nothing to animate.
   */
  settle(from: number, to: number, shares: number[], duration: number): Animation | null
  /** The fade modes: photo `to` fades in over the active photo with this timing. */
  fade(to: number, timing: { duration: number; delay: number; easing: string }): void
  /** Resolves once the active photo's glow is painted, or could not be. */
  ready(): Promise<unknown>
}

export function createGlowChannel() {
  let follower: GlowFollower | null = null
  return {
    /** Connect a glow; returns the disconnect. */
    connect(glow: GlowFollower) {
      follower = glow
      return () => {
        if (follower === glow) follower = null
      }
    },
    current: () => follower,
  }
}

export type GlowChannel = ReturnType<typeof createGlowChannel>
