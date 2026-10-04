export default defineNuxtRouteMiddleware(() => {
  const runs = useState('lightbox-middleware-runs', () => 0)
  // Count the hydration run after hydration so the SSR counter remains identical.
  if (import.meta.client && useNuxtApp().isHydrating) onNuxtReady(() => runs.value++)
  else runs.value++
})
