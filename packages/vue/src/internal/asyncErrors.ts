import { getCurrentInstance } from 'vue'

/** Route autonomous async failures through Vue instead of losing rejections. */
export function useAsyncErrorReporter() {
  const instance = getCurrentInstance()

  return function reportAsyncError(operation: string, task: Promise<unknown>): void {
    void task.catch((error: unknown) => {
      const info = `nuxt-photo:${operation}`
      const handler = instance?.appContext.config.errorHandler
      if (handler) {
        try {
          handler(error, instance?.proxy ?? null, info)
        } catch (handlerError) {
          console.error(`[nuxt-photo] Vue error handler failed for ${operation}`, {
            error,
            handlerError,
          })
        }
        return
      }
      console.error(`[nuxt-photo] ${operation} failed`, error)
    })
  }
}
