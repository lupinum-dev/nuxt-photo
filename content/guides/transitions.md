---
title: Transitions
description: FLIP animations, fade fallbacks, and transition configuration.
navigation: true
---

# Transitions

nuxt-photo uses animated transitions when opening and closing the lightbox. The default mode (`'auto'`) picks the best transition based on whether the source thumbnail is visible on screen.

## Transition Modes

| Mode     | Description                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `'auto'` | Uses FLIP when the thumbnail is visible above a threshold, fades otherwise. This is the default.                                      |
| `'flip'` | Always attempts a FLIP (connected) transition from thumbnail to lightbox. Falls back to fade if the thumbnail rect can't be captured. |
| `'fade'` | Simple fade-in transition. No thumbnail position tracking.                                                                            |
| `'none'` | Instant open/close with no animation.                                                                                                 |

Set the transition mode on `PhotoAlbum`, `PhotoGroup`, or `useLightboxProvider`:

```vue
<PhotoAlbum :photos="photos" transition="fade" />

<PhotoGroup transition="flip">
  <PhotoAlbum :photos="photos" />
</PhotoGroup>
```

## TransitionModeConfig

For fine-grained control, pass an object:

```vue
<PhotoAlbum
  :photos="photos"
  :transition="{ mode: 'auto', autoThreshold: 0.3 }"
/>
```

| Property        | Type             | Default  | Description                                                                                                                    |
| --------------- | ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `mode`          | `TransitionMode` | `'auto'` | The transition mode.                                                                                                           |
| `autoThreshold` | `number`         | `0.5`    | In `'auto'` mode, the minimum visibility ratio (0–1) of the thumbnail for a FLIP transition. Below this, fade is used instead. |

## How FLIP Transitions Work

FLIP (First, Last, Invert, Play) transitions animate the photo from its thumbnail position to its lightbox position:

1. **First:** Capture the thumbnail's bounding rect
2. **Last:** Calculate the lightbox slide's target rect
3. **Invert:** Position a "ghost" image at the thumbnail's location
4. **Play:** Animate the ghost from the thumbnail rect to the target rect

The ghost image is rendered by the [`LightboxPortal`](/docs/components/primitives#lightboxportal) component. During the transition, the source thumbnail is hidden (opacity: 0) to avoid visual duplication.

### Open Transition Plan

The system produces an `OpenTransitionPlan` describing the chosen animation:

| Mode           | When                                      | Description                          |
| -------------- | ----------------------------------------- | ------------------------------------ |
| `'connected'`  | Thumbnail visible, geometry valid         | Full FLIP from thumbnail to slide    |
| `'fade'`       | Thumbnail not visible or mode is `'fade'` | Fade in the lightbox                 |
| `'scale-fade'` | Thumbnail visible but geometry issues     | Scale-fade from approximate position |

### Close Transition Plan

On close, the system plans a `CloseTransitionPlan`:

| Mode        | When                                 | Description                        |
| ----------- | ------------------------------------ | ---------------------------------- |
| `'flip'`    | Thumbnail ref exists and is visible  | Animate back to thumbnail position |
| `'fade'`    | Thumbnail not visible or mode forced | Fade out                           |
| `'instant'` | Mode is `'none'`                     | Immediate close                    |

If the thumbnail has scrolled off-screen during viewing, the system may first scroll it into view before playing the flip animation.

## Reduced Motion

When the user's system has `prefers-reduced-motion: reduce` enabled, transitions automatically fall back to `'fade'` or `'none'` regardless of the configured mode. This respects accessibility preferences without any additional configuration.
