declare global {
  interface ImportMeta {
    env: {
      DEV?: boolean
      [key: string]: unknown
    }
  }
}

export {}
