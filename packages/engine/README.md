# @nuxt-photo/engine

Framework-free lightbox orchestration for Nuxt Photo.

Use this package when you want the lightbox runtime below Vue. Most apps should stay on `@nuxt-photo/vue` or `@nuxt-photo/nuxt`.

## Install

```bash
pnpm add @nuxt-photo/engine
```

## Example

`createLightboxEngine()` owns lightbox state and commands without depending on Vue.

```ts
import { createLightboxEngine } from '@nuxt-photo/engine'

const engine = createLightboxEngine({
  photos: [
    { id: 'desert', src: '/photos/desert.jpg', width: 1280, height: 800 },
    { id: 'ocean', src: '/photos/ocean.jpg', width: 960, height: 1200 },
  ],
})

engine.open(0)
engine.markOpened()

console.log(engine.getState().status) // 'open'
```

## What it provides

- `createLightboxEngine()`
- `LightboxEngineState` and related engine types
- `LightboxTransitionOption` for transition configuration

## When to use it

Reach for `@nuxt-photo/engine` only when you are deliberately building below the Vue layer:

- a custom framework adapter
- a headless controller outside Vue reactivity
- tests around lightbox state transitions without DOM or component setup

## Where next

- [Root documentation](../../README.md)
- [Vue package guide](../vue/README.md)
